import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { activityRepository, activitySubmissionRepository } from '../repositories/ActivityRepository.js';
import {
    teacherRepository,
    studentRepository,
    groupRepository,
    groupTeacherRepository,
} from '../repositories/PersonProfileRepository.js';
import { areaRepository, periodRepository } from '../repositories/AcademicRepository.js';
import { enrollmentRepository } from '../repositories/EvaluationRepository.js';
import AppError from '../utils/AppError.js';
import {
    ACTIVITY_ALLOWED_EXTENSIONS,
    ACTIVITY_STATUS,
    ACTIVITY_SUBMISSION_STATUS,
    ACTIVITY_SUBMISSION_TYPE,
    ACTIVITY_UPLOAD_SUBDIR,
} from '../constants/activity.constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, `../uploads/${ACTIVITY_UPLOAD_SUBDIR}`);

const round2 = (value) => Number((value || 0).toFixed(2));

const toIdString = (value) => value?._id?.toString?.() || value?.toString?.() || null;

const normalizeOptionalText = (value) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

const getFileExtension = (fileName = '') => path.extname(fileName).replace('.', '').toLowerCase();
const addOneHour = (date) => new Date(new Date(date).getTime() + (60 * 60 * 1000));

const getPersonName = (person) => {
    if (!person) return 'Sin nombre';
    return `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Sin nombre';
};

const normalizeAllowedExtensions = (extensions = []) => {
    const normalized = [...new Set((extensions || []).map((item) => String(item).trim().toLowerCase()))];
    if (normalized.length === 0) {
        throw new AppError('Debe indicar al menos un formato permitido', 400);
    }

    const invalid = normalized.filter((item) => !ACTIVITY_ALLOWED_EXTENSIONS.includes(item));
    if (invalid.length > 0) {
        throw new AppError(
            `Formatos no soportados: ${invalid.join(', ')}. Usa solo ${ACTIVITY_ALLOWED_EXTENSIONS.join(', ')}`,
            400
        );
    }

    return normalized;
};

const normalizeLinkUrl = (value) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    try {
        const parsed = new URL(trimmed);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('invalid protocol');
        }
        return parsed.toString();
    } catch {
        throw new AppError('El link de entrega debe ser una URL válida con http o https', 400);
    }
};

const normalizeRubricCriteria = (criteria = []) => {
    if (!Array.isArray(criteria) || criteria.length === 0) {
        throw new AppError('Debe registrar al menos un criterio de evaluación', 400);
    }

    return criteria.map((criterion) => {
        const title = String(criterion.title || '').trim();
        const max_points = Number(criterion.max_points);

        if (!title) {
            throw new AppError('Cada criterio debe tener título', 400);
        }
        if (!Number.isFinite(max_points) || max_points <= 0) {
            throw new AppError('Cada criterio debe tener un puntaje máximo mayor a 0', 400);
        }

        return {
            title,
            description: normalizeOptionalText(criterion.description),
            max_points,
        };
    });
};

const totalRubricPoints = (criteria = []) =>
    round2(criteria.reduce((sum, criterion) => sum + Number(criterion.max_points || 0), 0));

const computeStudentActivityState = (activity, submission, now = new Date()) => {
    if (submission?.status === ACTIVITY_SUBMISSION_STATUS.GRADED) return ACTIVITY_SUBMISSION_STATUS.GRADED;
    if (submission) return ACTIVITY_SUBMISSION_STATUS.SUBMITTED;
    if (activity.open_at && now < new Date(activity.open_at)) return 'upcoming';
    if (activity.due_at && now > new Date(activity.due_at)) return 'late';
    return 'pending';
};

const serializeTeacher = (teacher) => ({
    _id: toIdString(teacher),
    full_name: getPersonName(teacher?.user_id?.person_id),
    email: teacher?.user_id?.email || null,
});

const serializeActivity = (activity, extra = {}) => ({
    _id: activity._id,
    title: activity.title,
    description: activity.description,
    context: activity.context,
    status: activity.status,
    open_at: activity.open_at,
    due_at: activity.due_at,
    allowed_extensions: activity.allowed_extensions,
    rubric_criteria: Array.isArray(activity.rubric_criteria)
        ? activity.rubric_criteria.map((criterion) => ({
            _id: criterion._id,
            title: criterion.title,
            description: criterion.description,
            max_points: Number(criterion.max_points),
        }))
        : [],
    rubric_max_points: totalRubricPoints(activity.rubric_criteria),
    rubric_locked: Boolean(extra.rubric_locked),
    group: activity.group_id
        ? {
            _id: activity.group_id._id || activity.group_id,
            name: activity.group_id.name,
            grade_id: activity.group_id.grade_id?._id || activity.group_id.grade_id || null,
            grade_name: activity.group_id.grade_id?.name || null,
        }
        : null,
    area: activity.area_id
        ? {
            _id: activity.area_id._id || activity.area_id,
            name: activity.area_id.name,
        }
        : null,
    period: activity.period_id
        ? {
            _id: activity.period_id._id || activity.period_id,
            name: activity.period_id.name,
            start_date: activity.period_id.start_date || null,
            end_date: activity.period_id.end_date || null,
        }
        : null,
    school_year: activity.school_year_id
        ? {
            _id: activity.school_year_id._id || activity.school_year_id,
            year: activity.school_year_id.year || null,
        }
        : null,
    teacher: activity.teacher_id ? serializeTeacher(activity.teacher_id) : null,
    created_at: activity.created_at,
    updated_at: activity.updated_at,
    ...extra,
});

const serializeSubmission = (submission) => {
    if (!submission) return null;

    return {
        _id: submission._id,
        status: submission.status,
        submission_type: submission.submission_type,
        link_url: submission.link_url,
        file_url: submission.file_url,
        file_name: submission.file_name,
        file_extension: submission.file_extension,
        original_name: submission.original_name,
        mime_type: submission.mime_type,
        size_bytes: Number(submission.size_bytes || 0),
        submitted_at: submission.submitted_at,
        graded_at: submission.graded_at,
        earned_points: Number(submission.earned_points || 0),
        max_points: Number(submission.max_points || 0),
        score_10: submission.score_10 === null || submission.score_10 === undefined
            ? null
            : Number(submission.score_10),
        teacher_feedback: submission.teacher_feedback,
        rubric_scores: Array.isArray(submission.rubric_scores)
            ? submission.rubric_scores.map((item) => ({
                criterion_id: item.criterion_id,
                title: item.title,
                max_points: Number(item.max_points || 0),
                earned_points: Number(item.earned_points || 0),
                feedback: item.feedback,
            }))
            : [],
        created_at: submission.created_at,
        updated_at: submission.updated_at,
        student: submission.student_id
            ? {
                _id: submission.student_id._id || submission.student_id,
                full_name: getPersonName(submission.student_id.user_id?.person_id),
                email: submission.student_id.user_id?.email || null,
            }
            : null,
    };
};

const removeStoredFile = async (fileName) => {
    if (!fileName) return;

    const absolutePath = path.resolve(uploadsDir, fileName);
    try {
        await fs.unlink(absolutePath);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
};

class ActivityService {
    async getTeacherProfile(userId) {
        const teacher = await teacherRepository.findByUserId(userId);
        if (!teacher) {
            throw new AppError('Perfil de docente no encontrado', 404);
        }
        return teacher;
    }

    async getStudentProfile(userId) {
        const student = await studentRepository.findByUserId(userId);
        if (!student) {
            throw new AppError('Perfil de estudiante no encontrado', 404);
        }
        return student;
    }

    async getActiveEnrollment(studentId) {
        const enrollment = await enrollmentRepository.findActiveByStudent(studentId);
        if (!enrollment) {
            throw new AppError('El estudiante no tiene una matrícula activa', 404);
        }
        return enrollment;
    }

    async validateActivityScope(group_id, area_id, period_id) {
        const [group, area, period] = await Promise.all([
            groupRepository.findById(group_id),
            areaRepository.findById(area_id),
            periodRepository.findById(period_id),
        ]);

        if (!group) throw new AppError('Grupo no encontrado', 404);
        if (!area) throw new AppError('Área no encontrada', 404);
        if (!period) throw new AppError('Periodo no encontrado', 404);

        const groupSchoolYearId = toIdString(group.school_year_id);
        const periodSchoolYearId = toIdString(period.school_year_id);

        if (groupSchoolYearId !== periodSchoolYearId) {
            throw new AppError('El periodo no pertenece al mismo año escolar del grupo', 400);
        }

        return { group, area, period, school_year_id: groupSchoolYearId };
    }

    async ensureTeacherOwnsAssignment(teacher_id, group_id, area_id) {
        const isAllowed = await groupTeacherRepository.exists(teacher_id, group_id, area_id);
        if (!isAllowed) {
            throw new AppError('El docente no tiene asignación para este grupo y área', 403);
        }
    }

    ensureActivityWindow(open_at, due_at) {
        const openDate = new Date(open_at);
        const dueDate = due_at ? new Date(due_at) : addOneHour(openDate);

        if (Number.isNaN(openDate.getTime()) || Number.isNaN(dueDate.getTime())) {
            throw new AppError('Las fechas de apertura y cierre son inválidas', 400);
        }

        if (openDate >= dueDate) {
            throw new AppError('La fecha de cierre debe ser posterior a la apertura', 400);
        }

        return { open_at: openDate, due_at: dueDate };
    }

    async ensureTeacherOwnsActivity(userId, activity_id) {
        const teacher = await this.getTeacherProfile(userId);
        const activity = await activityRepository.findById(activity_id);

        if (!activity) {
            throw new AppError('Actividad no encontrada', 404);
        }

        if (toIdString(activity.teacher_id) !== toIdString(teacher._id)) {
            throw new AppError('No tienes permisos sobre esta actividad', 403);
        }

        return { teacher, activity };
    }

    async ensureStudentCanAccessActivity(userId, activity_id) {
        const student = await this.getStudentProfile(userId);
        const enrollment = await this.getActiveEnrollment(student._id);
        const activity = await activityRepository.findById(activity_id);

        if (!activity) {
            throw new AppError('Actividad no encontrada', 404);
        }

        if (toIdString(activity.group_id) !== toIdString(enrollment.group_id) ||
            toIdString(activity.school_year_id) !== toIdString(enrollment.school_year_id)) {
            throw new AppError('No tienes acceso a esta actividad', 403);
        }

        return { student, enrollment, activity };
    }

    async createTeacherActivity(userId, data) {
        const teacher = await this.getTeacherProfile(userId);
        const { group, school_year_id } = await this.validateActivityScope(data.group_id, data.area_id, data.period_id);

        await this.ensureTeacherOwnsAssignment(teacher._id, data.group_id, data.area_id);

        const { open_at, due_at } = this.ensureActivityWindow(data.open_at, data.due_at);
        const payload = {
            title: String(data.title || '').trim(),
            description: normalizeOptionalText(data.description),
            context: String(data.context || '').trim(),
            group_id: group._id,
            area_id: data.area_id,
            period_id: data.period_id,
            school_year_id,
            teacher_id: teacher._id,
            open_at,
            due_at,
            allowed_extensions: normalizeAllowedExtensions(data.allowed_extensions),
            rubric_criteria: normalizeRubricCriteria(data.rubric_criteria),
            status: ACTIVITY_STATUS.PUBLISHED,
        };

        const activity = await activityRepository.create(payload);
        const hydrated = await activityRepository.findById(activity._id);
        return {
            activity: serializeActivity(hydrated, { rubric_locked: false }),
        };
    }

    async getTeacherActivities(userId, filters = {}) {
        const teacher = await this.getTeacherProfile(userId);
        const query = {};

        if (filters.group_id) query.group_id = filters.group_id;
        if (filters.area_id) query.area_id = filters.area_id;
        if (filters.period_id) query.period_id = filters.period_id;

        const activities = await activityRepository.findByTeacher(teacher._id, query);
        const activityIds = activities.map((activity) => activity._id);
        const submissions = activityIds.length > 0
            ? await activitySubmissionRepository.findByActivityIds(activityIds)
            : [];

        const summaryByActivity = new Map();
        for (const row of submissions) {
            const key = toIdString(row.activity_id);
            if (!summaryByActivity.has(key)) {
                summaryByActivity.set(key, { submitted: 0, graded: 0 });
            }
            const summary = summaryByActivity.get(key);
            summary.submitted += 1;
            if (row.status === ACTIVITY_SUBMISSION_STATUS.GRADED) {
                summary.graded += 1;
            }
        }

        const totalStudentsByGroup = new Map();
        const serialized = [];
        for (const activity of activities) {
            const groupId = toIdString(activity.group_id);
            if (!totalStudentsByGroup.has(groupId)) {
                totalStudentsByGroup.set(groupId, await enrollmentRepository.countActiveByGroup(groupId));
            }

            const total_students = totalStudentsByGroup.get(groupId) || 0;
            const summary = summaryByActivity.get(toIdString(activity._id)) || { submitted: 0, graded: 0 };
            const remaining = Math.max(total_students - summary.submitted, 0);
            const isClosed = new Date() > new Date(activity.due_at);

            serialized.push(
                serializeActivity(activity, {
                    rubric_locked: Boolean(summary.submitted > 0),
                    submission_summary: {
                        total_students,
                        submitted_count: summary.submitted,
                        graded_count: summary.graded,
                        pending_count: isClosed ? 0 : remaining,
                        late_count: isClosed ? remaining : 0,
                    },
                })
            );
        }

        return { activities: serialized };
    }

    async getTeacherActivity(userId, activity_id) {
        const { activity } = await this.ensureTeacherOwnsActivity(userId, activity_id);
        const rubric_locked = await activityRepository.hasSubmissions(activity_id);

        return {
            activity: serializeActivity(activity, { rubric_locked }),
        };
    }

    async updateTeacherActivity(userId, activity_id, data) {
        const { activity } = await this.ensureTeacherOwnsActivity(userId, activity_id);
        const hasSubmissions = await activityRepository.hasSubmissions(activity_id);

        if (hasSubmissions && data.rubric_criteria) {
            throw new AppError('La rúbrica queda bloqueada cuando ya existe al menos una entrega', 400);
        }

        const payload = {};
        if (data.title !== undefined) payload.title = String(data.title || '').trim();
        if (data.description !== undefined) payload.description = normalizeOptionalText(data.description);
        if (data.context !== undefined) payload.context = String(data.context || '').trim();
        if (data.allowed_extensions !== undefined) {
            payload.allowed_extensions = normalizeAllowedExtensions(data.allowed_extensions);
        }
        if (data.rubric_criteria !== undefined) {
            payload.rubric_criteria = normalizeRubricCriteria(data.rubric_criteria);
        }

        const nextOpenAt = data.open_at ?? activity.open_at;
        const nextDueAt = data.due_at ?? activity.due_at;
        const { open_at, due_at } = this.ensureActivityWindow(nextOpenAt, nextDueAt);
        payload.open_at = open_at;
        payload.due_at = due_at;

        const updated = await activityRepository.update(activity_id, payload);
        return {
            activity: serializeActivity(updated, { rubric_locked: hasSubmissions }),
        };
    }

    async getTeacherActivitySubmissions(userId, activity_id) {
        const { activity } = await this.ensureTeacherOwnsActivity(userId, activity_id);
        const [enrollments, submissions] = await Promise.all([
            enrollmentRepository.findByGroup(toIdString(activity.group_id), 'active'),
            activitySubmissionRepository.findByActivity(activity_id),
        ]);

        const submissionByStudentId = new Map(
            submissions.map((submission) => [toIdString(submission.student_id), submission])
        );

        const now = new Date();
        const rows = enrollments.map((enrollment) => {
            const student = enrollment.student_id;
            const submission = submissionByStudentId.get(toIdString(student));
            return {
                student: {
                    _id: student._id,
                    full_name: getPersonName(student.user_id?.person_id),
                    email: student.user_id?.email || null,
                },
                status: computeStudentActivityState(activity, submission, now),
                submission: serializeSubmission(submission),
            };
        }).sort((a, b) => a.student.full_name.localeCompare(b.student.full_name));

        return {
            activity: serializeActivity(activity, { rubric_locked: submissions.length > 0 }),
            submissions: rows,
        };
    }

    async reviewTeacherActivitySubmission(userId, activity_id, student_id, data) {
        const { activity } = await this.ensureTeacherOwnsActivity(userId, activity_id);
        const submission = await activitySubmissionRepository.findByActivityAndStudent(activity_id, student_id);

        if (!submission) {
            throw new AppError('La entrega del estudiante no existe', 404);
        }

        const rubric = Array.isArray(activity.rubric_criteria) ? activity.rubric_criteria : [];
        if (!rubric.length) {
            throw new AppError('La actividad no tiene rúbrica configurada', 400);
        }

        const rubricById = new Map(rubric.map((criterion) => [toIdString(criterion._id), criterion]));
        if (data.rubric_scores.length !== rubric.length) {
            throw new AppError('Debes calificar todos los criterios de la rúbrica', 400);
        }

        const seen = new Set();
        const rubric_scores = data.rubric_scores.map((item) => {
            const criterion = rubricById.get(String(item.criterion_id));
            if (!criterion) {
                throw new AppError('Uno de los criterios enviados no pertenece a la actividad', 400);
            }
            if (seen.has(String(item.criterion_id))) {
                throw new AppError('No puedes calificar el mismo criterio más de una vez', 400);
            }
            seen.add(String(item.criterion_id));

            const earned_points = Number(item.earned_points);
            if (!Number.isFinite(earned_points) || earned_points < 0 || earned_points > Number(criterion.max_points)) {
                throw new AppError(
                    `El puntaje del criterio "${criterion.title}" debe estar entre 0 y ${criterion.max_points}`,
                    400
                );
            }

            return {
                criterion_id: criterion._id,
                title: criterion.title,
                max_points: Number(criterion.max_points),
                earned_points,
                feedback: normalizeOptionalText(item.feedback),
            };
        });

        const earned_points = round2(rubric_scores.reduce((sum, item) => sum + item.earned_points, 0));
        const max_points = totalRubricPoints(rubric);
        const score_10 = max_points > 0 ? round2((earned_points / max_points) * 10) : 0;

        const updated = await activitySubmissionRepository.update(submission._id, {
            status: ACTIVITY_SUBMISSION_STATUS.GRADED,
            rubric_scores,
            earned_points,
            max_points,
            score_10,
            teacher_feedback: normalizeOptionalText(data.teacher_feedback),
            graded_at: new Date(),
        });

        return {
            activity: serializeActivity(activity, { rubric_locked: true }),
            submission: serializeSubmission(updated),
        };
    }

    async getStudentActivities(userId, filters = {}) {
        const student = await this.getStudentProfile(userId);
        const enrollment = await this.getActiveEnrollment(student._id);
        const query = {};

        if (filters.area_id) query.area_id = filters.area_id;
        if (filters.period_id) query.period_id = filters.period_id;

        const activities = await activityRepository.findByStudentScope(
            enrollment.group_id,
            enrollment.school_year_id,
            query
        );
        const submissions = activities.length > 0
            ? await activitySubmissionRepository.findByStudentAndActivityIds(
                student._id,
                activities.map((activity) => activity._id)
            )
            : [];

        const submissionByActivityId = new Map(
            submissions.map((submission) => [toIdString(submission.activity_id), submission])
        );

        const now = new Date();
        const serialized = activities
            .map((activity) => {
                const submission = submissionByActivityId.get(toIdString(activity._id));
                const state = computeStudentActivityState(activity, submission, now);

                return serializeActivity(activity, {
                    student_state: state,
                    submission: serializeSubmission(submission),
                });
            })
            .filter((activity) => !filters.status || activity.student_state === filters.status);

        return { activities: serialized };
    }

    async getStudentActivity(userId, activity_id) {
        const { student, activity } = await this.ensureStudentCanAccessActivity(userId, activity_id);
        const submission = await activitySubmissionRepository.findByActivityAndStudent(activity_id, student._id);

        return {
            activity: serializeActivity(activity, {
                student_state: computeStudentActivityState(activity, submission),
                submission: serializeSubmission(submission),
            }),
        };
    }

    async submitStudentActivity(userId, activity_id, file, rawLinkUrl = null) {
        const { student, activity } = await this.ensureStudentCanAccessActivity(userId, activity_id);
        const now = new Date();
        const link_url = normalizeLinkUrl(rawLinkUrl);

        if (now < new Date(activity.open_at)) {
            if (file) await removeStoredFile(file.filename);
            throw new AppError('La actividad aún no está disponible para entrega', 400);
        }
        if (now > new Date(activity.due_at)) {
            if (file) await removeStoredFile(file.filename);
            throw new AppError('La fecha límite de entrega ya expiró', 400);
        }

        const hasFile = Boolean(file);
        const hasLink = Boolean(link_url);

        if ((hasFile && hasLink) || (!hasFile && !hasLink)) {
            if (file) await removeStoredFile(file.filename);
            throw new AppError('Debes enviar una entrega usando archivo o link, pero no ambos', 400);
        }

        let deliveryPayload;
        if (hasLink) {
            if (!activity.allowed_extensions.includes('link')) {
                throw new AppError('Esta actividad no acepta entregas por link', 400);
            }
            deliveryPayload = {
                submission_type: ACTIVITY_SUBMISSION_TYPE.LINK,
                link_url,
                file_url: null,
                file_name: null,
                file_extension: 'link',
                original_name: link_url,
                mime_type: 'text/uri-list',
                size_bytes: 0,
            };
        } else {
            const file_extension = getFileExtension(file.originalname);
            if (!activity.allowed_extensions.includes(file_extension)) {
                await removeStoredFile(file.filename);
                throw new AppError(
                    `Esta actividad solo acepta: ${activity.allowed_extensions.join(', ')}`,
                    400
                );
            }
            deliveryPayload = {
                submission_type: ACTIVITY_SUBMISSION_TYPE.FILE,
                link_url: null,
                file_url: `/uploads/${ACTIVITY_UPLOAD_SUBDIR}/${file.filename}`,
                file_name: file.filename,
                file_extension,
                original_name: file.originalname,
                mime_type: file.mimetype,
                size_bytes: file.size,
            };
        }

        const payload = {
            submitted_at: now,
            status: ACTIVITY_SUBMISSION_STATUS.SUBMITTED,
            rubric_scores: [],
            earned_points: 0,
            max_points: totalRubricPoints(activity.rubric_criteria),
            score_10: null,
            teacher_feedback: null,
            graded_at: null,
            ...deliveryPayload,
        };

        const existing = await activitySubmissionRepository.findByActivityAndStudent(activity_id, student._id);
        let submission;

        if (existing) {
            if (existing.submission_type === ACTIVITY_SUBMISSION_TYPE.FILE) {
                await removeStoredFile(existing.file_name);
            }
            submission = await activitySubmissionRepository.update(existing._id, payload);
        } else {
            submission = await activitySubmissionRepository.create({
                activity_id,
                student_id: student._id,
                ...payload,
            });
            submission = await activitySubmissionRepository.findById(submission._id);
        }

        return {
            activity: serializeActivity(activity, {
                student_state: ACTIVITY_SUBMISSION_STATUS.SUBMITTED,
            }),
            submission: serializeSubmission(submission),
        };
    }
}

export default new ActivityService();
