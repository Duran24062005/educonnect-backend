// @ts-nocheck
import AttendanceRepository from '../repositories/AttendanceRepository.js';
import AttendanceSession from '../models/AttendanceSessionModel.js';
import AttendanceRecord from '../models/AttendanceRecordModel.js';
import SchoolYear from '../models/SchoolYearModel.js';
import Period from '../models/PeriodModel.js';
import Group from '../models/GroupModel.js';
import Area from '../models/AreaModel.js';
import Teacher from '../models/TeacherModel.js';
import GroupTeacher from '../models/GroupTeacherModel.js';
import { enrollmentRepository } from '../repositories/EvaluationRepository.js';
import GuardianRepository from '../repositories/GuardianRepository.js';
import AppError from '../utils/AppError.js';
import AuditLogService from './AuditLogService.js';
import {
    assertCanAccessGroup,
    assertCanAccessStudentData,
    resolveTeacherByUserId,
} from './accessScope.service.js';

const toIdString = (value) => value?._id?.toString?.() || value?.toString?.() || null;

const dateValue = (value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) throw new AppError('La fecha de asistencia es inválida', 400);
    return date;
};

const dateLabel = (value) => new Date(value).toISOString().slice(0, 10);

const studentName = (student) => {
    const person = student?.user_id?.person_id;
    return `${person?.first_name || ''} ${person?.last_name || ''}`.trim() || student?.user_id?.email || 'Estudiante';
};

class AttendanceService {
    async validateSessionContext(data, actorId, actorRole) {
        const [schoolYear, group] = await Promise.all([
            SchoolYear.findById(data.school_year_id),
            Group.findById(data.group_id).populate('school_year_id').populate('grade_id'),
        ]);
        if (!schoolYear) throw new AppError('Año escolar no encontrado', 404);
        if (!group) throw new AppError('Grupo no encontrado', 404);
        if (toIdString(group.school_year_id) !== toIdString(schoolYear)) {
            throw new AppError('El grupo no pertenece al año escolar enviado', 400);
        }

        let period = null;
        if (data.period_id) {
            period = await Period.findById(data.period_id);
            if (!period) throw new AppError('Periodo no encontrado', 404);
            if (toIdString(period.school_year_id) !== toIdString(schoolYear)) {
                throw new AppError('El periodo no pertenece al año escolar enviado', 400);
            }
        }

        const area = data.area_id ? await Area.findById(data.area_id) : null;
        if (data.area_id && !area) throw new AppError('Área no encontrada', 404);

        let teacher = data.teacher_id ? await Teacher.findById(data.teacher_id) : null;
        if (data.teacher_id && !teacher) throw new AppError('Docente no encontrado', 404);

        if (String(actorRole).toLowerCase() === 'teacher') {
            teacher = await resolveTeacherByUserId(actorId);
            if (data.teacher_id && toIdString(data.teacher_id) !== toIdString(teacher._id)) {
                throw new AppError('Solo puedes registrar asistencia con tu perfil docente', 403);
            }
        }

        if (teacher) {
            const assignment = await GroupTeacher.findOne({
                teacher_id: teacher._id,
                group_id: group._id,
                ...(area ? { area_id: area._id } : {}),
            });
            if (!assignment) throw new AppError('El docente no tiene asignación para este grupo', 403);
        }

        if (period) {
            const attendanceDate = dateValue(data.date);
            if (attendanceDate < period.start_date || attendanceDate > period.end_date) {
                throw new AppError('La fecha está fuera del rango del periodo', 400);
            }
        }

        return { schoolYear, group, period, area, teacher };
    }

    async assertCanManageSession(userId, role, session) {
        if (String(role).toLowerCase() === 'admin') return;
        await assertCanAccessGroup({ userId, role, groupId: session.group_id });
        const teacher = await resolveTeacherByUserId(userId);
        if (session.teacher_id && toIdString(session.teacher_id) !== toIdString(teacher._id)) {
            throw new AppError('No tienes permiso para modificar esta sesión de asistencia', 403);
        }
    }

    serializeSession(session, records = []) {
        return {
            _id: toIdString(session._id),
            school_year: session.school_year_id ? { _id: toIdString(session.school_year_id), year: session.school_year_id.year } : null,
            period: session.period_id ? { _id: toIdString(session.period_id), name: session.period_id.name } : null,
            group: session.group_id ? { _id: toIdString(session.group_id), name: session.group_id.name, grade_name: session.group_id.grade_id?.name || null } : null,
            area: session.area_id ? { _id: toIdString(session.area_id), name: session.area_id.name } : null,
            teacher: session.teacher_id ? { _id: toIdString(session.teacher_id), name: studentName(session.teacher_id) } : null,
            date: dateLabel(session.date),
            topic: session.topic,
            status: session.status,
            records,
        };
    }

