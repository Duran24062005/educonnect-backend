// @ts-nocheck
import PersonRepository from '../../repositories/PersonRepository.js';
import UserRepository from '../../repositories/UserRepository.js';
import { teacherRepository, studentRepository } from '../../repositories/PersonProfileRepository.js';
import { AppError } from '../../utils/error.js';
import SessionService from './SessionService.js';
import AuditLogService from '../audit/AuditLogService.js';
import MediaUrlService from '../../shared/storage/mediaUrl.service.js';

/**
 * AuthService
 * Registro en dos pasos:
 *   1. register()        → crea User (email + contraseña)
 *   2. completeProfile() → crea Person con user_id y la vincula al User (person_id)
 *
 * Relación bidireccional:
 *   User.person_id  → Person
 *   Person.user_id  → User
 */
class AuthService {
    normalizeEmail(email) {
        return String(email || '').trim().toLowerCase();
    }

    /**
     * PASO 1 — Registro inicial
     * Solo email y contraseña. El User queda sin person_id (null).
     */
    async register(data) {
        const normalizedEmail = this.normalizeEmail(data?.email);
        const { password, password_confirm } = data;

        if (!normalizedEmail || !password || !password_confirm) {
            throw new AppError('Email, contraseña y confirmación son requeridos', 400);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            throw new AppError('Email inválido', 400);
        }

        if (password !== password_confirm) {
            throw new AppError('Las contraseñas no coinciden', 400);
        }

        if (password.length < 8) {
            throw new AppError('La contraseña debe tener al menos 8 caracteres', 400);
        }

        if (await UserRepository.emailExists(normalizedEmail)) {
            throw new AppError('El email ya está registrado', 400);
        }

        const user = await UserRepository.create({
            email: normalizedEmail,
            hash_password: password,
            // person_id queda null hasta completar perfil
        });

        const session = await SessionService.create({ userId: user._id });

        return {
            user: user.toJSON(),
            token: session.token,
            profile_complete: false,
        };
    }

    /**
     * PASO 2 — Completar perfil personal
     * Crea Person con user_id y actualiza User.person_id.
     */
    async completeProfile(userId, data, currentSessionId: string | null | undefined = null, requestContext: Record<string, unknown> = {}) {
        const {
            first_name,
            last_name,
            born_date,
            document_type,
            document_number,
            phone,
            requested_role = 'Student',
        } = data;

        if (!first_name || !last_name || !document_type || !document_number) {
            throw new AppError(
                'Nombre, apellido, tipo y número de documento son requeridos',
                400
            );
        }

        if (!['Student', 'Teacher', 'Parent', 'Guardian'].includes(requested_role)) {
            throw new AppError('Rol solicitado inválido. Usa: Student, Teacher, Parent', 400);
        }

        const normalizedRole = requested_role === 'Guardian' ? 'Parent' : requested_role;

        if (!['CC', 'RC', 'CE'].includes(document_type)) {
            throw new AppError('Tipo de documento inválido. Usa: CC, RC, CE', 400);
        }

        const user = await UserRepository.findById(userId);
        if (!user) throw new AppError('Usuario no encontrado', 404);

        if (user.person_id) {
            throw new AppError('El perfil personal ya fue completado', 400);
        }

        if (await PersonRepository.documentExists(document_number)) {
            throw new AppError('El número de documento ya está registrado', 400);
        }

        // Crear Person con referencia al User
        const person = await PersonRepository.create({
            user_id: userId,          // ← relación Person → User
            first_name,
            last_name,
            phone: phone || null,
            role: normalizedRole,
            status: 'pending',
            born_date: born_date || null,
            document_type,
            document_number,
        });

        // Actualizar User con referencia a la Person recién creada
        await UserRepository.update(userId, { person_id: person._id }); // ← relación User → Person

        // Crear perfil de rol
        if (normalizedRole === 'Teacher') {
            await teacherRepository.create({ user_id: userId });
        } else if (normalizedRole === 'Student') {
            await studentRepository.create({ user_id: userId });
        }

        if (currentSessionId) {
            await SessionService.revoke(currentSessionId, String(userId), 'profile_completed');
        }

        const session = await SessionService.create({
            userId,
            role: normalizedRole,
            institutionId: user.institution_id,
            ...requestContext,
        });

        return {
            person: person.toObject(),
            user: { ...user.toJSON(), person_id: person._id },
            token: session.token,
            profile_complete: true,
        };
    }

