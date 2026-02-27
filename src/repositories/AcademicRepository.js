import SchoolYear from '../models/SchoolYearModel.js';
import Period from '../models/PeriodModel.js';
import Grade from '../models/GradeModel.js';
import Area from '../models/AreaModel.js';
import Aula from '../models/AulaModel.js';

// ==================== SchoolYearRepository ====================
class SchoolYearRepository {
    async create(data) { return await new SchoolYear(data).save(); }
    async findById(id) { return await SchoolYear.findById(id); }
    async findAll() { return await SchoolYear.find().sort({ year: -1 }); }
    async findActive() { return await SchoolYear.findOne({ is_active: true }); }
    async update(id, data) { return await SchoolYear.findByIdAndUpdate(id, data, { new: true, runValidators: true }); }
    async delete(id) { return await SchoolYear.findByIdAndDelete(id); }
    async yearExists(year) { return !!(await SchoolYear.findOne({ year })); }
}

// ==================== PeriodRepository ====================
class PeriodRepository {
    async create(data) { return await new Period(data).save(); }
    async findById(id) { return await Period.findById(id); }
    async findBySchoolYear(school_year_id) {
        return await Period.find({ school_year_id }).sort({ start_date: 1 });
    }
    async update(id, data) { return await Period.findByIdAndUpdate(id, data, { new: true, runValidators: true }); }
    async delete(id) { return await Period.findByIdAndDelete(id); }
}

// ==================== GradeRepository ====================
class GradeRepository {
    async create(data) { return await new Grade(data).save(); }
    async findById(id) { return await Grade.findById(id); }
    async findAll() { return await Grade.find().sort({ name: 1 }); }
    async update(id, data) { return await Grade.findByIdAndUpdate(id, data, { new: true, runValidators: true }); }
    async delete(id) { return await Grade.findByIdAndDelete(id); }
}

// ==================== AreaRepository ====================
class AreaRepository {
    async create(data) { return await new Area(data).save(); }
    async findById(id) { return await Area.findById(id); }
    async findAll() { return await Area.find().sort({ name: 1 }); }
    async update(id, data) { return await Area.findByIdAndUpdate(id, data, { new: true, runValidators: true }); }
    async delete(id) { return await Area.findByIdAndDelete(id); }
}

// ==================== AulaRepository ====================
class AulaRepository {
    async create(data) { return await new Aula(data).save(); }
    async findById(id) { return await Aula.findById(id); }
    async findAll() { return await Aula.find().sort({ name: 1 }); }
    async update(id, data) { return await Aula.findByIdAndUpdate(id, data, { new: true, runValidators: true }); }
    async delete(id) { return await Aula.findByIdAndDelete(id); }
}

export const schoolYearRepository = new SchoolYearRepository();
export const periodRepository = new PeriodRepository();
export const gradeRepository = new GradeRepository();
export const areaRepository = new AreaRepository();
export const aulaRepository = new AulaRepository();
