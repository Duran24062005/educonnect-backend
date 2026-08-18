import { Router } from 'express';
import GroupController from '../controllers/GroupController.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
    createGroupSchema,
    updateGroupSchema,
    groupIdSchema,
    groupDetailSummarySchema,
    groupsBySchoolYearSchema,
    enrollStudentSchema,
    transferEnrollmentSchema,
    enrollmentStatusSchema,
    studentsByGroupSchema,
    enrollmentsByStudentSchema,
    assignTeacherSchema,
    teachersByGroupSchema,
    groupsByTeacherSchema,
    assignAreaToGradeSchema,
    areasByGradeSchema,
} from '../validators/groups.validators.js';

const router = Router();

router.use(protect);

router.get('/school-year/:school_year_id', authorize('admin'), validateRequest(groupsBySchoolYearSchema), GroupController.getGroupsBySchoolYear);
router.post('/enrollments', authorize('admin'), validateRequest(enrollStudentSchema), GroupController.enrollStudent);
router.post('/enrollments/transfer', authorize('admin'), validateRequest(transferEnrollmentSchema), GroupController.transferEnrollment);
router.patch('/enrollments/:id/status', authorize('admin'), validateRequest(enrollmentStatusSchema), GroupController.changeEnrollmentStatus);
router.get('/enrollments/student/:student_id', validateRequest(enrollmentsByStudentSchema), GroupController.getEnrollmentsByStudent);

router.post('/teachers/assign', authorize('admin'), validateRequest(assignTeacherSchema), GroupController.assignTeacher);
router.get('/teachers/:teacher_id/groups', validateRequest(groupsByTeacherSchema), GroupController.getGroupsByTeacher);

router.post('/grade-areas', authorize('admin'), validateRequest(assignAreaToGradeSchema), GroupController.assignAreaToGrade);
router.get('/grade-areas/:grade_id', authorize('admin'), validateRequest(areasByGradeSchema), GroupController.getAreasByGrade);

router.post('/', authorize('admin'), validateRequest(createGroupSchema), GroupController.createGroup);
router.get('/:group_id/detail-summary', authorize('admin'), validateRequest(groupDetailSummarySchema), GroupController.getGroupDetailSummary);
router.get('/:group_id/students', validateRequest(studentsByGroupSchema), GroupController.getStudentsByGroup);
router.get('/:group_id/teachers', validateRequest(teachersByGroupSchema), GroupController.getTeachersByGroup);
router.get('/:id', validateRequest(groupIdSchema), GroupController.getGroupById);
router.put('/:id', authorize('admin'), validateRequest(updateGroupSchema), GroupController.updateGroup);
router.delete('/:id', authorize('admin'), validateRequest(groupIdSchema), GroupController.deleteGroup);

export default router;
