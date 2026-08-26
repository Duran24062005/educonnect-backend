import { Router } from 'express';
import AcademicController from './AcademicController.js';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { requireInstitutionContext } from '../../middlewares/tenant.middleware.js';
import {
    createSchoolYearSchema,
    schoolYearIdSchema,
    resourceIdSchema,
    promoteStudentsSchema,
    periodsBySchoolYearSchema,
    createPeriodSchema,
    periodStatusSchema,
    createGradeSchema,
    updateGradeSchema,
    createAreaSchema,
    updateAreaSchema,
    createAulaSchema,
    updateAulaSchema,
} from './academic.validators.js';

const router = Router();

router.use(protect);
router.use(requireInstitutionContext);

router.get('/school-years', AcademicController.getAllSchoolYears);
router.get('/school-years/active', AcademicController.getActiveSchoolYear);
router.post('/school-years', authorize('admin'), validateRequest(createSchoolYearSchema), AcademicController.createSchoolYear);
router.patch('/school-years/:id/activate', authorize('admin'), validateRequest(schoolYearIdSchema), AcademicController.setActiveSchoolYear);
router.delete('/school-years/:id', authorize('admin'), validateRequest(schoolYearIdSchema), AcademicController.deleteSchoolYear);
router.post('/promotions', authorize('admin'), validateRequest(promoteStudentsSchema), AcademicController.promoteStudents);

router.get('/school-years/:school_year_id/periods', validateRequest(periodsBySchoolYearSchema), AcademicController.getPeriodsBySchoolYear);
router.post('/periods', authorize('admin'), validateRequest(createPeriodSchema), AcademicController.createPeriod);
router.delete('/periods/:id', authorize('admin'), validateRequest(resourceIdSchema), AcademicController.deletePeriod);
router.patch('/periods/:id/status', authorize('admin'), validateRequest(periodStatusSchema), AcademicController.updatePeriodStatus);

router.get('/grades', AcademicController.getAllGrades);
router.post('/grades', authorize('admin'), validateRequest(createGradeSchema), AcademicController.createGrade);
router.put('/grades/:id', authorize('admin'), validateRequest(updateGradeSchema), AcademicController.updateGrade);
router.delete('/grades/:id', authorize('admin'), validateRequest(resourceIdSchema), AcademicController.deleteGrade);

router.get('/areas', AcademicController.getAllAreas);
router.post('/areas', authorize('admin'), validateRequest(createAreaSchema), AcademicController.createArea);
router.put('/areas/:id', authorize('admin'), validateRequest(updateAreaSchema), AcademicController.updateArea);
router.delete('/areas/:id', authorize('admin'), validateRequest(resourceIdSchema), AcademicController.deleteArea);

router.get('/aulas', AcademicController.getAllAulas);
router.post('/aulas', authorize('admin'), validateRequest(createAulaSchema), AcademicController.createAula);
router.put('/aulas/:id', authorize('admin'), validateRequest(updateAulaSchema), AcademicController.updateAula);
router.delete('/aulas/:id', authorize('admin'), validateRequest(resourceIdSchema), AcademicController.deleteAula);

export default router;
