import { Router } from 'express';
import StudentController from '../controllers/StudentController.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

router.patch('/:id/aula', authorize('admin'), StudentController.assignAula);

export default router;
