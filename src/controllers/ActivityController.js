import { asyncHandler } from '../utils/error.js';
import ActivityService from '../services/ActivityService.js';

class ActivityController {
    createTeacherActivity = asyncHandler(async (req, res) => {
        const result = await ActivityService.createTeacherActivity(req.userId, req.body);
        res.status(201).json({ status: 'success', data: result });
    });

    getTeacherActivities = asyncHandler(async (req, res) => {
        const result = await ActivityService.getTeacherActivities(req.userId, req.query);
        res.status(200).json({ status: 'success', data: result });
    });

    getTeacherActivity = asyncHandler(async (req, res) => {
        const result = await ActivityService.getTeacherActivity(req.userId, req.params.activity_id);
        res.status(200).json({ status: 'success', data: result });
    });

    updateTeacherActivity = asyncHandler(async (req, res) => {
        const result = await ActivityService.updateTeacherActivity(req.userId, req.params.activity_id, req.body);
        res.status(200).json({ status: 'success', data: result });
    });

    getTeacherActivitySubmissions = asyncHandler(async (req, res) => {
        const result = await ActivityService.getTeacherActivitySubmissions(req.userId, req.params.activity_id);
        res.status(200).json({ status: 'success', data: result });
    });

    reviewTeacherActivitySubmission = asyncHandler(async (req, res) => {
        const result = await ActivityService.reviewTeacherActivitySubmission(
            req.userId,
            req.params.activity_id,
            req.params.student_id,
            req.body
        );
        res.status(200).json({ status: 'success', data: result });
    });

    getStudentActivities = asyncHandler(async (req, res) => {
        const result = await ActivityService.getStudentActivities(req.userId, req.query);
        res.status(200).json({ status: 'success', data: result });
    });

    getStudentActivity = asyncHandler(async (req, res) => {
        const result = await ActivityService.getStudentActivity(req.userId, req.params.activity_id);
        res.status(200).json({ status: 'success', data: result });
    });

    submitStudentActivity = asyncHandler(async (req, res) => {
        const result = await ActivityService.submitStudentActivity(
            req.userId,
            req.params.activity_id,
            req.file,
            req.body?.link_url
        );
        res.status(200).json({ status: 'success', data: result });
    });
}

export default new ActivityController();
