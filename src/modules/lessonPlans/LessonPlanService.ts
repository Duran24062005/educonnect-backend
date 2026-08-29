// @ts-nocheck
import LessonPlan from '../../models/LessonPlanModel.js';
import ClassSession from '../../models/ClassSessionModel.js';
import Enrollment from '../../models/EnrollmentModel.js';
import { resolveStudentByUserId, resolveTeacherByUserId } from '../../shared/accessScope.service.js';
import GuardianRepository from '../../repositories/GuardianRepository.js';
import AppError from '../../utils/AppError.js';
import AuditLogService from '../audit/AuditLogService.js';

const id = (value) => value?._id?.toString?.() || value?.toString?.() || null;
const serialize = (plan) => plan ? ({
    id: id(plan), session_id: id(plan.session_id), teacher_id: id(plan.teacher_id),
    topic: plan.topic || '', learning_objective: plan.learning_objective || '',
    description: plan.description || '', teacher_notes: plan.teacher_notes || '',
    homework: plan.homework || '', status: plan.status, created_at: plan.created_at, updated_at: plan.updated_at,
}) : null;

class LessonPlanService {
    async session(sessionId) {
        const session = await ClassSession.findById(sessionId);
        if (!session) throw new AppError('Sesión no encontrada', 404);
        return session;
    }

    async assertCanView(userId, role, session) {
        const normalized = String(role).toLowerCase();
        if (normalized === 'admin') return;
        if (normalized === 'teacher') {
            const teacher = await resolveTeacherByUserId(userId);
            if (id(session.teacher_id) !== id(teacher)) throw new AppError('No tienes permiso para ver esta planeación', 403);
            return;
        }
        let groupIds = [];
        if (normalized === 'student') {
            const student = await resolveStudentByUserId(userId);
            const enrollment = await Enrollment.findOne({ student_id: student._id, school_year_id: session.school_year_id, status: 'active' });
            groupIds = enrollment ? [enrollment.group_id] : [];
        } else if (normalized === 'parent') {
            const links = await GuardianRepository.findAuthorizedStudentsByGuardianId(userId);
            const studentIds = links.map((link) => link.student_id?._id || link.student_id).filter(Boolean);
            const enrollments = await Enrollment.find({ student_id: { $in: studentIds }, school_year_id: session.school_year_id, status: 'active' }).select('group_id');
            groupIds = enrollments.map((item) => item.group_id);
        }
        if (!groupIds.some((groupId) => id(groupId) === id(session.group_id))) throw new AppError('No tienes permiso para ver esta planeación', 403);
    }

    async getBySession(userId, role, sessionId) {
        const session = await this.session(sessionId);
        await this.assertCanView(userId, role, session);
        const plan = await LessonPlan.findOne({ session_id: session._id });
        if (['student', 'parent'].includes(String(role).toLowerCase()) && plan?.status !== 'completed') return null;
        return serialize(plan);
    }

    async create(userId, role, institutionId, data, context = {}) {
        if (String(role).toLowerCase() !== 'teacher') throw new AppError('La planeación solo puede ser creada por el docente responsable', 403);
        const session = await this.session(data.session_id);
        const teacher = await resolveTeacherByUserId(userId);
        if (id(session.teacher_id) !== id(teacher)) throw new AppError('Solo puedes preparar tus propias sesiones', 403);
        if (session.status === 'cancelled') throw new AppError('No se puede preparar una sesión cancelada', 409);
        const existing = await LessonPlan.findOne({ session_id: session._id });
        if (existing) throw new AppError('La sesión ya tiene una planeación', 409);
        if (data.status === 'completed' && (!data.topic?.trim() || !data.learning_objective?.trim())) throw new AppError('Una planeación completada requiere tema y objetivo de aprendizaje', 400);
        const plan = await LessonPlan.create({ ...data, teacher_id: teacher._id, created_by: userId, updated_by: userId });
        await AuditLogService.record({ actorUserId: userId, actorRole: role, action: 'lesson_plan.created', entityType: 'LessonPlan', entityId: plan._id, before: null, after: plan, institutionId, ...context });
        return serialize(plan);
    }

    async update(userId, role, institutionId, planId, data, context = {}) {
        const plan = await LessonPlan.findById(planId);
        if (!plan) throw new AppError('Planeación no encontrada', 404);
        const normalized = String(role).toLowerCase();
        if (normalized === 'teacher') {
            const teacher = await resolveTeacherByUserId(userId);
            if (id(plan.teacher_id) !== id(teacher)) throw new AppError('Solo puedes editar tus propias planeaciones', 403);
        } else if (normalized !== 'admin') throw new AppError('No tienes permiso para editar esta planeación', 403);
        const next = { ...plan.toObject(), ...data };
        if (next.status === 'completed' && (!next.topic?.trim() || !next.learning_objective?.trim())) throw new AppError('Una planeación completada requiere tema y objetivo de aprendizaje', 400);
        const before = plan.toObject();
        Object.assign(plan, data, { updated_by: userId });
        await plan.save();
        await AuditLogService.record({ actorUserId: userId, actorRole: role, action: 'lesson_plan.updated', entityType: 'LessonPlan', entityId: plan._id, before, after: plan, institutionId, ...context });
        return serialize(plan);
    }
}

export default new LessonPlanService();
