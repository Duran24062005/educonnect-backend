// @ts-nocheck
import {
    groupRepository,
    teacherRepository,
    studentRepository,
    groupTeacherRepository,
    gradeAreaRepository,
} from '../../repositories/PersonProfileRepository.js';
import { schoolYearRepository, gradeRepository, areaRepository } from '../../repositories/AcademicRepository.js';
import { enrollmentRepository } from '../../repositories/EvaluationRepository.js';
import UserRepository from '../../repositories/UserRepository.js';
import { AppError } from '../../utils/error.js';
import {
    isAdmin,
    resolveTeacherByUserId,
    resolveStudentByUserId,
    assertCanAccessGroup,
} from '../../shared/accessScope.service.js';
import AuditLogService from '../audit/AuditLogService.js';
import Campus from '../../models/CampusModel.js';
import SchoolShift from '../../models/SchoolShiftModel.js';

const toIdString = (value) => value?._id?.toString?.() || value?.toString?.() || null;

/**
 * GroupService
 * Lógica de negocio para grupos, inscripciones y asignaciones
 */
class GroupService {
    async withCapacityMetrics(group) {
        if (!group) return group;

        const active_enrollments = await enrollmentRepository.countActiveByGroup(group._id);
        const max_capacity = Number(group.max_capacity || 0);
        const available_slots = Math.max(max_capacity - active_enrollments, 0);

        const payload = typeof group.toObject === 'function' ? group.toObject() : { ...group };
        return {
            ...payload,
            active_enrollments,
            available_slots,
        };
    }

    // ===========================
    // GRUPOS
    // ===========================

    async resolveGroupStructure({ campus_id = null, shift_id = null } = {}) {
        const refs = {};
        if (campus_id) {
            const campus = await Campus.findOne({ _id: campus_id, status: 'active' });
            if (!campus) throw new AppError('Sede no encontrada o inactiva', 404);
            refs.campus_id = campus._id;
        } else if (campus_id === null) refs.campus_id = null;
        if (shift_id) {
            const shift = await SchoolShift.findOne({ _id: shift_id, status: 'active' });
            if (!shift) throw new AppError('Jornada no encontrada o inactiva', 404);
            refs.shift_id = shift._id;
        } else if (shift_id === null) refs.shift_id = null;
        return refs;
    }

    async createGroup(data) {
        const { name, grade_id, school_year_id, max_capacity, campus_id, shift_id } = data;

        if (!name || !grade_id || !school_year_id || !max_capacity) {
            throw new AppError('Nombre, grado, año escolar y capacidad son requeridos', 400);
        }

        if (max_capacity < 1) throw new AppError('La capacidad debe ser mayor a 0', 400);

        const grade = await gradeRepository.findById(grade_id);
        if (!grade) throw new AppError('Grado no encontrado', 404);

        const schoolYear = await schoolYearRepository.findById(school_year_id);
        if (!schoolYear) throw new AppError('Año escolar no encontrado', 404);

        const structure = await this.resolveGroupStructure({ campus_id, shift_id });
        return await groupRepository.create({ name, grade_id, school_year_id, max_capacity, ...structure });
    }

    async getGroupsBySchoolYear(school_year_id) {
        const groups = await groupRepository.findBySchoolYear(school_year_id);
        return await Promise.all(groups.map((group) => this.withCapacityMetrics(group)));
    }

    async getGroupById(id, actorId, actorRole) {
        await assertCanAccessGroup({ userId: actorId, role: actorRole, groupId: id });
        const group = await groupRepository.findById(id);
        if (!group) throw new AppError('Grupo no encontrado', 404);
        return await this.withCapacityMetrics(group);
    }

    normalizeTeacherOption(user) {
        const person = user?.person_id || user?.person || user?.user_id?.person_id || user?.user_id?.person || null;
        return {
            id: user?.teacher_id?._id || user?.teacher_id || null,
            label: person
                ? `${person.first_name || ''} ${person.last_name || ''}`.trim() + ` (${user?.email || 'sin correo'})`
                : user?.email || 'Sin correo',
        };
    }

    async getGroupDetailSummary(id) {
        const group = await this.getGroupById(id, null, 'admin');
        const students = await this.getStudentsByGroup(id, null, 'admin');
        const teachers = await this.getTeachersByGroup(id, null, 'admin');

        const currentGradeId = group?.grade_id?._id || group?.grade_id || null;
        const [gradeAreas, allAreas, teachersPage] = await Promise.all([
            currentGradeId ? this.getAreasByGrade(currentGradeId) : [],
            areaRepository.findAll(),
            UserRepository.findByRole('teacher', 1, 500),
        ]);

        return {
            group,
            students,
            teachers,
            grade_areas: gradeAreas,
            areas: allAreas,
            teacher_options: teachersPage.users
                .map((user) => this.normalizeTeacherOption(user))
                .filter((entry) => Boolean(entry.id)),
        };
    }

