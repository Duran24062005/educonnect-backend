import Group from '../models/GroupModel.js';
import Teacher from '../models/TeacherModel.js';
import Student from '../models/StudentModel.js';
import GroupTeacher from '../models/GroupTeacherModel.js';
import GradeArea from '../models/GradeAreaModel.js';

// ==================== GroupRepository ====================
class GroupRepository {
    async create(data) { return await new Group(data).save(); }
    async findById(id) {
        return await Group.findById(id).populate('grade_id').populate('school_year_id');
    }
    async findBySchoolYear(school_year_id) {
        return await Group.find({ school_year_id }).populate('grade_id').sort({ name: 1 });
    }
    async findByGradeAndYear(grade_id, school_year_id) {
        return await Group.find({ grade_id, school_year_id });
    }
    async update(id, data) { return await Group.findByIdAndUpdate(id, data, { new: true, runValidators: true }); }
    async delete(id) { return await Group.findByIdAndDelete(id); }
}

// ==================== TeacherRepository ====================
class TeacherRepository {
    async create(data) { return await new Teacher(data).save(); }
    async findById(id) { return await Teacher.findById(id).populate('user_id'); }
    async findByUserId(user_id) { return await Teacher.findOne({ user_id }); }
    async findAll(filters = {}) { return await Teacher.find(filters).populate('user_id'); }
    async update(id, data) { return await Teacher.findByIdAndUpdate(id, data, { new: true, runValidators: true }); }
    async delete(id) { return await Teacher.findByIdAndDelete(id); }
}

// ==================== StudentRepository ====================
class StudentRepository {
    async create(data) { return await new Student(data).save(); }
    async findById(id) {
        return await Student.findById(id).populate('user_id').populate('aula_id').populate('group_id');
    }
    async findByUserId(user_id) { return await Student.findOne({ user_id }); }
    async findByGroup(group_id) { return await Student.find({ group_id }).populate('user_id'); }
    async countByAula(aula_id) { return await Student.countDocuments({ aula_id }); }
    async findAll() { return await Student.find().populate('user_id'); }
    async update(id, data) { return await Student.findByIdAndUpdate(id, data, { new: true, runValidators: true }); }
    async delete(id) { return await Student.findByIdAndDelete(id); }
}

// ==================== GroupTeacherRepository ====================
class GroupTeacherRepository {
    async create(data) { return await new GroupTeacher(data).save(); }
    async findByGroup(group_id) {
        return await GroupTeacher.find({ group_id })
            .populate({
                path: 'teacher_id',
                populate: {
                    path: 'user_id',
                    populate: {
                        path: 'person_id',
                    },
                },
            })
            .populate('area_id');
    }
    async findByTeacher(teacher_id) {
        return await GroupTeacher.find({ teacher_id })
            .populate('group_id')
            .populate('area_id');
    }
    async exists(teacher_id, group_id, area_id) {
        return !!(await GroupTeacher.findOne({ teacher_id, group_id, area_id }));
    }
    async delete(id) { return await GroupTeacher.findByIdAndDelete(id); }
    async deleteByGroup(group_id) { return await GroupTeacher.deleteMany({ group_id }); }
}

// ==================== GradeAreaRepository ====================
class GradeAreaRepository {
    async create(data) { return await new GradeArea(data).save(); }
    async findByGrade(grade_id) {
        return await GradeArea.find({ grade_id }).populate('area_id');
    }
    async findByArea(area_id) {
        return await GradeArea.find({ area_id }).populate('grade_id');
    }
    async exists(grade_id, area_id) {
        return !!(await GradeArea.findOne({ grade_id, area_id }));
    }
    async update(id, data) { return await GradeArea.findByIdAndUpdate(id, data, { new: true }); }
    async delete(id) { return await GradeArea.findByIdAndDelete(id); }
}

export const groupRepository = new GroupRepository();
export const teacherRepository = new TeacherRepository();
export const studentRepository = new StudentRepository();
export const groupTeacherRepository = new GroupTeacherRepository();
export const gradeAreaRepository = new GradeAreaRepository();
