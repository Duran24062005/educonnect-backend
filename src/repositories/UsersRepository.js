import User from '../models/UserModel.js';

/**
 * UserRepository
 * Capa de acceso a datos (Data Access Layer)
 * Responsabilidad: SOLO operaciones con la base de datos (CRUD)
 * No contiene lógica de negocio, NO valida datos
 */
class UserRepository {
    /**
     * Crear un nuevo usuario
     * @param {Object} userData - Datos del usuario
     * @returns {Promise<Object>} Usuario creado
     */
    async create(userData) {
        const user = new User(userData);
        return await user.save();
    }

    /**
     * Obtener usuario por ID
     * @param {string} id - ID del usuario
     * @returns {Promise<Object|null>} Usuario o null
     */
    async findById(id) {
        return await User.findById(id);
    }

    /**
     * Obtener usuario por email
     * @param {string} email - Email del usuario
     * @param {boolean} includePassword - Incluir contraseña
     * @returns {Promise<Object|null>} Usuario o null
     */
    async findByEmail(email, includePassword = false) {
        const query = User.findOne({ email });
        if (includePassword) {
            query.select('+password');
        }
        return await query;
    }

    /**
     * Obtener usuario por número de documento
     * @param {string} documentNumber - Número de documento
     * @returns {Promise<Object|null>} Usuario o null
     */
    async findByDocumentNumber(documentNumber) {
        return await User.findOne({ document_number: documentNumber });
    }

    /**
     * Obtener todos los usuarios con filtros
     * @param {Object} filters - Filtros de búsqueda
     * @param {number} page - Número de página
     * @param {number} limit - Límite de resultados
     * @returns {Promise<{users: Array, total: number}>}
     */
    async findAll(filters = {}, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const users = await User.find(filters)
            .limit(limit)
            .skip(skip)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(filters);

        return { users, total };
    }

    /**
     * Obtener usuarios pendientes
     * @returns {Promise<Array>} Usuarios pendientes
     */
    async findPending() {
        return await User.find({ status: 'pending' }).sort({ createdAt: -1 });
    }

    /**
     * Actualizar usuario
     * @param {string} id - ID del usuario
     * @param {Object} updateData - Datos a actualizar
     * @returns {Promise<Object>} Usuario actualizado
     */
    async update(id, updateData) {
        return await User.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });
    }

    /**
     * Eliminar usuario
     * @param {string} id - ID del usuario
     * @returns {Promise<Object>} Usuario eliminado
     */
    async delete(id) {
        return await User.findByIdAndDelete(id);
    }

    /**
     * Verificar si email existe
     * @param {string} email - Email a verificar
     * @returns {Promise<boolean>}
     */
    async emailExists(email) {
        const user = await User.findOne({ email });
        return user !== null;
    }

    /**
     * Verificar si documento existe
     * @param {string} documentNumber - Documento a verificar
     * @returns {Promise<boolean>}
     */
    async documentExists(documentNumber) {
        const user = await User.findOne({ document_number: documentNumber });
        return user !== null;
    }

    /**
     * Contar usuarios por role
     * @param {string} role - Role a contar
     * @returns {Promise<number>}
     */
    async countByRole(role) {
        return await User.countDocuments({ role });
    }

    /**
     * Contar usuarios por status
     * @param {string} status - Status a contar
     * @returns {Promise<number>}
     */
    async countByStatus(status) {
        return await User.countDocuments({ status });
    }

    /**
     * Actualizar último login
     * @param {string} id - ID del usuario
     * @returns {Promise<Object>}
     */
    async updateLastLogin(id) {
        return await User.findByIdAndUpdate(
            id,
            { last_login: new Date() },
            { new: true }
        );
    }
}

export default new UserRepository();