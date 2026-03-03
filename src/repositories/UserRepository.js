import User from '../models/UserModel.js';
import Person from '../models/PersonModel.js';

/**
 * UserRepository
 * Acceso a datos para credenciales de usuario
 */
class UserRepository {
    async create(data) {
        const user = new User(data);
        return await user.save();
    }

    async findAll(filter = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const users = await User.find(filter)
        .populate('person_id')
        .skip(skip)
        .limit(limit)
        .sort({ created_at: -1 });

    const total = await User.countDocuments(filter);

    return { users, total };
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

    async findPending() {
        const users = await User.find()
            .populate({
                path: 'person_id',
                match: { status: 'pending' },
            })
            .sort({ created_at: -1 });

        return users.filter(user => user.person_id);
    }

    async countByRole(role) {
        const roleMap = {
            student: 'Student',
            teacher: 'Teacher',
            admin: 'Admin',
            guardian: 'Guardian',
        };

        const normalizedRole = roleMap[String(role || '').toLowerCase()] || role;
        return await Person.countDocuments({ role: normalizedRole });
    }

    async countByStatus(status) {
        return await Person.countDocuments({ status });
    }

    async documentExists(document_number) {
        const person = await Person.findOne({ document_number });
        return person !== null;
    }
}

export default new UserRepository();
