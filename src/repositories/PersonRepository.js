import Person from '../models/PersonModel.js';

/**
 * PersonRepository
 * Acceso a datos para personas
 */
class PersonRepository {
    async create(data) {
        const person = new Person(data);
        return await person.save();
    }

    async findById(id) {
        return await Person.findById(id);
    }

    async findByDocumentNumber(document_number) {
        return await Person.findOne({ document_number });
    }

    async documentExists(document_number) {
        const p = await Person.findOne({ document_number });
        return p !== null;
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const persons = await Person.find(filters).limit(limit).skip(skip).sort({ created_at: -1 });
        const total = await Person.countDocuments(filters);
        return { persons, total };
    }

    async update(id, data) {
        return await Person.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    async delete(id) {
        return await Person.findByIdAndDelete(id);
    }

    async countByRole(role) {
        return await Person.countDocuments({ role });
    }

    async countByStatus(status) {
        return await Person.countDocuments({ status });
    }
}

export default new PersonRepository();