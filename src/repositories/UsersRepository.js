import User from '../models/UserModel.js';

/**
 * UserRepository
 * Acceso a datos para credenciales de usuario
 */
class UserRepository {
    async create(data) {
        const user = new User(data);
        return await user.save();
    }

    async findById(id) {
        return await User.findById(id).populate('person_id');
    }

    async findByEmail(email, includePassword = false) {
        const query = User.findOne({ email }).populate('person_id');
        if (includePassword) query.select('+hash_password');
        return await query;
    }

    async findByPersonId(person_id) {
        return await User.findOne({ person_id });
    }

    async emailExists(email) {
        const u = await User.findOne({ email });
        return u !== null;
    }

    async update(id, data) {
        return await User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    async updateLastLogin(id) {
        return await User.findByIdAndUpdate(id, { last_login: new Date() }, { new: true });
    }

    async delete(id) {
        return await User.findByIdAndDelete(id);
    }
}

export default new UserRepository();