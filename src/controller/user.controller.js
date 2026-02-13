import { asyncHandler, AppError } from '../utils/error.js';
import User from '../model/user.model.js';

/**
 * @desc Obtener todos los usuarios
 * @route GET /api/users
 * @access Private/Admin
 */
export const getAllUsers = asyncHandler(async (req, res, next) => {
    const { role, status, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Construir filtros
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    if (search) {
        filter.$or = [
            { first_name: { $regex: search, $options: 'i' } },
            { last_name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    // Calcular skip
    const skip = (page - 1) * limit;

    // Obtener usuarios
    const users = await User.find(filter)
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 });

    // Contar total
    const total = await User.countDocuments(filter);

    res.status(200).json({
        status: 'success',
        data: {
            users,
            pagination: {
                current_page: page,
                total_pages: Math.ceil(total / limit),
                total,
                limit,
            },
        },
    });
});

/**
 * @desc Obtener usuario por ID
 * @route GET /api/users/:id
 * @access Private
 */
export const getUserById = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    res.status(200).json({
        status: 'success',
        data: { user },
    });
});

/**
 * @desc Actualizar usuario
 * @route PUT /api/users/:id
 * @access Private
 */
export const updateUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { first_name, last_name, birthdate, document_number } = req.body;

    // Validar que el usuario actualiza su propio perfil o es admin
    if (req.userId !== id && req.userRole !== 'admin') {
        throw new AppError('No tienes permiso para actualizar este usuario', 403);
    }

    const user = await User.findById(id);
    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    // Actualizar campos permitidos
    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    if (birthdate) user.birthdate = birthdate;
    if (document_number) user.document_number = document_number;

    user.updated_by = req.userId;
    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'Usuario actualizado exitosamente',
        data: { user },
    });
});

/**
 * @desc Obtener usuarios pendientes de aprobación
 * @route GET /api/users/pending
 * @access Private/Admin
 */
export const getPendingUsers = asyncHandler(async (req, res, next) => {
    const users = await User.find({ status: 'pending' }).sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        data: {
            count: users.length,
            users,
        },
    });
});

/**
 * @desc Aprobar usuario y asignar rol
 * @route POST /api/users/:id/approve
 * @access Private/Admin
 */
export const approveUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['student', 'teacher', 'admin', 'guardian'].includes(role)) {
        throw new AppError('Por favor proporciona un rol válido', 400);
    }

    const user = await User.findById(id);
    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    if (user.status !== 'pending') {
        throw new AppError('El usuario no está pendiente de aprobación', 400);
    }

    user.role = role;
    user.status = 'active';
    user.updated_by = req.userId;
    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'Usuario aprobado exitosamente',
        data: { user },
    });
});

/**
 * @desc Rechazar usuario (eliminarlo)
 * @route DELETE /api/users/:id
 * @access Private/Admin
 */
export const rejectUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    res.status(200).json({
        status: 'success',
        message: 'Usuario eliminado exitosamente',
    });
});

/**
 * @desc Cambiar estado de usuario
 * @route PATCH /api/users/:id/status
 * @access Private/Admin
 */
export const changeUserStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'pending', 'inactive', 'blocked'].includes(status)) {
        throw new AppError('Estado inválido', 400);
    }

    const user = await User.findById(id);
    if (!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    user.status = status;
    user.updated_by = req.userId;
    await user.save();

    res.status(200).json({
        status: 'success',
        message: `Estado del usuario actualizado a ${status}`,
        data: { user },
    });
});