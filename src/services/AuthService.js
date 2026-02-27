import PersonRepository from '../repositories/PersonRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import { teacherRepository, studentRepository } from '../repositories/PersonProfileRepository.js';
import { AppError } from '../utils/error.js';
import { generateToken } from '../utils/jwt.js';

/**
 * AuthService
 * Lógica de negocio de autenticación con el nuevo modelo Person + User
 */
class AuthService {
    /**
     * Registrar un nuevo usuario
     * Crea Person + User + perfil de rol (Teacher/Student)
     */
    async register(data) {
        const {
            first_name,
            last_name,
            email,
            password,
            password_confirm,
            born_date,
            document_type,
            document_number,
            phone,
            requested_role = 'Student',
        } = data;

        // ===== VALIDACIONES =====
        if (!first_name || !last_name || !email || !password || !document_type || !document_number) {
            throw new AppError('Todos los campos obligatorios son requeridos', 400);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new AppError('Email inválido', 400);
        }

        if (password !== password_confirm) {
            throw new AppError('Las contraseñas no coinciden', 400);
        }

        if (password.length < 8) {
            throw new AppError('La contraseña debe tener al menos 8 caracteres', 400);
        }

        const validRoles = ['Student', 'Teacher'];
        if (!validRoles.includes(requested_role)) {
            throw new AppError('Rol solicitado inválido. Usa: Student, Teacher', 400);
        }

        if (!['CC', 'RC', 'CE'].includes(document_type)) {
            throw new AppError('Tipo de documento inválido. Usa: CC, RC, CE', 400);
        }

        // ===== UNICIDAD =====
        if (await UserRepository.emailExists(email)) {
            throw new AppError('El email ya está registrado', 400);
        }

        if (await PersonRepository.documentExists(document_number)) {
            throw new AppError('El número de documento ya está registrado', 400);
        }

        // ===== CREAR PERSON =====
        const person = await PersonRepository.create({
            first_name,
            last_name,
            phone: phone || null,
            role: requested_role,
            status: 'pending',
            born_date: born_date || null,
            document_type,
            document_number,
        });

        // ===== CREAR USER =====
        const user = await UserRepository.create({
            person_id: person._id,
            email,
            hash_password: password,
        });

        // ===== CREAR PERFIL DE ROL =====
        if (requested_role === 'Teacher') {
            await teacherRepository.create({ user_id: user._id });
        } else if (requested_role === 'Student') {
            await studentRepository.create({ user_id: user._id });
        }

        const token = generateToken(user._id, person.role);

        return {
            person: person.toObject(),
            user: user.toJSON(),
            token,
        };
    }

    /**
     * Login de usuario
     */
    async login(email, password) {
        if (!email || !password) {
            throw new AppError('Email y contraseña son requeridos', 400);
        }

        const user = await UserRepository.findByEmail(email, true);
        if (!user) {
            throw new AppError('Email o contraseña incorrectos', 401);
        }

        const isValid = await user.matchPassword(password);
        if (!isValid) {
            throw new AppError('Email o contraseña incorrectos', 401);
        }

        const person = user.person_id;
        if (!person || person.status !== 'active') {
            throw new AppError(
                `Tu cuenta no está activa (estado: ${person?.status || 'desconocido'})`,
                403
            );
        }

        await UserRepository.updateLastLogin(user._id);

        const token = generateToken(user._id, person.role);

        return {
            person: person.toObject ? person.toObject() : person,
            user: user.toJSON(),
            token,
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

        const userWithPwd = await UserRepository.findByEmail(
            (await UserRepository.findById(userId))?.email,
            true
        );
        if (!userWithPwd) throw new AppError('Usuario no encontrado', 404);

        const isValid = await userWithPwd.matchPassword(currentPassword);
        if (!isValid) throw new AppError('La contraseña actual es incorrecta', 401);

        userWithPwd.hash_password = newPassword;
        await userWithPwd.save();

        return { message: 'Contraseña actualizada exitosamente' };
    }

    /**
     * Obtener usuario actual por userId
     */
    async getCurrentUser(userId) {
        const user = await UserRepository.findById(userId);
        if (!user) throw new AppError('Usuario no encontrado', 404);
        return { user: user.toJSON(), person: user.person_id };
    }
}

export default new AuthService();