import { Router } from 'express';
import GuardianController from '../controllers/GuardianController.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { requireInstitutionContext } from '../middlewares/tenant.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { guardianAttendanceQuerySchema, guardianBulletinQuerySchema, schoolYearQuerySchema } from '../validators/guardians.validators.js';

const router = Router();

router.use(protect);
router.use(requireInstitutionContext);
router.use(authorize('parent'));

router.get('/me/students', GuardianController.getMyStudents);
router.get('/me/dashboard', validateRequest(schoolYearQuerySchema), GuardianController.getDashboard);
router.get('/me/attendance', validateRequest(guardianAttendanceQuerySchema), GuardianController.getAttendance);
router.get('/me/bulletin', validateRequest(guardianBulletinQuerySchema), GuardianController.getBulletin);

export default router;
