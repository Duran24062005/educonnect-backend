import { asyncHandler, AppError } from '../utils/error.js';
import { generateToken } from '../utils/jwt.js';
import User from '../model/user.model.js';

/**
 * @desc Registrar nuevo usuario
 * @route POST /api/auth/register
 * @access Public
 */
export const register = asyncHandler(async (req, res, next) => {
    const {
        first_name,
        last_name,
        email,
        password,
        password_confirm,
        birthdate,
        document_number,
        requested_role = 'student',
        invitation_code,
    } = req.body;

    // Validar campos requeridos
    if (!first_name || !last_name || !email || !password || !birthdate) {
        throw new AppError('Por favor proporciona todos los campos requeridos', 400);
    }

    // Validar contraseña confirmada
    if (password !== password_confirm) {
        throw new AppError('Las contraseñas no coinciden', 400);
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
        throw new AppError('La contraseña debe tener al menos 6 caracteres', 400);
    }

    // Verificar si el email ya existe
    let existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError('El email ya está registrado', 400);
    }

    // Verificar si el documento ya existe
    if (document_number) {
        existingUser = await User.findOne({ document_number });
        if (existingUser) {
            throw new AppError('El número de documento ya está registrado', 400);
        }
    }

    // Determinar rol y estado
    let role = requested_role;
    let status = 'pending';

    // Si hay código de invitación (implementar validación después)
    if (invitation_code) {
        // TODO: Validar código de invitación
        // Por ahora, activar automáticamente
        status = 'active';
    }

    // Crear usuario
    const user = await User.create({
        first_name,
        last_name,
        email,
        password,
        birthdate,
        document_number,
        role,
        status,
    });

    // Generar token
    const token = generateToken(user._id, user.role);

    // Respuesta
    res.status(201).json({
        status: 'success',
        message: 'Usuario registrado exitosamente',
        data: {
            user: user.toJSON(),
            token,
        },
    });
});

/**
 * @desc Login de usuario
 * @route POST /api/auth/login
 * @access Public
 */
export const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
        throw new AppError('Por favor proporciona email y contraseña', 400);
    }

    // Buscar usuario e incluir contraseña (select: false)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        throw new AppError('Email o contraseña incorrectos', 401);
    }

    // Comparar contraseña
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
        throw new AppError('Email o contraseña incorrectos', 401);
    }

    // Verificar estado del usuario
    if (user.status !== 'active') {
        throw new AppError('Tu cuenta no está activa', 403);
    }

    // Actualizar último login
    user.last_login = new Date();
    await user.save();

    // Generar token
    const token = generateToken(user._id, user.role);

    // Respuesta
    res.status(200).json({
        status: 'success',
        message: 'Login exitoso',
        data: {
            user: user.toJSON(),
            token,
        },
    });
});

/**
 * @desc Obtener usuario actual
 * @route GET /api/auth/me
 * @access Private
 */
export const getCurrentUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.userId);

    res.status(200).json({
        status: 'success',
        data: {
            user: user.toJSON(),
        },
    });
});

/**
 * @desc Logout (en frontend se elimina el token)
 * @route POST /api/auth/logout
 * @access Private
 */
export const logout = asyncHandler(async (req, res, next) => {
    res.status(200).json({
        status: 'success',
        message: 'Logout exitoso. Por favor elimina el token en el cliente.',
    });
});

/**
 * @desc Cambiar contraseña
 * @route POST /api/auth/change-password
 * @access Private
 */
export const changePassword = asyncHandler(async (req, res, next) => {
    const { current_password, new_password, new_password_confirm } = req.body;

    // Validar campos
    if (!current_password || !new_password || !new_password_confirm) {
        throw new AppError('Por favor proporciona todos los campos', 400);
    }

    // Obtener usuario con contraseña
    const user = await User.findById(req.userId).select('+password');

    // Verificar contraseña actual
    const isPasswordMatch = await user.matchPassword(current_password);
    if (!isPasswordMatch) {
        throw new AppError('La contraseña actual es incorrecta', 401);
    }

    // Validar nueva contraseña
    if (new_password.length < 6) {
        throw new AppError('La nueva contraseña debe tener al menos 6 caracteres', 400);
    }

    if (new_password !== new_password_confirm) {
        throw new AppError('Las nuevas contraseñas no coinciden', 400);
    }

    // Actualizar contraseña
    user.password = new_password;
    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'Contraseña actualizada exitosamente',
    });
});