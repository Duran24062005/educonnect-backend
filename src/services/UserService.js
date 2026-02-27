import UserRepository from '../repositories/UserRepository.js';
import { AppError } from '../utils/error.js';

/**
 * UserService
 * Capa de lógica de negocio
 * Responsabilidad: Lógica de negocio de gestión de usuarios
 */
class UserService {
    /**
     * Obtener todos los usuarios (admin)
     * @param {Object} filters - Filtros
     * @param {number} page - Página
     * @param {number} limit - Límite
     * @returns {Promise<Object>}
     */
    async getAllUsers(filters = {}, page = 1, limit = 10) {
        // Validar filtros
        if (filters.role && !['student', 'teacher', 'admin', 'guardian'].includes(filters.role)) {
            throw new AppError('Rol inválido', 400);
        }

        if (filters.status && !['active', 'pending', 'inactive', 'blocked'].includes(filters.status)) {
            throw new AppError('Estado inválido', 400);
        }

        // Validar paginación
        if (page < 1) {
            throw new AppError('Página debe ser mayor a 0', 400);
        }

        if (limit < 1 || limit > 100) {
            throw new AppError('Límite debe estar entre 1 y 100', 400);
        }

        // Aplicar filtros de búsqueda
        const filter = {};
        if (filters.role) filter.role = filters.role;
        if (filters.status) filter.status = filters.status;

        if (filters.search) {
            filter.$or = [
                { first_name: { $regex: filters.search, $options: 'i' } },
                { last_name: { $regex: filters.search, $options: 'i' } },
                { email: { $regex: filters.search, $options: 'i' } },
            ];
        }

        const { users, total } = await UserRepository.findAll(filter, page, limit);

        return {
            users,
            pagination: {
                current_page: page,
                total_pages: Math.ceil(total / limit),
                total,
                limit,
            },
        };
    }

    /**
     * Obtener usuario por ID
     * @param {string} userId - ID del usuario
     * @returns {Promise<Object>}
     */
    async getUserById(userId) {
        const user = await UserRepository.findById(userId);

        if (!user) {
            throw new AppError('Usuario no encontrado', 404);
        }

        return user.toJSON();
    }

    /**
     * Actualizar perfil de usuario
     * @param {string} userId - ID del usuario actual
     * @param {string} targetUserId - ID del usuario a actualizar
     * @param {string} userRole - Role del usuario actual
     * @param {Object} updateData - Datos a actualizar
     * @returns {Promise<Object>}
     */
    async updateUser(userId, targetUserId, userRole, updateData) {
        const { first_name, last_name, birthdate, document_number } = updateData;

        // ============ AUTORIZACIÓN ============

        // El usuario solo puede actualizar su propio perfil o es admin
        if (userId !== targetUserId && userRole !== 'admin') {
            throw new AppError('No tienes permiso para actualizar este usuario', 403);
        }

        // ============ VALIDAR DATOS ============

        if (first_name && first_name.length < 2) {
            throw new AppError('El nombre debe tener al menos 2 caracteres', 400);
        }

        if (last_name && last_name.length < 2) {
            throw new AppError('El apellido debe tener al menos 2 caracteres', 400);
        }

        // ============ VALIDAR DOCUMENTO ÚNICO ============

        if (document_number) {
            const user = await UserRepository.findById(targetUserId);
            if (!user) {
                throw new AppError('Usuario no encontrado', 404);
            }

            // Si el documento cambió, verificar que sea único
            if (document_number !== user.document_number) {
                const docExists = await UserRepository.documentExists(document_number);
                if (docExists) {
                    throw new AppError('El número de documento ya está registrado', 400);
                }
            }
        }

        // ============ ACTUALIZAR ============

        const updateFields = {};
        if (first_name) updateFields.first_name = first_name;
        if (last_name) updateFields.last_name = last_name;
        if (birthdate) updateFields.birthdate = birthdate;
        if (document_number) updateFields.document_number = document_number;

        updateFields.updated_by = userId;

        const updatedUser = await UserRepository.update(targetUserId, updateFields);

        if (!updatedUser) {
            throw new AppError('Usuario no encontrado', 404);
        }

        return updatedUser.toJSON();
    }

    /**
     * Obtener usuarios pendientes (admin)
     * @returns {Promise<Array>}
     */
    async getPendingUsers() {
        const users = await UserRepository.findPending();
        return users.map(user => user.toJSON());
    }

    /**
     * Aprobar usuario (admin)
     * @param {string} userId - ID del usuario a aprobar
     * @param {string} role - Role a asignar
     * @param {string} adminId - ID del admin
     * @returns {Promise<Object>}
     */
    async approveUser(userId, role, adminId) {
        // ============ VALIDAR ROLE ============

        const validRoles = ['student', 'teacher', 'admin', 'guardian'];
        if (!validRoles.includes(role)) {
            throw new AppError('Role inválido', 400);
        }

        // ============ VALIDAR USUARIO ============

        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new AppError('Usuario no encontrado', 404);
        }

        if (user.status !== 'pending') {
            throw new AppError('El usuario no está pendiente de aprobación', 400);
        }

        // ============ ACTUALIZAR ============

        const approvedUser = await UserRepository.update(userId, {
            role,
            status: 'active',
            updated_by: adminId,
        });

        return approvedUser.toJSON();
    }

    /**
     * Rechazar usuario (admin) - Eliminar
     * @param {string} userId - ID del usuario a rechazar
     * @returns {Promise<Object>}
     */
    async rejectUser(userId) {
        const user = await UserRepository.findById(userId);

        if (!user) {
            throw new AppError('Usuario no encontrado', 404);
        }

        await UserRepository.delete(userId);

        return {
            message: 'Usuario eliminado exitosamente',
        };
    }

    /**
     * Cambiar estado de usuario (admin)
     * @param {string} userId - ID del usuario
     * @param {string} newStatus - Nuevo estado
     * @param {string} adminId - ID del admin
     * @returns {Promise<Object>}
     */
    async changeUserStatus(userId, newStatus, adminId) {
        // ============ VALIDAR ESTADO ============

        const validStatuses = ['active', 'pending', 'inactive', 'blocked'];
        if (!validStatuses.includes(newStatus)) {
            throw new AppError('Estado inválido', 400);
        }

        // ============ VALIDAR USUARIO ============

        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new AppError('Usuario no encontrado', 404);
        }

        // ============ ACTUALIZAR ============

        const updatedUser = await UserRepository.update(userId, {
            status: newStatus,
            updated_by: adminId,
        });

        return updatedUser.toJSON();
    }

    /**
     * Obtener estadísticas
     * @returns {Promise<Object>}
     */
    async getStatistics() {
        const studentCount = await UserRepository.countByRole('student');
        const teacherCount = await UserRepository.countByRole('teacher');
        const adminCount = await UserRepository.countByRole('admin');
        const guardianCount = await UserRepository.countByRole('guardian');

        const activeCount = await UserRepository.countByStatus('active');
        const pendingCount = await UserRepository.countByStatus('pending');
        const inactiveCount = await UserRepository.countByStatus('inactive');
        const blockedCount = await UserRepository.countByStatus('blocked');

        return {
            by_role: {
                student: studentCount,
                teacher: teacherCount,
                admin: adminCount,
                guardian: guardianCount,
            },
            by_status: {
                active: activeCount,
                pending: pendingCount,
                inactive: inactiveCount,
                blocked: blockedCount,
            },
            total: studentCount + teacherCount + adminCount + guardianCount,
        };
    }
}

export default new UserService();