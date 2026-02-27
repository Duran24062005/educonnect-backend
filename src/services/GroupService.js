import {
    groupRepository,
    teacherRepository,
    studentRepository,
    groupTeacherRepository,
    gradeAreaRepository,
} from '../repositories/PersonProfileRepository.js';
import { schoolYearRepository, gradeRepository, areaRepository } from '../repositories/AcademicRepository.js';
import { enrollmentRepository } from '../repositories/EvaluationRepository.js';
import { AppError } from '../utils/error.js';

/**
 * GroupService
 * Lógica de negocio para grupos, inscripciones y asignaciones
 */
class GroupService {
    // ===========================
    // GRUPOS
    // ===========================

    async createGroup(data) {
        const { name, grade_id, school_year_id, max_capacity } = data;

        if (!name || !grade_id || !school_year_id || !max_capacity) {
            throw new AppError('Nombre, grado, año escolar y capacidad son requeridos', 400);
        }

        if (max_capacity < 1) throw new AppError('La capacidad debe ser mayor a 0', 400);

        const grade = await gradeRepository.findById(grade_id);
        if (!grade) throw new AppError('Grado no encontrado', 404);

        const schoolYear = await schoolYearRepository.findById(school_year_id);
        if (!schoolYear) throw new AppError('Año escolar no encontrado', 404);

        return await groupRepository.create({ name, grade_id, school_year_id, max_capacity });
    }

    async getGroupsBySchoolYear(school_year_id) {
        return await groupRepository.findBySchoolYear(school_year_id);
    }

    async getGroupById(id) {
        const group = await groupRepository.findById(id);
        if (!group) throw new AppError('Grupo no encontrado', 404);
        return group;
    }

    async updateGroup(id, data) {
        const group = await groupRepository.findById(id);
        if (!group) throw new AppError('Grupo no encontrado', 404);
        return await groupRepository.update(id, data);
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

    async enrollStudent(student_id, group_id, school_year_id) {
        if (!student_id || !group_id || !school_year_id) {
            throw new AppError('Estudiante, grupo y año escolar son requeridos', 400);
        }

        const student = await studentRepository.findById(student_id);
        if (!student) throw new AppError('Estudiante no encontrado', 404);

        const group = await groupRepository.findById(group_id);
        if (!group) throw new AppError('Grupo no encontrado', 404);

        // Verificar que el estudiante no ya esté inscrito este año
        if (await enrollmentRepository.exists(student_id, school_year_id)) {
            throw new AppError('El estudiante ya está inscrito en este año escolar', 400);
        }

        // Verificar capacidad del grupo
        const currentCount = await enrollmentRepository.countActiveByGroup(group_id);
        if (currentCount >= group.max_capacity) {
            throw new AppError('El grupo ha alcanzado su capacidad máxima', 400);
        }

        const enrollment = await enrollmentRepository.create({
            student_id,
            school_year_id,
            group_id,
            status: 'active',
        });

        // Actualizar group_id en el perfil del estudiante
        await studentRepository.update(student_id, { group_id });

        return enrollment;
    }

    async changeEnrollmentStatus(enrollment_id, status) {
        const validStatuses = ['active', 'transferred', 'retired'];
        if (!validStatuses.includes(status)) {
            throw new AppError('Estado inválido. Usa: active, transferred, retired', 400);
        }
        return await enrollmentRepository.update(enrollment_id, { status });
    }

    async getStudentsByGroup(group_id) {
        return await enrollmentRepository.findByGroup(group_id, 'active');
    }

    async getEnrollmentsByStudent(student_id) {
        return await enrollmentRepository.findByStudent(student_id);
    }

    // ===========================
    // ASIGNACIÓN DE PROFESORES
    // ===========================

    async assignTeacherToGroup(teacher_id, group_id, area_id) {
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

        return await groupTeacherRepository.create({ teacher_id, group_id, area_id });
    }

    async getTeachersByGroup(group_id) {
        return await groupTeacherRepository.findByGroup(group_id);
    }

    async getGroupsByTeacher(teacher_id) {
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