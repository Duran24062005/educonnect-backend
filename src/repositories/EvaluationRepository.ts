// @ts-nocheck
import Enrollment from '../models/EnrollmentModel.js';
import GradeItem from '../models/GradeItemModel.js';
import StudentGrade from '../models/StudentGradeModel.js';
import PeriodAreaResult from '../models/PeriodAreaResultModel.js';
import FinalResult from '../models/FinalResultModel.js';

// ==================== EnrollmentRepository ====================
class EnrollmentRepository {
    async create(data) { return await new Enrollment(data).save(); }

    enrollmentStudentPopulate() {
        return {
            path: 'student_id',
            populate: {
                path: 'user_id',
                populate: {
                    path: 'person_id',
                },
            },
        };
    }

    async findById(id) {
        return await Enrollment.findById(id)
            .populate(this.enrollmentStudentPopulate())
            .populate('school_year_id')
            .populate('group_id')
            .populate('campus_id')
            .populate('shift_id');
    }

    async findByStudentAndYear(student_id, school_year_id) {
        return await Enrollment.findOne({ student_id, school_year_id });
    }

    async findActiveByStudentAndYear(student_id, school_year_id) {
        return await Enrollment.findOne({ student_id, school_year_id, status: 'active' });
    }

    async findByGroup(group_id, status = 'active') {
        return await Enrollment.find({ group_id, status })
            .populate(this.enrollmentStudentPopulate())
            .populate('school_year_id')
            .populate('group_id')
            .populate('campus_id')
            .populate('shift_id');
    }

    async findByGroups(group_ids = [], status = 'active') {
        return await Enrollment.find({ group_id: { $in: group_ids }, status })
            .populate(this.enrollmentStudentPopulate())
            .populate('school_year_id')
            .populate('group_id')
            .populate('campus_id')
            .populate('shift_id');
    }

    async findBySchoolYear(school_year_id, status = null) {
        const filter = { school_year_id };
        if (status) filter.status = status;

        return await Enrollment.find(filter)
            .populate(this.enrollmentStudentPopulate())
            .populate('group_id')
            .populate('school_year_id')
            .populate('campus_id')
            .populate('shift_id');
    }

    async findByStudent(student_id) {
        return await Enrollment.find({ student_id })
            .populate('school_year_id')
            .populate('group_id')
            .populate('campus_id')
            .populate('shift_id')
            .sort({ created_at: -1 });
    }

    async findActiveByStudent(student_id) {
        return await Enrollment.findOne({ student_id, status: 'active' }).sort({ created_at: -1 });
    }

    async exists(student_id, school_year_id) {
        return !!(await Enrollment.findOne({ student_id, school_year_id }));
    }

    async existsActive(student_id, school_year_id) {
        return !!(await Enrollment.findOne({ student_id, school_year_id, status: 'active' }));
    }

    async update(id, data) {
        return await Enrollment.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    async countActiveByGroup(group_id) {
        return await Enrollment.countDocuments({ group_id, status: 'active' });
    }
}

// ==================== GradeItemRepository ====================
class GradeItemRepository {
    async create(data) { return await new GradeItem(data).save(); }
    async findById(id) { return await GradeItem.findById(id).populate('area_id').populate('period_id'); }
    async findByPeriodAndArea(period_id, area_id) {
        return await GradeItem.find({ period_id, area_id });
    }
    async findByPeriod(period_id) { return await GradeItem.find({ period_id }).populate('area_id'); }
    async update(id, data) { return await GradeItem.findByIdAndUpdate(id, data, { new: true, runValidators: true }); }
    async delete(id) { return await GradeItem.findByIdAndDelete(id); }

    // Validar que los porcentajes de un período+área sumen 100
    async sumPercentageByPeriodAndArea(period_id, area_id, excludeId = null) {
        const match = { period_id, area_id };
        if (excludeId) match._id = { $ne: excludeId };
        const result = await GradeItem.aggregate([
            { $match: match },
            { $group: { _id: null, total: { $sum: '$percentage' } } }
        ]);
        return result.length > 0 ? result[0].total : 0;
    }
}

// ==================== StudentGradeRepository ====================
class StudentGradeRepository {
    async create(data) { return await new StudentGrade(data).save(); }
    async findById(id) { return await StudentGrade.findById(id); }
    async findByStudentAndItem(student_id, grade_item_id) {
        return await StudentGrade.findOne({ student_id, grade_item_id });
    }
    async findByStudent(student_id) {
        return await StudentGrade.find({ student_id }).populate('grade_item_id');
    }
    async findByGradeItem(grade_item_id) {
        return await StudentGrade.find({ grade_item_id }).populate('student_id');
    }
    async upsert(student_id, grade_item_id, score) {
        return await StudentGrade.findOneAndUpdate(
            { student_id, grade_item_id },
            { score },
            { new: true, upsert: true, runValidators: true }
        );
    }
    async exists(student_id, grade_item_id) {
        return !!(await StudentGrade.findOne({ student_id, grade_item_id }));
    }
}

// ==================== PeriodAreaResultRepository ====================
class PeriodAreaResultRepository {
    async create(data) { return await new PeriodAreaResult(data).save(); }
    async findByStudentAreaPeriod(student_id, area_id, period_id) {
        return await PeriodAreaResult.findOne({ student_id, area_id, period_id });
    }
    async findByStudent(student_id) {
        return await PeriodAreaResult.find({ student_id }).populate('area_id').populate('period_id');
    }
    async findByPeriodAndArea(period_id, area_id) {
        return await PeriodAreaResult.find({ period_id, area_id }).populate('student_id');
    }
    async upsert(student_id, area_id, period_id, final_score) {
        return await PeriodAreaResult.findOneAndUpdate(
            { student_id, area_id, period_id },
            { final_score },
            { new: true, upsert: true, runValidators: true }
        );
    }
}

// ==================== FinalResultRepository ====================
class FinalResultRepository {
    async create(data) { return await new FinalResult(data).save(); }
    async findByStudentAndYear(student_id, school_year_id) {
        return await FinalResult.findOne({ student_id, school_year_id });
    }
    async findByYear(school_year_id, status = null) {
        const filter = { school_year_id };
        if (status) filter.status = status;
        return await FinalResult.find(filter).populate('student_id');
    }
    async upsert(student_id, school_year_id, final_score, status) {
        return await FinalResult.findOneAndUpdate(
            { student_id, school_year_id },
            { final_score, status },
            { new: true, upsert: true, runValidators: true }
        );
    }
    async countByYearAndStatus(school_year_id, status) {
        return await FinalResult.countDocuments({ school_year_id, status });
    }
}

export const enrollmentRepository = new EnrollmentRepository();
export const gradeItemRepository = new GradeItemRepository();
export const studentGradeRepository = new StudentGradeRepository();
export const periodAreaResultRepository = new PeriodAreaResultRepository();
export const finalResultRepository = new FinalResultRepository();
