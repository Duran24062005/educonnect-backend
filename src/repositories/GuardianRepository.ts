// @ts-nocheck
import Student from '../models/StudentModel.js';
import StudentGuardian from '../models/StudentGuardianModel.js';

const studentPopulate = [
    {
        path: 'student_id',
        populate: [
            {
                path: 'user_id',
                populate: { path: 'person_id' },
            },
            {
                path: 'group_id',
                populate: [{ path: 'grade_id' }, { path: 'school_year_id' }],
            },
            { path: 'aula_id' },
        ],
    },
];

class GuardianRepository {
    async findAuthorizedStudentsByGuardianId(guardianId) {
        return StudentGuardian.find({ guardian_id: guardianId, is_authorized: true })
            .populate(studentPopulate)
            .sort({ created_at: 1 });
    }

    async findAuthorizedLink(guardianId, studentId) {
        return StudentGuardian.findOne({
            guardian_id: guardianId,
            student_id: studentId,
            is_authorized: true,
        });
    }

    async findLinksByStudentId(studentId) {
        return StudentGuardian.find({ student_id: studentId })
            .populate({
                path: 'guardian_id',
                populate: { path: 'person_id' },
            })
            .sort({ created_at: 1 });
    }

    async replaceStudentGuardians(studentId, links) {
        await StudentGuardian.deleteMany({ student_id: studentId });
        await Promise.all(links.map((link) => new StudentGuardian(link).save()));
        return this.findLinksByStudentId(studentId);
    }

    async findStudentById(studentId) {
        return Student.findById(studentId)
            .populate({
                path: 'user_id',
                populate: { path: 'person_id' },
            })
            .populate({
                path: 'group_id',
                populate: [{ path: 'grade_id' }, { path: 'school_year_id' }],
            })
            .populate('aula_id');
    }
}

export default new GuardianRepository();