    async updateGroup(id, data) {
        const group = await groupRepository.findById(id);
        if (!group) throw new AppError('Grupo no encontrado', 404);
        const structure = {};
        if (Object.prototype.hasOwnProperty.call(data, 'campus_id') || Object.prototype.hasOwnProperty.call(data, 'shift_id')) {
            Object.assign(structure, await this.resolveGroupStructure({
                campus_id: Object.prototype.hasOwnProperty.call(data, 'campus_id') ? data.campus_id : group.campus_id,
                shift_id: Object.prototype.hasOwnProperty.call(data, 'shift_id') ? data.shift_id : group.shift_id,
            }));
        }
        return await groupRepository.update(id, { ...data, ...structure });
    }

    async deleteGroup(id) {
        const group = await groupRepository.findById(id);
        if (!group) throw new AppError('Grupo no encontrado', 404);

        // Verificar si hay estudiantes inscritos
        const activeStudents = await enrollmentRepository.countActiveByGroup(id);
        if (activeStudents > 0) {
            throw new AppError('No se puede eliminar un grupo con estudiantes activos', 400);
        }

        await groupTeacherRepository.deleteByGroup(id);
        await groupRepository.delete(id);
        return { message: 'Grupo eliminado' };
    }

    // ===========================
    // INSCRIPCIONES
    // ===========================

    async enrollStudent(student_id, group_id, school_year_id, auditContext = {}, structure = {}) {
        if (!student_id || !group_id || !school_year_id) {
            throw new AppError('Estudiante, grupo y año escolar son requeridos', 400);
        }

        const student = await studentRepository.findById(student_id);
        if (!student) throw new AppError('Estudiante no encontrado', 404);

        const group = await groupRepository.findById(group_id);
        if (!group) throw new AppError('Grupo no encontrado', 404);
        if (group.school_year_id?._id?.toString() !== school_year_id.toString() &&
            group.school_year_id?.toString() !== school_year_id.toString()) {
            throw new AppError('El grupo no pertenece al año escolar enviado', 400);
        }

        // Verificar que el estudiante no ya esté inscrito este año
        if (await enrollmentRepository.existsActive(student_id, school_year_id)) {
            throw new AppError('El estudiante ya está inscrito en este año escolar', 400);
        }

        // Verificar capacidad del grupo
        const currentCount = await enrollmentRepository.countActiveByGroup(group_id);
        if (currentCount >= group.max_capacity) {
            throw new AppError('El grupo ha alcanzado su capacidad máxima', 400);
        }

        const structureRefs = await this.resolveEnrollmentStructure(structure);

        const enrollment = await enrollmentRepository.create({
            student_id,
            school_year_id,
            group_id,
            status: 'active',
            ...structureRefs,
        });

        // Actualizar group_id en el perfil del estudiante
        await studentRepository.update(student_id, { group_id });

        await AuditLogService.record({
            actorUserId: auditContext.actorUserId,
            actorRole: auditContext.actorRole,
            action: 'enrollment.created',
            entityType: 'Enrollment',
            entityId: enrollment._id,
            before: null,
            after: enrollment,
            institutionId: auditContext.institutionId,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
            metadata: {
                student_id,
                group_id,
                school_year_id,
                ...(auditContext.metadata || {}),
            },
        });

        return enrollment;
    }

