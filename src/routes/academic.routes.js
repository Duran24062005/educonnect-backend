import { Router } from 'express';
import AcademicController from '../controllers/AcademicController.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

// ---- School Years ----
router.get('/school-years', AcademicController.getAllSchoolYears);
router.get('/school-years/active', AcademicController.getActiveSchoolYear);
router.post('/school-years', authorize('admin'), AcademicController.createSchoolYear);
router.patch('/school-years/:id/activate', authorize('admin'), AcademicController.setActiveSchoolYear);
router.delete('/school-years/:id', authorize('admin'), AcademicController.deleteSchoolYear);

// ---- Periods ----
router.get('/school-years/:school_year_id/periods', AcademicController.getPeriodsBySchoolYear);
router.post('/periods', authorize('admin'), AcademicController.createPeriod);
router.delete('/periods/:id', authorize('admin'), AcademicController.deletePeriod);

// ---- Grades ----
router.get('/grades', AcademicController.getAllGrades);
router.post('/grades', authorize('admin'), AcademicController.createGrade);
router.put('/grades/:id', authorize('admin'), AcademicController.updateGrade);
router.delete('/grades/:id', authorize('admin'), AcademicController.deleteGrade);

// ---- Areas ----
router.get('/areas', AcademicController.getAllAreas);
router.post('/areas', authorize('admin'), AcademicController.createArea);
router.put('/areas/:id', authorize('admin'), AcademicController.updateArea);
router.delete('/areas/:id', authorize('admin'), AcademicController.deleteArea);

// ---- Aulas ----
router.get('/aulas', AcademicController.getAllAulas);
router.post('/aulas', authorize('admin'), AcademicController.createAula);
router.put('/aulas/:id', authorize('admin'), AcademicController.updateAula);
router.delete('/aulas/:id', authorize('admin'), AcademicController.deleteAula);

export default router;
