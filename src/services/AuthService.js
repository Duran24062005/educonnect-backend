import UserRepository from '../repositories/UsersRepository.js';
import { AppError } from '../utils/error.js';
import { generateToken } from '../utils/jwt.js';

/**
 * AuthService
 * Capa de lógica de negocio (Business Logic Layer)
 * Responsabilidad: Implementar reglas de negocio de autenticación
 * - Validar datos antes de usar repository
 * - Ejecutar lógica de negocio compleja
 * - Coordinar entre repositories si es necesario
 * - Lanzar errores personalizados
 */
class AuthService {
    /**
     * Registrar nuevo usuario
     * @param {Object} data - Datos de registro
     * @returns {Promise<{user: Object, token: string}>}
     */
    async register(data) {
        const {
            first_name,
            last_name,
            email,
            password,
            password_confirm,
            birthdate,
            document_number,
            requested_role = 'student',
        } = data;

        // ============ VALIDACIONES DE NEGOCIO ============

        // Validar campos requeridos
        if (!first_name || !last_name || !email || !password || !birthdate) {
            throw new AppError('Todos los campos son requeridos', 400);
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new AppError('Email inválido', 400);
        }

        // Validar que las contraseñas coincidan
        if (password !== password_confirm) {
            throw new AppError('Las contraseñas no coinciden', 400);
        }

        // Validar longitud mínima de contraseña
        if (password.length < 6) {
            throw new AppError('La contraseña debe tener al menos 6 caracteres', 400);
        }

        // Validar que el rol sea válido
        const validRoles = ['student', 'teacher', 'guardian'];
        if (!validRoles.includes(requested_role)) {
            throw new AppError('Rol inválido', 400);
        }

        // ============ VERIFICAR UNICIDAD ============

        // Verificar si el email ya existe
        const emailExists = await UserRepository.emailExists(email);
        if (emailExists) {
            throw new AppError('El email ya está registrado', 400);
        }

        // Verificar si el documento ya existe (si se proporciona)
        if (document_number) {
            const docExists = await UserRepository.documentExists(document_number);
            if (docExists) {
                throw new AppError('El número de documento ya está registrado', 400);
            }
        }

        // ============ CREAR USUARIO ============

        const newUser = await UserRepository.create({
            first_name,
            last_name,
            email,
            password,
            birthdate,
            document_number,
            role: requested_role,
            status: 'pending', // Los usuarios nuevos comienzan pendientes
        });

        // Generar token
        const token = generateToken(newUser._id, newUser.role);

        return {
            user: newUser.toJSON(),
            token,
        };
    }

    /**
     * Login de usuario
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña
     * @returns {Promise<{user: Object, token: string}>}
     */
    async login(email, password) {
        // ============ VALIDACIONES ============

        if (!email || !password) {
            throw new AppError('Email y contraseña son requeridos', 400);
        }

        // ============ BUSCAR USUARIO ============

        // Incluir contraseña en la búsqueda
        const user = await UserRepository.findByEmail(email, true);

        if (!user) {
            throw new AppError('Email o contraseña incorrectos', 401);
        }

        // ============ VALIDAR CONTRASEÑA ============

        const isPasswordValid = await user.matchPassword(password);
        if (!isPasswordValid) {
            throw new AppError('Email o contraseña incorrectos', 401);
        }

        // ============ VALIDAR ESTADO ============

        if (user.status !== 'active') {
            throw new AppError(
                `Tu cuenta no está activa (estado: ${user.status})`,
                403
            );
        }

        // ============ ACTUALIZAR ÚLTIMO LOGIN ============

        await UserRepository.updateLastLogin(user._id);

        // ============ GENERAR TOKEN ============

        const token = generateToken(user._id, user.role);

        return {
            user: user.toJSON(),
            token,
        };
    }

    /**
     * Cambiar contraseña
     * @param {string} userId - ID del usuario
     * @param {string} currentPassword - Contraseña actual
     * @param {string} newPassword - Nueva contraseña
     * @param {string} newPasswordConfirm - Confirmación
     * @returns {Promise<Object>}
     */
    async changePassword(userId, currentPassword, newPassword, newPasswordConfirm) {
        // ============ VALIDACIONES ============

        if (!currentPassword || !newPassword || !newPasswordConfirm) {
            throw new AppError('Todos los campos son requeridos', 400);
        }

        if (newPassword.length < 6) {
            throw new AppError('La nueva contraseña debe tener al menos 6 caracteres', 400);
        }

        if (newPassword !== newPasswordConfirm) {
            throw new AppError('Las nuevas contraseñas no coinciden', 400);
        }

        // ============ OBTENER USUARIO ============

        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new AppError('Usuario no encontrado', 404);
        }

        // Obtener usuario con contraseña para validar
        const userWithPassword = await UserRepository.findByEmail(user.email, true);

        // ============ VALIDAR CONTRASEÑA ACTUAL ============

        const isPasswordValid = await userWithPassword.matchPassword(currentPassword);
        if (!isPasswordValid) {
            throw new AppError('La contraseña actual es incorrecta', 401);
        }

        // ============ ACTUALIZAR CONTRASEÑA ============

        userWithPassword.password = newPassword;
        await userWithPassword.save();

        return {
            message: 'Contraseña actualizada exitosamente',
        };
    }

    /**
     * Obtener usuario actual
     * @param {string} userId - ID del usuario
     * @returns {Promise<Object>}
     */
    async getCurrentUser(userId) {
        const user = await UserRepository.findById(userId);

        if (!user) {
            throw new AppError('Usuario no encontrado', 404);
        }

        return user.toJSON();
    }
}

export default new AuthService();