    async transferEnrollment(student_id, school_year_id, to_group_id, reason = null, observations = null, auditContext = {}, structure = {}) {
        if (!student_id || !school_year_id || !to_group_id) {
            throw new AppError('Estudiante, año escolar y grupo destino son requeridos', 400);
        }

        const student = await studentRepository.findById(student_id);
        if (!student) throw new AppError('Estudiante no encontrado', 404);

        const activeEnrollment = await enrollmentRepository.findActiveByStudentAndYear(student_id, school_year_id);
        if (!activeEnrollment) {
            throw new AppError('El estudiante no tiene matrícula activa en ese año escolar', 404);
        }

        if (activeEnrollment.group_id.toString() === to_group_id.toString()) {
            throw new AppError('El grupo destino debe ser diferente al grupo actual', 400);
        }

        const targetGroup = await groupRepository.findById(to_group_id);
        if (!targetGroup) throw new AppError('Grupo destino no encontrado', 404);
        if (targetGroup.school_year_id?._id?.toString() !== school_year_id.toString() &&
            targetGroup.school_year_id?.toString() !== school_year_id.toString()) {
            throw new AppError('El grupo destino no pertenece al año escolar enviado', 400);
        }

        const currentCount = await enrollmentRepository.countActiveByGroup(to_group_id);
        if (currentCount >= targetGroup.max_capacity) {
            throw new AppError('El grupo destino ha alcanzado su capacidad máxima', 400);
        }

        const structureRefs = await this.resolveEnrollmentStructure(structure);

        await enrollmentRepository.update(activeEnrollment._id, {
            status: 'transferred',
            closed_at: new Date(),
            transfer_reason: reason || null,
            observations: observations || null,
        });

        const newEnrollment = await enrollmentRepository.create({
            student_id,
            school_year_id,
            group_id: to_group_id,
            status: 'active',
            previous_enrollment_id: activeEnrollment._id,
            transfer_reason: reason || null,
            observations: observations || null,
            ...structureRefs,
        });

        await studentRepository.update(student_id, { group_id: to_group_id });

        await AuditLogService.record({
            actorUserId: auditContext.actorUserId,
            actorRole: auditContext.actorRole,
            action: 'enrollment.transferred',
            entityType: 'Enrollment',
            entityId: newEnrollment._id,
            before: activeEnrollment,
            after: newEnrollment,
            institutionId: auditContext.institutionId,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
            metadata: {
                student_id,
                from_group_id: activeEnrollment.group_id,
                to_group_id,
                school_year_id,
                reason,
                ...(auditContext.metadata || {}),
            },
        });

        return newEnrollment;
    }

    async resolveEnrollmentStructure({ campus_id = null, shift_id = null } = {}) {
        const refs = {};
        if (campus_id) {
            const campus = await Campus.findOne({ _id: campus_id, status: 'active' });
            if (!campus) throw new AppError('Sede no encontrada o inactiva', 404);
            refs.campus_id = campus._id;
        }
        if (shift_id) {
            const shift = await SchoolShift.findOne({ _id: shift_id, status: 'active' });
            if (!shift) throw new AppError('Jornada no encontrada o inactiva', 404);
            refs.shift_id = shift._id;
        }
        return refs;
    }

    async changeEnrollmentStatus(enrollment_id, status, auditContext = {}) {
        const validStatuses = ['active', 'transferred', 'retired'];
        if (!validStatuses.includes(status)) {
            throw new AppError('Estado inválido. Usa: active, transferred, retired', 400);
        }

        const enrollment = await enrollmentRepository.findById(enrollment_id);
        if (!enrollment) {
            throw new AppError('Matrícula no encontrada', 404);
        }

        const updated = await enrollmentRepository.update(enrollment_id, {
            status,
            closed_at: status === 'active' ? null : new Date(),
        });

        await AuditLogService.record({
            actorUserId: auditContext.actorUserId,
            actorRole: auditContext.actorRole,
            action: `enrollment.${status}`,
            entityType: 'Enrollment',
            entityId: enrollment_id,
            before: enrollment,
            after: updated,
            institutionId: auditContext.institutionId,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
            metadata: {
                student_id: enrollment.student_id?._id || enrollment.student_id,
                ...(auditContext.metadata || {}),
            },
        });

        if (status === 'active') {
            await studentRepository.update(enrollment.student_id._id || enrollment.student_id, {
                group_id: enrollment.group_id._id || enrollment.group_id,
            });
            return updated;
        }

        const activeEnrollment = await enrollmentRepository.findActiveByStudent(
            enrollment.student_id._id || enrollment.student_id
        );

        await studentRepository.update(enrollment.student_id._id || enrollment.student_id, {
            group_id: activeEnrollment ? (activeEnrollment.group_id._id || activeEnrollment.group_id) : null,
        });

        return updated;
    }

    async getStudentsByGroup(group_id, actorId, actorRole) {
        await assertCanAccessGroup({ userId: actorId, role: actorRole, groupId: group_id });
        return await enrollmentRepository.findByGroup(group_id, 'active');
    }

    async getEnrollmentsByStudent(student_id, actorId, actorRole) {
        // El propio estudiante o un admin
        if (!isAdmin(actorRole)) {
            if (String(actorRole || '').toLowerCase() !== 'student') {
                throw new AppError('No tienes permiso para ver estas matrículas', 403);
            }
            const student = await resolveStudentByUserId(actorId);
            if (toIdString(student._id) !== toIdString(student_id)) {
                throw new AppError('No tienes permiso para ver estas matrículas', 403);
            }
        }
        return await enrollmentRepository.findByStudent(student_id);
    }