    serializeRecord(record) {
        return {
            _id: toIdString(record._id),
            student: {
                _id: toIdString(record.student_id?._id || record.student_id),
                full_name: studentName(record.student_id),
            },
            status: record.status,
            note: record.note || null,
            justification: record.justification || null,
            justified_at: record.justified_at || null,
        };
    }

    async createSession(data, actor) {
        const context = await this.validateSessionContext(data, actor.userId, actor.role);
        const existing = await AttendanceSession.findOne({
            group_id: data.group_id,
            date: dateValue(data.date),
            ...(data.area_id ? { area_id: data.area_id } : {}),
        });
        if (existing) throw new AppError('Ya existe una sesión de asistencia para este grupo, fecha y área', 409);

        const session = await AttendanceRepository.createSession({
            school_year_id: data.school_year_id,
            period_id: data.period_id || null,
            group_id: data.group_id,
            area_id: data.area_id || null,
            teacher_id: context.teacher?._id || data.teacher_id || null,
            date: dateValue(data.date),
            topic: data.topic || null,
            created_by_user_id: actor.userId,
        });

        const enrollments = await enrollmentRepository.findByGroup(data.group_id, 'active');
        await AttendanceRepository.createRecords(enrollments.map((enrollment) => ({
            session_id: session._id,
            student_id: enrollment.student_id?._id || enrollment.student_id,
            status: 'pending',
        })));

        const populated = await AttendanceRepository.findSessionById(session._id);
        await AuditLogService.record({
            actorUserId: actor.userId,
            actorRole: actor.role,
            action: 'attendance.session.created',
            entityType: 'AttendanceSession',
            entityId: session._id,
            before: null,
            after: populated,
            institutionId: actor.institutionId,
            ipAddress: actor.ipAddress,
            userAgent: actor.userAgent,
        });
        return this.serializeSession(populated, (await AttendanceRepository.findRecordsBySession(session._id)).map((record) => this.serializeRecord(record)));
    }

    async listSessions(query, actor) {
        const filter = { school_year_id: query.school_year_id };
        if (query.group_id) filter.group_id = query.group_id;
        if (query.from || query.to) {
            filter.date = {};
            if (query.from) filter.date.$gte = dateValue(query.from);
            if (query.to) filter.date.$lte = new Date(`${query.to}T23:59:59.999Z`);
        }
        const sessions = await AttendanceRepository.findSessions(filter);
        const visible = [];
        for (const session of sessions) {
            try {
                await this.assertCanManageSession(actor.userId, actor.role, session);
                visible.push(session);
            } catch (error) {
                if (String(actor.role).toLowerCase() === 'admin') throw error;
            }
        }
        return Promise.all(visible.map(async (session) => this.serializeSession(
            session,
            (await AttendanceRepository.findRecordsBySession(session._id)).map((record) => this.serializeRecord(record))
        )));
    }

    async getInstitutionalReport(query, actor) {
        if (String(actor.role).toLowerCase() !== 'admin') {
            throw new AppError('Solo administración puede consultar el reporte institucional', 403);
        }

        const filter = { school_year_id: query.school_year_id };
        if (query.group_id) filter.group_id = query.group_id;
        if (query.from || query.to) {
            filter.date = {};
            if (query.from) filter.date.$gte = dateValue(query.from);
            if (query.to) filter.date.$lte = new Date(query.to + 'T23:59:59.999Z');
        }

        const sessions = await AttendanceRepository.findSessions(filter);
        const rows = [];
        const summary = { sessions: sessions.length, records: 0, pending: 0, present: 0, absent: 0, late: 0, excused: 0 };

        for (const session of sessions) {
            const records = await AttendanceRepository.findRecordsBySession(session._id);
            for (const record of records) {
                const status = record.status || 'pending';
                summary.records += 1;
                summary[status] = (summary[status] || 0) + 1;
                rows.push({
                    date: dateLabel(session.date),
                    group: session.group_id?.name || '',
                    grade: session.group_id?.grade_id?.name || '',
                    area: session.area_id?.name || '',
                    topic: session.topic || '',
                    student: studentName(record.student_id),
                    status,
                    note: record.note || '',
                    justification: record.justification || '',
                });
            }
        }

        return {
            school_year_id: toIdString(query.school_year_id),
            filters: { group_id: query.group_id || null, from: query.from || null, to: query.to || null },
            summary,
            rows,
        };
    }

