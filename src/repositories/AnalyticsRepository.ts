// @ts-nocheck
import mongoose from 'mongoose';
import Student from '../models/StudentModel.js';
import Teacher from '../models/TeacherModel.js';
import Period from '../models/PeriodModel.js';
import SchoolYear from '../models/SchoolYearModel.js';
import Area from '../models/AreaModel.js';
import Group from '../models/GroupModel.js';
import GroupTeacher from '../models/GroupTeacherModel.js';
import Enrollment from '../models/EnrollmentModel.js';
import PeriodAreaResult from '../models/PeriodAreaResultModel.js';
import FinalResult from '../models/FinalResultModel.js';

class AnalyticsRepository {
    async findStudentByUserId(userId) {
        return Student.findOne({ user_id: userId });
    }

    async findTeacherByUserId(userId) {
        return Teacher.findOne({ user_id: userId });
    }

    async findSchoolYearById(schoolYearId) {
        return SchoolYear.findById(schoolYearId);
    }

    async findPeriodsBySchoolYear(schoolYearId) {
        return Period.find({ school_year_id: schoolYearId }).sort({ start_date: 1 });
    }

    async findAreaById(areaId) {
        return Area.findById(areaId);
    }

    async findPeriodAreaResults(filters) {
        return PeriodAreaResult.find(filters).populate('area_id').populate('period_id');
    }

    async findFinalResult(studentId, schoolYearId) {
        return FinalResult.findOne({ student_id: studentId, school_year_id: schoolYearId });
    }

    async findFinalResultsByYear(schoolYearId) {
        return FinalResult.find({ school_year_id: schoolYearId });
    }

    async findTeacherAssignmentsByYear(teacherId, schoolYearId) {
        const rows = await GroupTeacher.find({ teacher_id: teacherId })
            .populate({
                path: 'group_id',
                populate: [{ path: 'grade_id' }, { path: 'school_year_id' }],
            })
            .populate('area_id');

        return rows.filter((row) => {
            const groupYearId = row.group_id?.school_year_id?._id?.toString() || row.group_id?.school_year_id?.toString();
            return groupYearId === schoolYearId.toString();
        });
    }

    async teacherHasAssignment(teacherId, groupId, areaId, schoolYearId) {
        const assignment = await GroupTeacher.findOne({ teacher_id: teacherId, group_id: groupId, area_id: areaId })
            .populate({ path: 'group_id', populate: { path: 'school_year_id' } });

        if (!assignment) return false;

        const groupYearId = assignment.group_id?.school_year_id?._id?.toString() || assignment.group_id?.school_year_id?.toString();
        return groupYearId === schoolYearId.toString();
    }

    async findGroupById(groupId) {
        return Group.findById(groupId).populate('grade_id');
    }

    async findGroupsBySchoolYear(schoolYearId) {
        return Group.find({ school_year_id: schoolYearId }).populate('grade_id').sort({ name: 1 });
    }

    async findActiveEnrollmentsByGroupAndYear(groupId, schoolYearId) {
        return Enrollment.find({
            group_id: groupId,
            school_year_id: schoolYearId,
            status: 'active',
        });
    }

    async findActiveEnrollmentsBySchoolYear(schoolYearId) {
        return Enrollment.find({ school_year_id: schoolYearId, status: 'active' });
    }

    async findEnrollmentByStudentAndYear(studentId, schoolYearId) {
        return Enrollment.findOne({ student_id: studentId, school_year_id: schoolYearId, status: 'active' });
    }

    async findStudentsByIds(studentIds) {
        const ids = studentIds.map((id) => new mongoose.Types.ObjectId(id));

        return Student.find({ _id: { $in: ids } })
            .populate({
                path: 'user_id',
                populate: { path: 'person_id' },
            });
    }

    async findPeriodResultsByPeriodIds(periodIds) {
        return PeriodAreaResult.find({ period_id: { $in: periodIds } })
            .populate('period_id')
            .populate('area_id');
    }

    async findPeriodResultsByPeriodAndStudents(periodId, studentIds) {
        return PeriodAreaResult.find({
            period_id: periodId,
            student_id: { $in: studentIds },
        }).populate('period_id').populate('area_id');
    }
}

export default new AnalyticsRepository();
