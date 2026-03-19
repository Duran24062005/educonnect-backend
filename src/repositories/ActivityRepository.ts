// @ts-nocheck
import Activity from '../models/ActivityModel.js';
import ActivitySubmission from '../models/ActivitySubmissionModel.js';

const activityPopulate = [
    {
        path: 'group_id',
        populate: [{ path: 'grade_id' }, { path: 'school_year_id' }],
    },
    { path: 'area_id' },
    { path: 'period_id' },
    { path: 'school_year_id' },
    {
        path: 'teacher_id',
        populate: {
            path: 'user_id',
            populate: {
                path: 'person_id',
            },
        },
    },
];

const submissionPopulate = [
    {
        path: 'student_id',
        populate: {
            path: 'user_id',
            populate: {
                path: 'person_id',
            },
        },
    },
    { path: 'activity_id' },
];

class ActivityRepository {
    async create(data) {
        return await new Activity(data).save();
    }

    async findById(id) {
        return await Activity.findById(id).populate(activityPopulate);
    }

    async findByTeacher(teacher_id, filters = {}) {
        return await Activity.find({ teacher_id, ...filters })
            .populate(activityPopulate)
            .sort({ due_at: 1, created_at: -1 });
    }

    async findByStudentScope(group_id, school_year_id, filters = {}) {
        return await Activity.find({ group_id, school_year_id, ...filters })
            .populate(activityPopulate)
            .sort({ due_at: 1, created_at: -1 });
    }

    async update(id, data) {
        await Activity.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        return await this.findById(id);
    }

    async hasSubmissions(activity_id) {
        return !!(await ActivitySubmission.findOne({ activity_id }).select('_id'));
    }
}

class ActivitySubmissionRepository {
    async create(data) {
        return await new ActivitySubmission(data).save();
    }

    async findById(id) {
        return await ActivitySubmission.findById(id).populate(submissionPopulate);
    }

    async findByActivityAndStudent(activity_id, student_id) {
        return await ActivitySubmission.findOne({ activity_id, student_id }).populate(submissionPopulate);
    }

    async findByActivity(activity_id) {
        return await ActivitySubmission.find({ activity_id })
            .populate(submissionPopulate)
            .sort({ submitted_at: -1 });
    }

    async findByActivityIds(activityIds) {
        return await ActivitySubmission.find({ activity_id: { $in: activityIds } }).select('activity_id student_id status');
    }

    async findByStudentAndActivityIds(student_id, activityIds) {
        return await ActivitySubmission.find({ student_id, activity_id: { $in: activityIds } });
    }

    async update(id, data) {
        await ActivitySubmission.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        return await this.findById(id);
    }
}

export const activityRepository = new ActivityRepository();
export const activitySubmissionRepository = new ActivitySubmissionRepository();
