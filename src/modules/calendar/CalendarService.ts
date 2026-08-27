// @ts-nocheck
import ClassSession from '../../models/ClassSessionModel.js';
import Activity from '../../models/ActivityModel.js';
import ActivitySubmission from '../../models/ActivitySubmissionModel.js';
import Area from '../../models/AreaModel.js';
import Aula from '../../models/AulaModel.js';
import Enrollment from '../../models/EnrollmentModel.js';
import Grade from '../../models/GradeModel.js';
import GradeArea from '../../models/GradeAreaModel.js';
import Group from '../../models/GroupModel.js';
import GroupTeacher from '../../models/GroupTeacherModel.js';
import SchoolYear from '../../models/SchoolYearModel.js';
import Student from '../../models/StudentModel.js';
import Teacher from '../../models/TeacherModel.js';
import AppError from '../../utils/AppError.js';
import AuditLogService from '../audit/AuditLogService.js';
import { resolveStudentByUserId, resolveTeacherByUserId } from '../../shared/accessScope.service.js';
import GuardianRepository from '../../repositories/GuardianRepository.js';
import ScheduleService from './ScheduleService.js';

const toIdString = (value) => value?._id?.toString?.() || value?.toString?.() || null;

const sessionPopulate = [
    { path: 'school_year_id' },
    {
        path: 'group_id',
        populate: [{ path: 'grade_id' }, { path: 'school_year_id' }],
    },
    { path: 'area_id' },
    {
        path: 'teacher_id',
        populate: {
            path: 'user_id',
            populate: { path: 'person_id' },
        },
    },
    { path: 'aula_id' },
];

const entity = (value, fallback = 'Sin asignar') => ({
    _id: toIdString(value),
    name: value?.name || fallback,
});

const teacherEntity = (teacher) => ({
    _id: toIdString(teacher),
    name: `${teacher?.user_id?.person_id?.first_name || ''} ${teacher?.user_id?.person_id?.last_name || ''}`.trim()
        || teacher?.user_id?.email
        || 'Sin docente',
});

const schoolYearEntity = (schoolYear) => ({
    _id: toIdString(schoolYear),
    name: schoolYear?.year ? `Año escolar ${schoolYear.year}` : 'Año escolar',
    year: schoolYear?.year || 0,
});

const parseRange = (from, to) => {
    const start = new Date(`${from}T00:00:00.000Z`);
    const end = new Date(`${to}T23:59:59.999Z`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new AppError('El rango de fechas es inválido', 400);
    }
    if (start > end) {
        throw new AppError('La fecha inicial debe ser anterior o igual a la fecha final', 400);
    }
    if (end.getTime() - start.getTime() > 31 * 24 * 60 * 60 * 1000) {
        throw new AppError('El rango máximo del calendario es de 31 días', 400);
    }

    return { start, end };
};

const getActivityStatus = (activity, submission, now = new Date()) => {
    if (submission) return submission.status === 'graded' ? null : 'submitted';
    return new Date(activity.due_at) < now ? 'overdue' : 'pending';
};

class CalendarService {
    async loadSession(id) {
        return ClassSession.findById(id).populate(sessionPopulate);
    }

    async validateReferences(data) {
        const [schoolYear, group, area, teacher, aula] = await Promise.all([
            SchoolYear.findById(data.school_year_id),
            Group.findById(data.group_id).populate('grade_id').populate('school_year_id'),
            Area.findById(data.area_id),
            Teacher.findById(data.teacher_id),
            Aula.findById(data.aula_id),
        ]);

        if (!schoolYear) throw new AppError('Año escolar no encontrado', 404);
        if (!group) throw new AppError('Grupo no encontrado', 404);
        if (!area) throw new AppError('Área no encontrada', 404);
        if (!teacher) throw new AppError('Docente no encontrado', 404);
        if (!aula) throw new AppError('Aula no encontrada', 404);

        if (toIdString(group.school_year_id) !== toIdString(schoolYear)) {
            throw new AppError('El grupo no pertenece al año escolar enviado', 400);
        }

        const gradeArea = await GradeArea.findOne({
            grade_id: toIdString(group.grade_id),
            area_id: data.area_id,
        });
        if (!gradeArea) {
            throw new AppError('La materia no está configurada para el grado del grupo', 400);
        }

        const assignment = await GroupTeacher.findOne({
            teacher_id: teacher._id,
            group_id: group._id,
            area_id: area._id,
        });
        if (!assignment) {
            throw new AppError('El docente no tiene asignación para este grupo y materia', 400);
        }

        const startAt = new Date(data.start_at);
        const endAt = new Date(data.end_at);
        if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
            throw new AppError('Las fechas de inicio y final son inválidas', 400);
        }
        if (endAt <= startAt) {
            throw new AppError('La hora final debe ser posterior a la hora de inicio', 400);
        }

