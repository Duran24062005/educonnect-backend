import { Router } from 'express';
import AcademicController from '../controllers/AcademicController.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

// ---- School Years ----
router.get('/school-years', AcademicController.getAllSchoolYears);
router.get('/school-years/active', AcademicController.getActiveSchoolYear);
router.post('/school-years', authorize('Admin'), AcademicController.createSchoolYear);
router.patch('/school-years/:id/activate', authorize('Admin'), AcademicController.setActiveSchoolYear);
router.delete('/school-years/:id', authorize('Admin'), AcademicController.deleteSchoolYear);

// ---- Periods ----
router.get('/school-years/:school_year_id/periods', AcademicController.getPeriodsBySchoolYear);
router.post('/periods', authorize('Admin'), AcademicController.createPeriod);
router.delete('/periods/:id', authorize('Admin'), AcademicController.deletePeriod);

// ---- Grades ----
router.get('/grades', AcademicController.getAllGrades);
router.post('/grades', authorize('Admin'), AcademicController.createGrade);
router.put('/grades/:id', authorize('Admin'), AcademicController.updateGrade);
router.delete('/grades/:id', authorize('Admin'), AcademicController.deleteGrade);

// ---- Areas ----
router.get('/areas', AcademicController.getAllAreas);
router.post('/areas', authorize('Admin'), AcademicController.createArea);
router.put('/areas/:id', authorize('Admin'), AcademicController.updateArea);
router.delete('/areas/:id', authorize('Admin'), AcademicController.deleteArea);

// ---- Aulas ----
router.get('/aulas', AcademicController.getAllAulas);
router.post('/aulas', authorize('Admin'), AcademicController.createAula);
router.put('/aulas/:id', authorize('Admin'), AcademicController.updateAula);
router.delete('/aulas/:id', authorize('Admin'), AcademicController.deleteAula);

export default router;