    /**
     * Login
     */
    async login(email, password) {
        const normalizedEmail = this.normalizeEmail(email);

        if (!normalizedEmail || !password) {
            throw new AppError('Email y contraseña son requeridos', 400);
        }

        const user = await UserRepository.findByEmail(normalizedEmail, true);
        if (!user) {
            throw new AppError('Email o contraseña incorrectos', 401);
        }

        const isValid = await user.matchPassword(password);
        if (!isValid) {
            throw new AppError('Email o contraseña incorrectos', 401);
        }

        const person = user.person_id;

        if (person && person.status !== 'active') {
            throw new AppError(
                `Tu cuenta no está activa (estado: ${person.status})`,
                403
            );
        }

        await UserRepository.updateLastLogin(user._id);

        const session = await SessionService.create({
            userId: user._id,
            role: person?.role || null,
            institutionId: user.institution_id,
        });
        await MediaUrlService.refreshUser(user);

        return {
            person: person ? (person.toObject ? person.toObject() : person) : null,
            user: user.toJSON(),
            token: session.token,
            profile_complete: !!person,
        };
    }

    /**
     * Cambiar contraseña
     */
    async changePassword(userId, currentPassword, newPassword, newPasswordConfirm) {
        if (!currentPassword || !newPassword || !newPasswordConfirm) {
            throw new AppError('Todos los campos son requeridos', 400);
        }

        if (newPassword.length < 8) {
            throw new AppError('La nueva contraseña debe tener al menos 8 caracteres', 400);
        }

        if (newPassword !== newPasswordConfirm) {
            throw new AppError('Las nuevas contraseñas no coinciden', 400);
        }

        const userBase = await UserRepository.findById(userId);
        if (!userBase) throw new AppError('Usuario no encontrado', 404);

        const userWithPwd = await UserRepository.findByEmail(userBase.email, true);

        const isValid = await userWithPwd.matchPassword(currentPassword);
        if (!isValid) throw new AppError('La contraseña actual es incorrecta', 401);

        userWithPwd.hash_password = newPassword;
        await userWithPwd.save();
        await SessionService.revokeAll(String(userId), 'password_changed');

        return { message: 'Contraseña actualizada exitosamente' };
    }

    /**
     * Obtener usuario actual
     */
    async getCurrentUser(userId) {
        const user = await UserRepository.findById(userId);
        if (!user) throw new AppError('Usuario no encontrado', 404);
        await MediaUrlService.refreshUser(user);
        return {
            user: user.toJSON(),
            person: user.person_id || null,
            profile_complete: !!user.person_id,
        };
    }

    async logout(userId, sessionId, requestContext = {}) {
        if (sessionId) {
            await SessionService.revoke(sessionId, String(userId), 'logout');
            await AuditLogService.record({
                actorUserId: userId,
                actorRole: 'authenticated_user',
                action: 'session.revoked',
                entityType: 'Session',
                entityId: sessionId,
                before: { revoked_at: null },
                after: { revoked_at: new Date().toISOString(), reason: 'logout' },
                ...requestContext,
            });
        }

        return { message: 'Logout exitoso' };
    }

    /**
     * Obtener estado de completitud de perfil
     * Permite al frontend decidir si mostrar la pantalla
     * de completar perfil.
     */
    async getProfileCompletionStatus(userId) {
        const user = await UserRepository.findById(userId);
        if (!user) throw new AppError('Usuario no encontrado', 404);

        return {
            profile_complete: !!user.person_id,
            person_status: user.person_id?.status || null,
        };
    }
}

export default new AuthService();
