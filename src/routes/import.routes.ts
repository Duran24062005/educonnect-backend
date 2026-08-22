import { Router } from 'express';
import ImportController from '../controllers/ImportController.js';
import { authorize, protect } from '../middlewares/auth.middleware.js';
import { uploadImportFile } from '../middlewares/import-upload.middleware.js';
import { requireInstitutionContext } from '../middlewares/tenant.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
    importJobParamSchema,
    importListSchema,
    importPreviewSchema,
} from '../validators/import.validators.js';

const router = Router();

router.use(protect);
router.use(requireInstitutionContext);
router.use(authorize('admin'));

router.get('/', validateRequest(importListSchema), ImportController.list);
router.post('/preview', uploadImportFile, validateRequest(importPreviewSchema), ImportController.preview);
router.get('/:id', validateRequest({ params: importJobParamSchema }), ImportController.get);
router.post('/:id/confirm', validateRequest({ params: importJobParamSchema }), ImportController.confirm);

export default router;
