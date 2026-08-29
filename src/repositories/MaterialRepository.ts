// @ts-nocheck
import Material from '../models/MaterialModel.js';

const sessionPopulate = {
    path: 'session_id',
    populate: [
        { path: 'school_year_id' },
        { path: 'group_id', populate: [{ path: 'grade_id' }, { path: 'school_year_id' }] },
        { path: 'area_id' },
        { path: 'teacher_id', populate: { path: 'user_id', populate: { path: 'person_id' } } },
        { path: 'aula_id' },
    ],
};

const materialPopulate = [
    sessionPopulate,
    { path: 'teacher_id', populate: { path: 'user_id', populate: { path: 'person_id' } } },
];

class MaterialRepository {
    async create(data) { return await new Material(data).save(); }
    async findById(id) { return await Material.findById(id).populate(materialPopulate); }
    async findByTeacher(teacherId, filters = {}) {
        return await Material.find({ teacher_id: teacherId, ...filters }).populate(materialPopulate).sort({ created_at: -1 });
    }
    async findByStudentSessions(sessionIds, filters = {}) {
        return await Material.find({ session_id: { $in: sessionIds }, ...filters }).populate(materialPopulate).sort({ created_at: -1 });
    }
    async update(id, data) {
        await Material.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        return await this.findById(id);
    }
    async delete(id) { return await Material.findByIdAndDelete(id); }
}

export default new MaterialRepository();
