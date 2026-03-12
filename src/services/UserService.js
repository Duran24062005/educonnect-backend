import UserRepository from '../repositories/UserRepository.js';
import PersonRepository from '../repositories/PersonRepository.js';
import { AppError } from '../utils/error.js';
import fs from 'fs/promises';
import path from 'path';
import { ensureUploadDir } from '../utils/uploads.js';

const UPLOADS_PROFILE_DIR = ensureUploadDir('profiles');

/**
 * UserService
 * Capa de lógica de negocio
 * Responsabilidad: Lógica de negocio de gestión de usuarios
 */
class UserService {
    /**
     * Subir foto de perfil
     * @param {string} userId - ID del usuario actual
     * @param {string} targetUserId - ID del usuario objetivo
     * @param {string} userRole - Rol del usuario actual
     * @param {Object} file - Archivo cargado con multer
     * @returns {Promise<Object>}
     */
    async uploadProfilePhoto(userId, targetUserId, userRole, file) {
        const isAdmin = String(userRole || '').toLowerCase() === 'admin';
        if (userId !== targetUserId && !isAdmin) {
            throw new AppError('No tienes permiso para actualizar este usuario', 403);
        }

        if (!file || !file.filename) {
            throw new AppError('La imagen es requerida', 400);
        }

        const user = await UserRepository.findById(targetUserId);
        if (!user) {
            throw new AppError('Usuario no encontrado', 404);
        }

        const person = await PersonRepository.findByUserId(targetUserId);
        if (!person) {
            throw new AppError('El usuario aún no tiene perfil personal', 400);
        }

        await fs.mkdir(UPLOADS_PROFILE_DIR, { recursive: true });

        const profilePhotoUrl = `/uploads/profiles/${file.filename}`;
        if (person.profile_photo_url?.startsWith('/uploads/profiles/')) {
            const oldFileName = person.profile_photo_url.replace('/uploads/profiles/', '');
            if (oldFileName && oldFileName !== file.filename) {
                const oldPath = path.join(UPLOADS_PROFILE_DIR, oldFileName);
                await fs.unlink(oldPath).catch(() => null);
            }
        }

        const updatedPerson = await PersonRepository.update(person._id, {
            profile_photo_url: profilePhotoUrl,
        });

        return {
            profile_photo_url: updatedPerson.profile_photo_url,
            person_id: updatedPerson._id,
        };
    }

