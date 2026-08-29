import { Router } from 'express';
import MaterialController from './MaterialController.js';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { requireInstitutionContext } from '../../middlewares/tenant.middleware.js';
import { uploadMaterialFile } from '../../middlewares/material-upload.middleware.js';
import { createMaterialSchema, materialParamSchema, materialsQuerySchema, teacherSessionsQuerySchema, updateMaterialSchema } from './materials.validators.js';

const router = Router();
router.use(protect);
router.use(requireInstitutionContext);

router.get('/teacher/me', authorize('teacher'), validateRequest(materialsQuerySchema), MaterialController.getTeacherMaterials);
router.get('/teacher/me/sessions', authorize('teacher'), validateRequest(teacherSessionsQuerySchema), MaterialController.getTeacherSessions);
router.post('/teacher/me', authorize('teacher'), uploadMaterialFile, validateRequest(createMaterialSchema), MaterialController.createTeacherMaterial);
router.put('/teacher/me/:material_id', authorize('teacher'), uploadMaterialFile, validateRequest(updateMaterialSchema), MaterialController.updateTeacherMaterial);
router.delete('/teacher/me/:material_id', authorize('teacher'), validateRequest(materialParamSchema), MaterialController.deleteTeacherMaterial);
router.get('/student/me', authorize('student'), validateRequest(materialsQuerySchema), MaterialController.getStudentMaterials);
router.get('/student/me/:material_id', authorize('student'), validateRequest(materialParamSchema), MaterialController.getStudentMaterial);

export default router;
