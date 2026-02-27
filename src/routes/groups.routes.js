import { Router } from 'express';
import GroupController from '../controllers/GroupController.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

// ---- Grupos ----
router.get('/school-year/:school_year_id', GroupController.getGroupsBySchoolYear);
router.get('/:id', GroupController.getGroupById);
router.post('/', authorize('Admin'), GroupController.createGroup);
router.put('/:id', authorize('Admin'), GroupController.updateGroup);
router.delete('/:id', authorize('Admin'), GroupController.deleteGroup);

// ---- Inscripciones ----
router.post('/enrollments', authorize('Admin'), GroupController.enrollStudent);
router.patch('/enrollments/:id/status', authorize('Admin'), GroupController.changeEnrollmentStatus);
router.get('/:group_id/students', GroupController.getStudentsByGroup);
router.get('/enrollments/student/:student_id', GroupController.getEnrollmentsByStudent);

// ---- Profesores ----
router.post('/teachers/assign', authorize('Admin'), GroupController.assignTeacher);
router.get('/:group_id/teachers', GroupController.getTeachersByGroup);
router.get('/teachers/:teacher_id/groups', GroupController.getGroupsByTeacher);

// ---- Grade Areas ----
router.post('/grade-areas', authorize('Admin'), GroupController.assignAreaToGrade);
router.get('/grade-areas/:grade_id', GroupController.getAreasByGrade);

export default router;