    async getSession(id, actor) {
        const session = await AttendanceRepository.findSessionById(id);
        if (!session) throw new AppError('Sesión de asistencia no encontrada', 404);
        await this.assertCanManageSession(actor.userId, actor.role, session);
        return this.serializeSession(session, (await AttendanceRepository.findRecordsBySession(id)).map((record) => this.serializeRecord(record)));
    }

    async updateRecords(id, records, actor) {
        const session = await AttendanceRepository.findSessionById(id);
        if (!session) throw new AppError('Sesión de asistencia no encontrada', 404);
        await this.assertCanManageSession(actor.userId, actor.role, session);
        if (session.status === 'closed' && String(actor.role).toLowerCase() !== 'admin') {
            throw new AppError('La sesión está cerrada y solo administración puede modificarla', 409);
        }

        const activeEnrollments = await enrollmentRepository.findByGroup(session.group_id?._id || session.group_id, 'active');
        const allowedStudents = new Set(activeEnrollments.map((item) => toIdString(item.student_id?._id || item.student_id)));
        for (const item of records) {
            if (!allowedStudents.has(toIdString(item.student_id))) {
                throw new AppError('Uno de los estudiantes no pertenece al grupo de la sesión', 400);
            }
            if (item.status === 'excused' && !item.justification?.trim()) {
                throw new AppError('La inasistencia justificada requiere una justificación', 400);
            }
        }

        const updated = await Promise.all(records.map((item) => AttendanceRepository.upsertRecord(id, item.student_id, {
            status: item.status,
            note: item.note || null,
            justification: item.justification || null,
            justified_at: item.status === 'excused' ? new Date() : null,
            justified_by_user_id: item.status === 'excused' ? actor.userId : null,
        })));
        await AuditLogService.record({
            actorUserId: actor.userId,
            actorRole: actor.role,
            action: 'attendance.records.updated',
            entityType: 'AttendanceSession',
            entityId: id,
            before: null,
            after: updated,
            institutionId: actor.institutionId,
            ipAddress: actor.ipAddress,
            userAgent: actor.userAgent,
            metadata: { record_count: records.length },
        });
        return this.getSession(id, actor);
    }

    async updateSessionStatus(id, status, actor) {
        const session = await AttendanceRepository.findSessionById(id);
        if (!session) throw new AppError('Sesión de asistencia no encontrada', 404);
        await this.assertCanManageSession(actor.userId, actor.role, session);
        const updated = await AttendanceRepository.updateSession(id, {
            status,
            closed_at: status === 'closed' ? new Date() : null,
        });
        await AuditLogService.record({
            actorUserId: actor.userId,
            actorRole: actor.role,
            action: `attendance.session.${status}`,
            entityType: 'AttendanceSession',
            entityId: id,
            before: session,
            after: updated,
            institutionId: actor.institutionId,
            ipAddress: actor.ipAddress,
            userAgent: actor.userAgent,
        });
        return this.getSession(id, actor);
    }

    async getStudentSummary(studentId, schoolYearId, actor) {
        await assertCanAccessStudentData({ userId: actor.userId, role: actor.role, studentId });
        const records = await AttendanceRepository.findRecordsByStudentAndYear(studentId, schoolYearId);
        const marked = records.filter((record) => record.status !== 'pending');
        const counts = marked.reduce((acc, record) => {
            acc[record.status] = (acc[record.status] || 0) + 1;
            return acc;
        }, { present: 0, absent: 0, late: 0, excused: 0 });
        const attended = counts.present + counts.late + counts.excused;
        const rate = marked.length ? Number(((attended / marked.length) * 100).toFixed(1)) : null;
        return {
            student_id: toIdString(studentId),
            school_year_id: toIdString(schoolYearId),
            totals: { sessions: records.length, marked: marked.length, pending: records.length - marked.length, ...counts },
            attendance_rate: rate,
            records: records.map((record) => ({
                ...this.serializeRecord(record),
                date: record.session_id?.date ? dateLabel(record.session_id.date) : null,
                group: record.session_id?.group_id?.name || null,
                area: record.session_id?.area_id?.name || null,
            })),
        };
    }

    async getGuardianSummary(userId, schoolYearId) {
        const links = await GuardianRepository.findAuthorizedStudentsByGuardianId(userId);
        const students = await Promise.all(links.map(async (link) => ({
            student: {
                _id: toIdString(link.student_id?._id),
                full_name: studentName(link.student_id),
                relationship: link.relationship || 'guardian',
            },
            attendance: await this.getStudentSummary(link.student_id._id, schoolYearId, {
                userId,
                role: 'parent',
            }),
        })));
        return { school_year_id: toIdString(schoolYearId), students };
    }
}

export default new AttendanceService();
