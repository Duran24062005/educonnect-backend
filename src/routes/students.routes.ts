import { Router } from 'express';
import StudentController from '../controllers/StudentController.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { assignAulaSchema } from '../validators/students.validators.js';

const router = Router();

router.use(protect);

router.patch('/:id/aula', authorize('admin'), validateRequest(assignAulaSchema), StudentController.assignAula);

export default router;