    async getEnrollmentReport(school_year_id, group_id = '', actorRole = 'admin') {
        if (!isAdmin(actorRole)) {
            throw new AppError('Solo administración puede descargar el reporte de matrículas', 403);
        }

        const enrollments = await enrollmentRepository.findBySchoolYear(school_year_id, 'active');
        const filtered = group_id
            ? enrollments.filter((enrollment) => toIdString(enrollment.group_id) === toIdString(group_id))
            : enrollments;

        return filtered.map((enrollment) => {
            const student = enrollment.student_id;
            const person = student?.user_id?.person_id;
            const fullName = ((person?.first_name || '') + ' ' + (person?.last_name || '')).trim();
            return {
                school_year: enrollment.school_year_id?.year || '',
                group: enrollment.group_id?.name || '',
                grade: enrollment.group_id?.grade_id?.name || '',
                student: fullName || student?.user_id?.email || '',
                email: student?.user_id?.email || '',
                campus: enrollment.campus_id?.name || '',
                shift: enrollment.shift_id?.name || '',
                status: enrollment.status || '',
            };
        });
    }

    // ===========================
    // ASIGNACIÓN DE PROFESORES
    // ===========================

    async assignTeacherToGroup(teacher_id, group_id, area_id, auditContext = {}) {
        if (!teacher_id || !group_id || !area_id) {
            throw new AppError('Profesor, grupo y área son requeridos', 400);
        }

        const teacher = await teacherRepository.findById(teacher_id);
        if (!teacher) throw new AppError('Profesor no encontrado', 404);

        const group = await groupRepository.findById(group_id);
        if (!group) throw new AppError('Grupo no encontrado', 404);

        const area = await areaRepository.findById(area_id);
        if (!area) throw new AppError('Área no encontrada', 404);

        // Verificar que el área esté en el grado
        const gradeAreaExists = await gradeAreaRepository.exists(group.grade_id._id || group.grade_id, area_id);
        if (!gradeAreaExists) {
            throw new AppError('Esta área no pertenece al grado del grupo', 400);
        }

        if (await groupTeacherRepository.exists(teacher_id, group_id, area_id)) {
            throw new AppError('Este profesor ya está asignado a este grupo en esta área', 400);
        }

        const assignment = await groupTeacherRepository.create({ teacher_id, group_id, area_id, school_year_id: group.school_year_id?._id || group.school_year_id });

        await AuditLogService.record({
            actorUserId: auditContext.actorUserId,
            actorRole: auditContext.actorRole,
            action: 'academic_assignment.created',
            entityType: 'GroupTeacher',
            entityId: assignment._id,
            before: null,
            after: assignment,
            institutionId: auditContext.institutionId,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
            metadata: {
                teacher_id,
                group_id,
                area_id,
                ...(auditContext.metadata || {}),
            },
        });

        return assignment;
    }

    async getTeachersByGroup(group_id, actorId, actorRole) {
        await assertCanAccessGroup({ userId: actorId, role: actorRole, groupId: group_id });
        return await groupTeacherRepository.findByGroup(group_id);
    }

    async getGroupsByTeacher(teacher_id, actorId, actorRole) {
        // El propio docente o un admin
        if (!isAdmin(actorRole)) {
            if (String(actorRole || '').toLowerCase() !== 'teacher') {
                throw new AppError('No tienes permiso para ver los grupos de este docente', 403);
            }
            const teacher = await resolveTeacherByUserId(actorId);
            if (toIdString(teacher._id) !== toIdString(teacher_id)) {
                throw new AppError('No tienes permiso para ver los grupos de este docente', 403);
            }
        }
        return await groupTeacherRepository.findByTeacher(teacher_id);
    }

    // ===========================
    // GRADE AREAS
    // ===========================

    async assignAreaToGrade(grade_id, area_id, weekly_hours) {
        if (!grade_id || !area_id || !weekly_hours) {
            throw new AppError('Grado, área y horas semanales son requeridos', 400);
        }

        if (weekly_hours < 1) throw new AppError('Mínimo 1 hora semanal', 400);

        const grade = await gradeRepository.findById(grade_id);
        if (!grade) throw new AppError('Grado no encontrado', 404);

        const area = await areaRepository.findById(area_id);
        if (!area) throw new AppError('Área no encontrada', 404);

        if (await gradeAreaRepository.exists(grade_id, area_id)) {
            throw new AppError('Esta área ya está asignada a este grado', 400);
        }

        return await gradeAreaRepository.create({ grade_id, area_id, weekly_hours });
    }

    async getAreasByGrade(grade_id) {
        return await gradeAreaRepository.findByGrade(grade_id);
    }
}

export default new GroupService();