    /**
     * Obtener todos los usuarios (admin)
     * @param {Object} filters - Filtros
     * @param {number} page - Página
     * @param {number} limit - Límite
     * @returns {Promise<Object>}
     */
    async getAllUsers(filters = {}, page = 1, limit = 10) {
        const normalizedRoleFilter = String(filters.role || '').toLowerCase();

        // Validar filtros
        if (normalizedRoleFilter && !['student', 'teacher', 'admin', 'parent', 'guardian'].includes(normalizedRoleFilter)) {
            throw new AppError('Rol inválido', 400);
        }

        if (filters.status && !['active', 'pending', 'inactive', 'blocked', 'egresado'].includes(filters.status)) {
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
        if (normalizedRoleFilter) filter.role = normalizedRoleFilter;
        if (filters.status) filter.status = filters.status;

        if (filters.search) filter.search = String(filters.search).trim();

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
        const { first_name, last_name, birthdate, born_date, document_number } = updateData;
        const isAdmin = String(userRole || '').toLowerCase() === 'admin';

        // ============ AUTORIZACIÓN ============

        // El usuario solo puede actualizar su propio perfil o es admin
        if (userId !== targetUserId && !isAdmin) {
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

            if (!user.person_id) {
                throw new AppError('El usuario no tiene perfil personal', 400);
            }

            // Si el documento cambió, verificar que sea único
            if (document_number !== user.person_id.document_number) {
                const docExists = await UserRepository.documentExists(document_number);
                if (docExists) {
                    throw new AppError('El número de documento ya está registrado', 400);
                }
            }
        }

        // ============ ACTUALIZAR ============

        const user = await UserRepository.findById(targetUserId);
        if (!user) {
            throw new AppError('Usuario no encontrado', 404);
        }

        if (!user.person_id) {
            throw new AppError('El usuario no tiene perfil personal', 400);
        }

        const updateFields = {};
        if (first_name) updateFields.first_name = first_name;
        if (last_name) updateFields.last_name = last_name;
        if (birthdate || born_date) updateFields.born_date = birthdate || born_date;
        if (document_number) updateFields.document_number = document_number;
        updateFields.updated_by = userId;

        await PersonRepository.update(user.person_id._id, updateFields);

        const updatedUser = await UserRepository.findById(targetUserId);
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
     * Obtener usuarios por rol (admin)
     * @param {string} role - Rol a filtrar
     * @param {number} page - Página
     * @param {number} limit - Límite
     * @returns {Promise<Object>}
     */
    async getUsersByRole(role, page = 1, limit = 10) {
        const validRoles = ['student', 'teacher', 'admin', 'parent', 'guardian'];
        if (!role || !validRoles.includes(String(role).toLowerCase())) {
            throw new AppError('Rol inválido', 400);
        }

        if (page < 1) {
            throw new AppError('Página debe ser mayor a 0', 400);
        }

        if (limit < 1 || limit > 100) {
            throw new AppError('Límite debe estar entre 1 y 100', 400);
        }

        const { users, total } = await UserRepository.findByRole(role, page, limit);

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
     * Aprobar usuario (admin)
     * @param {string} userId - ID del usuario a aprobar
     * @param {string} role - Role a asignar
     * @param {string} adminId - ID del admin
     * @returns {Promise<Object>}
     */
    async approveUser(userId, role, adminId) {
        // ============ VALIDAR ROLE ============

        const normalizedRole = String(role || '').toLowerCase();
        const validRoles = ['student', 'teacher', 'admin', 'parent', 'guardian'];
        if (!validRoles.includes(normalizedRole)) {
            throw new AppError('Role inválido', 400);
        }

        // ============ VALIDAR USUARIO ============

        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new AppError('Usuario no encontrado', 404);
        }

        const person = user.person_id;
        if (!person) {
            throw new AppError('El usuario no tiene perfil personal', 400);
        }

        if (person.status !== 'pending') {
            throw new AppError('El usuario no está pendiente de aprobación', 400);
        }

        // ============ ACTUALIZAR ============

        const roleMap = {
            student: 'Student',
            teacher: 'Teacher',
            admin: 'Admin',
            parent: 'Parent',
            guardian: 'Parent',
        };

        await PersonRepository.update(person._id, {
            role: roleMap[normalizedRole],
            status: 'active',
            updated_by: adminId,
        });

        const approvedUser = await UserRepository.findById(userId);
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

        const validStatuses = ['active', 'pending', 'inactive', 'blocked', 'egresado'];
        if (!validStatuses.includes(newStatus)) {
            throw new AppError('Estado inválido', 400);
        }

        // ============ VALIDAR USUARIO ============

        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new AppError('Usuario no encontrado', 404);
        }

        const person = user.person_id;
        if (!person) {
            throw new AppError('El usuario no tiene perfil personal', 400);
        }

        // ============ ACTUALIZAR ============

        await PersonRepository.update(person._id, {
            status: newStatus,
            updated_by: adminId,
        });

        const updatedUser = await UserRepository.findById(userId);
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
        const parentCount = await UserRepository.countByRole('parent');

        const activeCount = await UserRepository.countByStatus('active');
        const pendingCount = await UserRepository.countByStatus('pending');
        const inactiveCount = await UserRepository.countByStatus('inactive');
        const blockedCount = await UserRepository.countByStatus('blocked');
        const graduatedCount = await UserRepository.countByStatus('egresado');

        return {
            by_role: {
                student: studentCount,
                teacher: teacherCount,
                admin: adminCount,
                parent: parentCount,
                guardian: parentCount,
            },
            by_status: {
                active: activeCount,
                pending: pendingCount,
                inactive: inactiveCount,
                blocked: blockedCount,
                egresado: graduatedCount,
            },
            total: studentCount + teacherCount + adminCount + parentCount,
        };
    }
}

export default new UserService();
