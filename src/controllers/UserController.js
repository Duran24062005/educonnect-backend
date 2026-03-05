import { AppError, asyncHandler } from '../utils/error.js';
import UserService from '../services/UserService.js';

/**
 * UserController
 * Capa de presentación
 * Responsabilidad: Manejar requests HTTP de usuarios
 */
class UserController {
    /**
     * GET /api/users
     * Obtener todos los usuarios (admin)
     */
    getAllUsers = asyncHandler(async (req, res) => {
        // Extraer parámetros de query
        const filters = {
            role: req.query.role,
            status: req.query.status,
            search: req.query.search,
        };
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Llamar al servicio
        const result = await UserService.getAllUsers(filters, page, limit);

        res.status(200).json({
            status: 'success',
            data: result,
        });
    });

    /**
     * GET /api/users/role/:role
     * Obtener usuarios por rol (admin) con paginación
     */
    getUsersByRole = asyncHandler(async (req, res) => {
        const { role } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const result = await UserService.getUsersByRole(role, page, limit);

        res.status(200).json({
            status: 'success',
            data: result,
        });
    });

    /**
     * GET /api/users/:id
     * Obtener usuario por ID
     */
    getUserById = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const user = await UserService.getUserById(id);

        res.status(200).json({
            status: 'success',
            data: { user },
        });
    });

    /**
     * PUT /api/users/:id
     * Actualizar usuario
     */
    updateUser = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updateData = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            birthdate: req.body.birthdate,
            document_number: req.body.document_number,
        };

        // Llamar al servicio con contexto de autorización
        const user = await UserService.updateUser(
            req.userId, // Usuario actual
            id, // Usuario a actualizar
            req.userRole, // Role para verificar permisos
            updateData
        );

        res.status(200).json({
            status: 'success',
            message: 'Usuario actualizado exitosamente',
            data: { user },
        });
    });

    /**
     * PATCH /api/users/:id/profile-photo
     * Subir foto de perfil (multipart/form-data)
     */
    uploadProfilePhoto = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const file = req.file;

        if (!file) {
            throw new AppError(
                'Archivo no recibido. Envía form-data con la llave profile_photo',
                400
            );
        }

        const result = await UserService.uploadProfilePhoto(
            req.userId,
            id,
            req.userRole,
            file
        );

        res.status(200).json({
            status: 'success',
            message: 'Foto de perfil actualizada exitosamente',
            data: result,
        });
    });

    /**
     * GET /api/users/pending
     * Obtener usuarios pendientes (admin)
     */
    getPendingUsers = asyncHandler(async (req, res) => {
        const users = await UserService.getPendingUsers();

        res.status(200).json({
            status: 'success',
            data: {
                count: users.length,
                users,
            },
        });
    });

    /**
     * POST /api/users/:id/approve
     * Aprobar usuario (admin)
     */
    approveUser = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { role } = req.body || {};

        if (!role) {
            throw new AppError('El campo role es requerido', 400);
        }

        const user = await UserService.approveUser(id, role, req.userId);

        res.status(200).json({
            status: 'success',
            message: 'Usuario aprobado exitosamente',
            data: { user },
        });
    });

    /**
     * DELETE /api/users/:id
     * Rechazar/eliminar usuario (admin)
     */
    rejectUser = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const result = await UserService.rejectUser(id);

        res.status(200).json({
            status: 'success',
            message: result.message,
        });
    });

    /**
     * PATCH /api/users/:id/status
     * Cambiar estado de usuario (admin)
     */
    changeUserStatus = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { status } = req.body || {};

        if (!status) {
            throw new AppError('El campo status es requerido', 400);
        }

        const user = await UserService.changeUserStatus(id, status, req.userId);

        res.status(200).json({
            status: 'success',
            message: `Estado del usuario actualizado a ${status}`,
            data: { user },
        });
    });

    /**
     * GET /api/stats/users
     * Obtener estadísticas de usuarios
     */
    getStatistics = asyncHandler(async (req, res) => {
        const stats = await UserService.getStatistics();

        res.status(200).json({
            status: 'success',
            data: stats,
        });
    });
}

export default new UserController();
