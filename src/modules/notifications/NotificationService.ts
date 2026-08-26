// @ts-nocheck
import AppError from '../../utils/AppError.js';
import { notificationRepository } from '../../repositories/NotificationRepository.js';
import userRepository from '../../repositories/UserRepository.js';
import { teacherRepository, groupRepository, groupTeacherRepository, studentRepository } from '../../repositories/PersonProfileRepository.js';
import { enrollmentRepository } from '../../repositories/EvaluationRepository.js';
import StudentGuardian from '../../models/StudentGuardianModel.js';
import User from '../../models/UserModel.js';

const toIdString = (value) => value?._id?.toString?.() || value?.toString?.() || null;

const normalizeRole = (role) => {
    const value = String(role || '').trim().toLowerCase();
    if (value === 'guardian') return 'parent';
    return value;
};

const getPersonName = (person) => {
    if (!person) return 'Sin nombre';
    return `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Sin nombre';
};

const serializeNotification = (notification) => ({
    id: toIdString(notification._id),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    audience_role: notification.audience_role,
    is_read: Boolean(notification.read_at),
    read_at: notification.read_at,
    created_at: notification.created_at,
    source_type: notification.source_type,
    source_id: toIdString(notification.source_id),
    metadata: notification.metadata || {},
    created_by: notification.created_by_user_id
        ? {
            user_id: toIdString(notification.created_by_user_id),
            role: notification.created_by_role,
            full_name: getPersonName(notification.created_by_user_id.person_id),
            email: notification.created_by_user_id.email || null,
        }
        : {
            user_id: null,
            role: notification.created_by_role,
            full_name: null,
            email: null,
        },
});

class NotificationService {
    resolveAdminTargetRoles(targetRole) {
        const normalized = normalizeRole(targetRole);

        if (normalized === 'teacher_student') return ['teacher', 'student'];
        if (normalized === 'teacher_admin') return ['teacher', 'admin'];
        if (normalized === 'all') return ['admin', 'teacher', 'student', 'parent'];
        return [normalized];
    }

    buildBulkNotifications(recipientUsers = [], payloadFactory) {
        const seen = new Set();
        const items = [];

        for (const user of recipientUsers) {
            const userId = toIdString(user?._id || user);
            if (!userId || seen.has(userId)) continue;
            seen.add(userId);
            items.push(payloadFactory(userId, user));
        }

        return items;
    }

    async getMyNotifications(userId, filters = {}) {
        const notifications = await notificationRepository.findByRecipient(userId, {
            read: typeof filters.read === 'boolean' ? filters.read : undefined,
            limit: filters.limit ? Number(filters.limit) : 50,
        });

        return {
            notifications: notifications.map(serializeNotification),
        };
    }

    async getMyUnreadCount(userId) {
        const unread_count = await notificationRepository.countUnreadByRecipient(userId);
        return { unread_count };
    }

    async markNotificationAsRead(userId, notificationId) {
        const notification = await notificationRepository.markAsRead(notificationId, userId);
        if (!notification) {
            throw new AppError('Notificación no encontrada', 404);
        }

        return { notification: serializeNotification(notification) };
    }

    async markAllNotificationsAsRead(userId) {
        const updated_count = await notificationRepository.markAllAsRead(userId);
        return { updated_count };
    }

    async notifyActivityCreated(activity) {
        const enrollments = await enrollmentRepository.findByGroup(toIdString(activity.group_id), 'active');
        const recipients = enrollments
            .map((row) => row.student_id?.user_id)
            .filter(Boolean);

        const items = this.buildBulkNotifications(recipients, (recipientUserId) => ({
            recipient_user_id: recipientUserId,
            type: 'activity_created',
            title: `Nueva actividad en ${activity.area_id?.name || 'tu materia'}`,
            message: `${activity.teacher_id?.user_id?.person_id ? getPersonName(activity.teacher_id.user_id.person_id) : 'Tu docente'} creó "${activity.title}" para ${activity.group_id?.name || 'tu grupo'}.`,
            audience_role: 'student',
            created_by_user_id: activity.teacher_id?.user_id?._id || activity.teacher_id?.user_id || null,
            created_by_role: 'teacher',
            source_type: 'activity',
            source_id: activity._id,
            metadata: {
                activity_id: toIdString(activity._id),
                activity_title: activity.title,
                group_id: toIdString(activity.group_id),
                group_name: activity.group_id?.name || null,
                area_id: toIdString(activity.area_id),
                area_name: activity.area_id?.name || null,
                due_at: activity.due_at,
            },
        }));

        await notificationRepository.createMany(items);
        return { created_count: items.length };
    }

    async notifyActivitySubmitted(activity, studentId, submittedAt = new Date()) {
        const student = await studentRepository.findById(studentId);
        if (!student?.user_id) {
            throw new AppError('Perfil de estudiante no encontrado para notificación', 404);
        }

        const teacherUserId = activity.teacher_id?.user_id?._id || activity.teacher_id?.user_id || null;
        if (!teacherUserId) {
            throw new AppError('Docente creador no encontrado para notificación', 404);
        }

        const notification = await notificationRepository.create({
            recipient_user_id: teacherUserId,
            type: 'activity_submitted',
            title: `Nueva entrega de ${student.user_id?.person_id ? getPersonName(student.user_id.person_id) : 'un estudiante'}`,
            message: `${student.user_id?.person_id ? getPersonName(student.user_id.person_id) : 'Un estudiante'} entregó "${activity.title}" en ${activity.area_id?.name || 'la materia'}.`,
            audience_role: 'teacher',
            created_by_user_id: student.user_id?._id || student.user_id,
            created_by_role: 'student',
            source_type: 'activity',
            source_id: activity._id,
            metadata: {
                activity_id: toIdString(activity._id),
                activity_title: activity.title,
                student_id: toIdString(student._id),
                student_name: student.user_id?.person_id ? getPersonName(student.user_id.person_id) : 'Sin nombre',
                submitted_at: submittedAt,
                group_id: toIdString(activity.group_id),
                group_name: activity.group_id?.name || null,
                area_id: toIdString(activity.area_id),
                area_name: activity.area_id?.name || null,
            },
        });

        return { notification: serializeNotification(notification) };
    }

    async createAdminAnnouncement(userId, data) {
        const sender = await userRepository.findById(userId);
        if (!sender?.person_id) {
            throw new AppError('Usuario emisor no encontrado', 404);
        }

        const targetRoles = this.resolveAdminTargetRoles(data.target_role);
        const recipientsByRole = await Promise.all(targetRoles.map((role) => userRepository.findActiveByRole(role)));
        const recipients = recipientsByRole.flat();
        const items = this.buildBulkNotifications(recipients, (recipientUserId) => ({
            recipient_user_id: recipientUserId,
            type: 'admin_announcement',
            title: String(data.title || '').trim(),
            message: String(data.message || '').trim(),
            audience_role: normalizeRole(recipients.find((user) => toIdString(user._id) === recipientUserId)?.person_id?.role),
            created_by_user_id: sender._id,
            created_by_role: 'admin',
            source_type: 'announcement',
            source_id: null,
            metadata: {
                scope: 'role',
                target_role: normalizeRole(data.target_role),
                target_roles: targetRoles,
            },
        }));

        if (items.length === 0) {
            throw new AppError('No hay destinatarios válidos para este anuncio', 400);
        }

        await notificationRepository.createMany(items);
        return { created_count: items.length };
    }

    async createTeacherAnnouncement(userId, data) {
        const sender = await userRepository.findById(userId);
        const teacher = await teacherRepository.findByUserId(userId);

        if (!sender?.person_id || !teacher) {
            throw new AppError('Perfil de docente no encontrado', 404);
        }

        const assignments = await groupTeacherRepository.findByTeacher(teacher._id);
        const assignedGroupIds = [...new Set(assignments.map((item) => toIdString(item.group_id)).filter(Boolean))];
        if (assignedGroupIds.length === 0) {
            throw new AppError('El docente no tiene grupos asignados', 400);
        }

        let enrollments = [];
        let metadata = {
            scope: data.scope,
            group_id: null,
            group_name: null,
        };

        if (data.scope === 'group') {
            const requestedGroupId = String(data.group_id || '');
            if (!assignedGroupIds.includes(requestedGroupId)) {
                throw new AppError('No puedes enviar anuncios a un grupo que no tienes asignado', 403);
            }

            enrollments = await enrollmentRepository.findByGroup(requestedGroupId, 'active');
            const group = await groupRepository.findById(requestedGroupId);
            metadata = {
                scope: 'group',
                group_id: requestedGroupId,
                group_name: group?.name || null,
            };
        } else {
            enrollments = await enrollmentRepository.findByGroups(assignedGroupIds, 'active');
            metadata = {
                scope: 'all_my_students',
                group_id: null,
                group_name: null,
            };
        }

        const studentRecipients = enrollments
            .map((row) => row.student_id?.user_id)
            .filter(Boolean);

        const studentIds = enrollments.map((row) => row.student_id?._id || row.student_id).filter(Boolean);
        const guardianLinks = await StudentGuardian.find({ student_id: { $in: studentIds }, is_authorized: true }).select('guardian_id');
        const guardianIds = [...new Set(guardianLinks.map((link) => toIdString(link.guardian_id)).filter(Boolean))];
        const guardianRecipients = guardianIds.length ? await User.find({ _id: { $in: guardianIds } }).populate('person_id') : [];
        const recipients = [...studentRecipients, ...guardianRecipients];

        const items = this.buildBulkNotifications(recipients, (recipientUserId, recipient) => ({
            recipient_user_id: recipientUserId,
            type: 'teacher_announcement',
            title: String(data.title || '').trim(),
            message: String(data.message || '').trim(),
            audience_role: normalizeRole(recipient?.person_id?.role) === 'parent' ? 'parent' : 'student',
            created_by_user_id: sender._id,
            created_by_role: 'teacher',
            source_type: 'announcement',
            source_id: null,
            metadata,
        }));

        if (items.length === 0) {
            throw new AppError('No hay estudiantes destinatarios para este anuncio', 400);
        }

        await notificationRepository.createMany(items);
        return { created_count: items.length };
    }
}

export default new NotificationService();
