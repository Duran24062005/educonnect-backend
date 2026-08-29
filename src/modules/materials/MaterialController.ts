import type { Request } from 'express';
import { asyncHandler } from '../../utils/error.js';
import MaterialService from './MaterialService.js';

const requestContext = (req: Request) => ({ ipAddress: req.ip, userAgent: req.get('user-agent') });

class MaterialController {
    getTeacherMaterials = asyncHandler(async (req, res) => {
        res.status(200).json({ status: 'success', data: await MaterialService.getTeacherMaterials(req.userId, req.query) });
    });
    getTeacherSessions = asyncHandler(async (req, res) => {
        res.status(200).json({ status: 'success', data: await MaterialService.getTeacherSessions(req.userId, req.query) });
    });
    createTeacherMaterial = asyncHandler(async (req, res) => {
        res.status(201).json({ status: 'success', data: await MaterialService.createTeacherMaterial(req.userId, req.body, req.file, req.institutionId, requestContext(req)) });
    });
    updateTeacherMaterial = asyncHandler(async (req, res) => {
        res.status(200).json({ status: 'success', data: await MaterialService.updateTeacherMaterial(req.userId, req.params.material_id, req.body, req.file, req.institutionId, requestContext(req)) });
    });
    deleteTeacherMaterial = asyncHandler(async (req, res) => {
        await MaterialService.deleteTeacherMaterial(req.userId, req.params.material_id);
        res.status(200).json({ status: 'success', message: 'Material eliminado' });
    });
    getStudentMaterials = asyncHandler(async (req, res) => {
        res.status(200).json({ status: 'success', data: await MaterialService.getStudentMaterials(req.userId, req.query) });
    });
    getStudentMaterial = asyncHandler(async (req, res) => {
        res.status(200).json({ status: 'success', data: await MaterialService.getStudentMaterial(req.userId, req.params.material_id) });
    });
}

export default new MaterialController();
