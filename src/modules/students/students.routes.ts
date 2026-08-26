import { Router } from 'express';
import StudentController from './StudentController.js';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { requireInstitutionContext } from '../../middlewares/tenant.middleware.js';
import { assignAulaSchema, replaceGuardiansSchema } from './students.validators.js';

const router = Router();

router.use(protect);
router.use(requireInstitutionContext);

router.patch('/:id/aula', authorize('admin'), validateRequest(assignAulaSchema), StudentController.assignAula);
router.patch('/:id/guardians', authorize('admin'), validateRequest(replaceGuardiansSchema), StudentController.replaceGuardians);

export default router;
