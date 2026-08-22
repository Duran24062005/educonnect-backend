import { asyncHandler } from '../utils/error.js';
import ImportService from '../services/ImportService.js';

class ImportController {
    preview = asyncHandler(async (req, res) => {
        const result = await ImportService.preview({
            userId: req.userId,
            role: req.userRole,
            institutionId: req.institutionId,
            entity: req.body.entity,
            file: req.file,
        });
        res.status(201).json({ status: 'success', data: result });
    });

    list = asyncHandler(async (req, res) => {
        const result = await ImportService.list(req.userId, Number(req.query.limit || 20));
        res.status(200).json({ status: 'success', data: result, jobs: result });
    });

    get = asyncHandler(async (req, res) => {
        const result = await ImportService.get(req.userId, req.params.id);
        res.status(200).json({ status: 'success', data: result });
    });

    confirm = asyncHandler(async (req, res) => {
        const result = await ImportService.confirm({
            userId: req.userId,
            role: req.userRole,
            institutionId: req.institutionId,
            jobId: req.params.id,
        });
        res.status(200).json({ status: 'success', data: result });
    });
}

export default new ImportController();