        return {
            schoolYear,
            group,
            area,
            teacher,
            aula,
            startAt,
            endAt,
        };
    }

    async assertTeacherCanManage(userId, data) {
        const teacher = await resolveTeacherByUserId(userId);
        if (toIdString(teacher._id) !== toIdString(data.teacher_id)) {
            throw new AppError('Solo puedes administrar sesiones asignadas a tu perfil docente', 403);
        }
        return teacher;
    }

    async assertCanManageExisting(userId, role, session) {
        if (String(role).toLowerCase() !== 'teacher') return null;

        const teacher = await resolveTeacherByUserId(userId);
        if (toIdString(session.teacher_id) !== toIdString(teacher._id)) {
            throw new AppError('No tienes permiso para modificar esta sesión', 403);
        }
        return teacher;
    }

    async assertNoConflict(data, excludeId = null) {
        const conflictFilter = {
            status: 'scheduled',
            _id: excludeId ? { $ne: excludeId } : { $exists: true },
            start_at: { $lt: data.endAt },
            end_at: { $gt: data.startAt },
            $or: [
                { teacher_id: data.teacher._id },
                { group_id: data.group._id },
                { aula_id: data.aula._id },
            ],
        };
        const conflicts = await ClassSession.find(conflictFilter)
            .select('start_at end_at teacher_id group_id aula_id topic')
            .limit(10);

        if (conflicts.length > 0) {
            throw new AppError('Existe un conflicto de horario con el docente, grupo o aula seleccionado', 409, {
                conflicts: conflicts.map((item) => ({
                    id: toIdString(item),
                    start_at: item.start_at,
                    end_at: item.end_at,
                    topic: item.topic,
                })),
            });
        }
    }

    serializeSession(session, pendingActivities = []) {
        const group = session.group_id;
        const schoolYear = session.school_year_id || group?.school_year_id;

        return {
            _id: session._id,
            type: 'class_session',
            start_at: session.start_at,
            end_at: session.end_at,
            status: session.status,
            schedule_id: toIdString(session.schedule_id),
            schedule_slot_id: session.schedule_slot_id || null,
            schedule_window_id: session.schedule_window_id || null,
            occurrence_date: session.occurrence_date || null,
            source: session.source || 'legacy',
            exception_reason: session.exception_reason || null,
            school_year: schoolYearEntity(schoolYear),
            grade: entity(group?.grade_id, 'Grado'),
            group: entity(group, 'Grupo'),
            area: entity(session.area_id, 'Materia'),
            teacher: teacherEntity(session.teacher_id),
            aula: entity(session.aula_id, 'Aula'),
            topic: session.topic,
            pending_activities: pendingActivities,
        };
    }

    serializeActivity(activity, status) {
        return {
            _id: activity._id,
            title: activity.title,
            due_at: activity.due_at,
            status,
        };
    }

    async getPendingActivities(sessions, role, userId) {
        if (!sessions.length) return new Map();

        const pairs = new Set(sessions.map((session) => [
            toIdString(session.group_id),
            toIdString(session.area_id),
            toIdString(session.school_year_id),
        ].join(':')));
        const activities = await Activity.find({
            status: 'published',
            $or: [...pairs].map((key) => {
                const [group_id, area_id, school_year_id] = key.split(':');
                return { group_id, area_id, school_year_id };
            }),
        }).select('_id title due_at group_id area_id school_year_id').sort({ due_at: 1 });

        const submissions = String(role).toLowerCase() === 'student'
            ? await ActivitySubmission.find({
                student_id: (await resolveStudentByUserId(userId))._id,
                activity_id: { $in: activities.map((activity) => activity._id) },
            }).select('activity_id status')
            : [];
        const submissionByActivity = new Map(submissions.map((item) => [toIdString(item.activity_id), item]));
        const activitiesByPair = new Map();
        const now = new Date();

        for (const activity of activities) {
            const status = getActivityStatus(activity, submissionByActivity.get(toIdString(activity)), now);
            if (!status) continue;
            const key = [toIdString(activity.group_id), toIdString(activity.area_id), toIdString(activity.school_year_id)].join(':');
            const current = activitiesByPair.get(key) || [];
            current.push(this.serializeActivity(activity, status));
            activitiesByPair.set(key, current);
        }

        return activitiesByPair;
    }

    async serializeSessions(sessions, role, userId) {
        const activitiesByPair = await this.getPendingActivities(sessions, role, userId);
        const allActivities = new Map();
        const serialized = sessions.map((session) => {
            const key = [toIdString(session.group_id), toIdString(session.area_id), toIdString(session.school_year_id)].join(':');
            const activities = activitiesByPair.get(key) || [];
            activities.forEach((activity) => allActivities.set(toIdString(activity), activity));
            return this.serializeSession(session, activities);
        });

        return {
            sessions: serialized,
            pending_activities: [...allActivities.values()],
        };
    }

    async buildListFilter(query, role, userId) {
        const filter = {
            start_at: { $gte: query.range.start, $lte: query.range.end },
        };
        if (query.school_year_id) filter.school_year_id = query.school_year_id;
        if (query.group_id) filter.group_id = query.group_id;
        if (query.area_id) filter.area_id = query.area_id;
        if (query.teacher_id) filter.teacher_id = query.teacher_id;
        if (query.aula_id) filter.aula_id = query.aula_id;

        if (query.grade_id) {
            const gradeGroups = await Group.find({
                grade_id: query.grade_id,
                ...(query.school_year_id ? { school_year_id: query.school_year_id } : {}),
            }).select('_id');
            filter.group_id = { $in: gradeGroups.map((group) => group._id) };
        }

        const normalizedRole = String(role).toLowerCase();
        if (normalizedRole === 'student') {
            const enrollment = await Enrollment.findOne({
                student_id: (await resolveStudentByUserId(userId))._id,
                status: 'active',
                ...(query.school_year_id ? { school_year_id: query.school_year_id } : {}),
            }).sort({ created_at: -1 });
            if (!enrollment) return null;
            filter.group_id = enrollment.group_id;
            filter.school_year_id = enrollment.school_year_id;
        }

        if (normalizedRole === 'parent') {
            const links = await GuardianRepository.findAuthorizedStudentsByGuardianId(userId);
            const studentIds = links.map((link) => link.student_id?._id || link.student_id).filter(Boolean);
            const enrollments = await Enrollment.find({
                student_id: { $in: studentIds },
                status: 'active',
                ...(query.school_year_id ? { school_year_id: query.school_year_id } : {}),
            }).select('group_id school_year_id');
            if (!enrollments.length) return null;
            const groupIds = enrollments.map((item) => item.group_id);
            filter.group_id = filter.group_id
                ? groupIds.some((id) => toIdString(id) === toIdString(filter.group_id)) ? filter.group_id : { $in: [] }
                : { $in: groupIds };
            filter.school_year_id = query.school_year_id || { $in: enrollments.map((item) => item.school_year_id) };
        }

        if (normalizedRole === 'teacher') {
            const teacher = await resolveTeacherByUserId(userId);
            const assignments = await GroupTeacher.find({ teacher_id: teacher._id }).select('group_id area_id');
            if (!assignments.length) return null;
            filter.teacher_id = teacher._id;
            const groupIds = assignments.map((item) => item.group_id);
            if (filter.group_id && !groupIds.some((id) => toIdString(id) === toIdString(filter.group_id))) return null;
            if (!filter.group_id) filter.group_id = { $in: groupIds };
        }

        return filter;
    }

    async list(query, role, userId) {
        const range = parseRange(query.from, query.to);
        const filter = await this.buildListFilter({ ...query, range }, role, userId);
        if (!filter) return { sessions: [], pending_activities: [], range: { from: query.from, to: query.to } };

        // Availability schedules authorize concrete sessions; they are not
        // projected as virtual occurrences, which prevents duplicate rows.
        const sessions = await ClassSession.find(filter)
            .populate(sessionPopulate)
            .sort({ start_at: 1 });
        const payload = await this.serializeSessions(sessions, role, userId);
        return { ...payload, range: { from: query.from, to: query.to } };
    }

    async create(userId, role, institutionId, data, requestContext) {
        const normalizedRole = String(role).toLowerCase();
        if (normalizedRole === 'teacher') {
            await this.assertTeacherCanManage(userId, data);
        }
        const references = await this.validateReferences(data);
        const availability = await ScheduleService.assertSessionWithinAvailability(institutionId, data, references);
        await this.assertNoConflict(references);

        const session = await ClassSession.create({
            school_year_id: references.schoolYear._id,
            group_id: references.group._id,
            area_id: references.area._id,
            teacher_id: references.teacher._id,
            aula_id: references.aula._id,
            start_at: references.startAt,
            end_at: references.endAt,
            topic: data.topic.trim(),
            schedule_id: availability.schedule._id,
            schedule_window_id: availability.window.window_id,
            occurrence_date: availability.occurrenceDate,
            source: 'schedule',
            is_manual_override: false,
            status: 'scheduled',
            created_by: userId,
            updated_by: userId,
        });
        const hydrated = await this.loadSession(session._id);
        await AuditLogService.record({
            actorUserId: userId,
            actorRole: role,
            action: 'calendar.session.created',
            entityType: 'ClassSession',
            entityId: session._id,
            before: null,
            after: session,
            institutionId,
            ...requestContext,
        });
        return this.serializeSession(hydrated);
    }

    async createException(userId, role, institutionId, data, requestContext) {
        if (String(role).toLowerCase() !== 'admin') throw new AppError('Solo un administrador puede crear excepciones', 403);
        const references = await this.validateReferences(data);
        await ScheduleService.assertSessionDate(institutionId, data, references);
        await this.assertNoConflict(references);
        const session = await ClassSession.create({
            school_year_id: references.schoolYear._id,
            group_id: references.group._id,
            area_id: references.area._id,
            teacher_id: references.teacher._id,
            aula_id: references.aula._id,
            start_at: references.startAt,
            end_at: references.endAt,
            topic: data.topic.trim(),
            source: 'exception',
            is_manual_override: true,
            exception_reason: data.reason.trim(),
            status: 'scheduled',
            created_by: userId,
            updated_by: userId,
        });
        const hydrated = await this.loadSession(session._id);
        await AuditLogService.record({
            actorUserId: userId,
            actorRole: role,
            action: 'calendar.exception.created',
            entityType: 'ClassSession',
            entityId: session._id,
            before: null,
            after: session,
            institutionId,
            ...requestContext,
        });
        return this.serializeSession(hydrated);
    }

    async update(userId, role, institutionId, id, data, requestContext) {
        const current = await this.loadSession(id);
        if (!current) throw new AppError('Sesión no encontrada', 404);
        await this.assertCanManageExisting(userId, role, current);

        const next = {
            school_year_id: data.school_year_id || toIdString(current.school_year_id),
            group_id: data.group_id || toIdString(current.group_id),
            area_id: data.area_id || toIdString(current.area_id),
            teacher_id: data.teacher_id || toIdString(current.teacher_id),
            aula_id: data.aula_id || toIdString(current.aula_id),
            start_at: data.start_at || current.start_at,
            end_at: data.end_at || current.end_at,
            topic: data.topic === undefined ? current.topic : data.topic,
        };
        const nextStatus = data.status || current.status;

        let availability = null;
        if (String(role).toLowerCase() === 'teacher') {
            const teacher = await this.assertTeacherCanManage(userId, next);
            if (current.source !== 'legacy') availability = await ScheduleService.assertSessionWithinAvailability(institutionId, next, await this.validateReferences(next));
        }
        const references = await this.validateReferences(next);
        if (!availability && current.source === 'schedule') availability = await ScheduleService.assertSessionWithinAvailability(institutionId, next, references);
        if (nextStatus === 'scheduled') await this.assertNoConflict(references, id);

        const before = current.toObject();
        const updatePayload = {
            school_year_id: references.schoolYear._id,
            group_id: references.group._id,
            area_id: references.area._id,
            teacher_id: references.teacher._id,
            aula_id: references.aula._id,
            start_at: references.startAt,
            end_at: references.endAt,
            topic: next.topic.trim(),
            status: nextStatus,
            updated_by: userId,
            ...(availability ? {
                schedule_id: availability.schedule._id,
                schedule_window_id: availability.window.window_id,
                occurrence_date: availability.occurrenceDate,
                source: 'schedule',
                is_manual_override: false,
            } : {}),
            ...(nextStatus === 'cancelled'
                ? { cancelled_at: new Date(), cancelled_by: userId }
                : { cancelled_at: null, cancelled_by: null }),
        };
        const updated = await ClassSession.findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true })
            .populate(sessionPopulate);
        const action = nextStatus === 'cancelled'
            ? 'calendar.session.cancelled'
            : current.status === 'cancelled'
                ? 'calendar.session.reactivated'
                : 'calendar.session.updated';

        await AuditLogService.record({
            actorUserId: userId,
            actorRole: role,
            action,
            entityType: 'ClassSession',
            entityId: id,
            before,
            after: updated,
            institutionId,
            ...requestContext,
        });

        return this.serializeSession(updated);
    }

    async catalog(role, userId, schoolYearId) {
        const years = await SchoolYear.find().sort({ year: -1 });
        const selectedYearId = schoolYearId || toIdString(years[0]);
        const [grades, areas, aulas] = await Promise.all([
            Grade.find().sort({ name: 1 }),
            Area.find().sort({ name: 1 }),
            Aula.find().sort({ name: 1 }),
        ]);

        let groups = await Group.find(selectedYearId ? { school_year_id: selectedYearId } : {})
            .populate('grade_id')
            .populate('school_year_id')
            .sort({ name: 1 });
        let teachers = await Teacher.find().populate({
            path: 'user_id',
            populate: { path: 'person_id' },
        });

        const normalizedRole = String(role).toLowerCase();
        if (normalizedRole === 'teacher') {
            const teacher = await resolveTeacherByUserId(userId);
            const assignments = await GroupTeacher.find({ teacher_id: teacher._id })
                .populate({ path: 'group_id', populate: [{ path: 'grade_id' }, { path: 'school_year_id' }] })
                .populate('area_id');
            const validAssignments = assignments.filter((item) => !selectedYearId || toIdString(item.group_id?.school_year_id) === selectedYearId);
            const groupIds = new Set(validAssignments.map((item) => toIdString(item.group_id)));
            const areaIds = new Set(validAssignments.map((item) => toIdString(item.area_id)));
            groups = groups.filter((group) => groupIds.has(toIdString(group)));
            const filteredAreas = areas.filter((area) => areaIds.has(toIdString(area)));
            teachers = [teacher];
            return {
                years: years.map(schoolYearEntity),
                grades: [...new Map(groups.map((group) => [toIdString(group.grade_id), entity(group.grade_id)])).values()],
                groups: groups.map((group) => entity(group)),
                areas: filteredAreas.map((area) => entity(area)),
                teachers: teachers.map(teacherEntity),
                aulas: aulas.map((aula) => entity(aula)),
            };
        }

        if (normalizedRole === 'student') {
            const student = await resolveStudentByUserId(userId);
            const enrollment = await Enrollment.findOne({
                student_id: student._id,
                status: 'active',
                ...(selectedYearId ? { school_year_id: selectedYearId } : {}),
            }).populate({ path: 'group_id', populate: [{ path: 'grade_id' }, { path: 'school_year_id' }] });
            groups = enrollment?.group_id ? [enrollment.group_id] : [];
            teachers = [];
        }

        if (normalizedRole === 'parent') {
            const links = await GuardianRepository.findAuthorizedStudentsByGuardianId(userId);
            const studentIds = links.map((link) => link.student_id?._id || link.student_id).filter(Boolean);
            const enrollments = await Enrollment.find({
                student_id: { $in: studentIds },
                status: 'active',
                ...(selectedYearId ? { school_year_id: selectedYearId } : {}),
            }).select('group_id');
            const groupIds = new Set(enrollments.map((item) => toIdString(item.group_id)));
            groups = groups.filter((group) => groupIds.has(toIdString(group)));
            teachers = [];
        }

        return {
            years: years.map(schoolYearEntity),
            grades: grades.map((grade) => entity(grade)),
            groups: groups.map((group) => entity(group)),
            areas: areas.map((area) => entity(area)),
            teachers: teachers.map(teacherEntity),
            aulas: aulas.map((aula) => entity(aula)),
        };
    }
}

export default new CalendarService();
