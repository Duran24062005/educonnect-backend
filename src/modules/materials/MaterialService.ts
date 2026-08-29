// @ts-nocheck
import ClassSession from '../../models/ClassSessionModel.js';
import Enrollment from '../../models/EnrollmentModel.js';
import GroupTeacher from '../../models/GroupTeacherModel.js';
import Student from '../../models/StudentModel.js';
import Teacher from '../../models/TeacherModel.js';
import AppError from '../../utils/AppError.js';
import { getStorageService } from '../../shared/storage/index.js';
import MediaUrlService from '../../shared/storage/mediaUrl.service.js';
import materialRepository from '../../repositories/MaterialRepository.js';
import { calendarService } from '../calendar/index.js';

const toIdString = (value) => value?._id?.toString?.() || value?.toString?.() || null;
const normalizeOptionalText = (value) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed || null;
};
const normalizeLinkUrl = (value) => {
    const trimmed = normalizeOptionalText(value);
    if (!trimmed) return null;
    try {
        const parsed = new URL(trimmed);
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('protocol');
        return parsed.toString();
    } catch {
        throw new AppError('El link debe ser una URL válida con http o https', 400);
    }
};
const personName = (person) => `${person?.first_name || ''} ${person?.last_name || ''}`.trim() || 'Sin nombre';
const entity = (value, fallback) => ({ _id: toIdString(value), name: value?.name || fallback });

const sessionPopulate = [
    { path: 'school_year_id' },
    { path: 'group_id', populate: [{ path: 'grade_id' }, { path: 'school_year_id' }] },
    { path: 'area_id' },
    { path: 'teacher_id', populate: { path: 'user_id', populate: { path: 'person_id' } } },
    { path: 'aula_id' },
];

const serializeSession = (session) => {
    const group = session?.group_id;
    const schoolYear = session?.school_year_id || group?.school_year_id;
    return {
        _id: toIdString(session),
        start_at: session?.start_at,
        end_at: session?.end_at,
        status: session?.status,
        topic: session?.topic || '',
        school_year: { _id: toIdString(schoolYear), year: schoolYear?.year || null },
        grade: entity(group?.grade_id, 'Grado'),
        group: entity(group, 'Grupo'),
        area: entity(session?.area_id, 'Materia'),
        teacher: { _id: toIdString(session?.teacher_id), name: personName(session?.teacher_id?.user_id?.person_id) },
        aula: entity(session?.aula_id, 'Aula'),
    };
};

const serializeMaterial = (material) => ({
    _id: toIdString(material),
    title: material.title,
    description: material.description,
    material_type: material.material_type,
    link_url: material.link_url,
    file_url: material.file_url,
    original_name: material.original_name,
    mime_type: material.mime_type,
    size_bytes: Number(material.size_bytes || 0),
    session: serializeSession(material.session_id),
    teacher: material.teacher_id ? {
        _id: toIdString(material.teacher_id),
        name: personName(material.teacher_id.user_id?.person_id),
    } : null,
    created_at: material.created_at,
    updated_at: material.updated_at,
});

class MaterialService {
    async getTeacherProfile(userId) {
        const teacher = await Teacher.findOne({ user_id: userId });
        if (!teacher) throw new AppError('Perfil de docente no encontrado', 404);
        return teacher;
    }

    async getStudentProfile(userId) {
        const student = await Student.findOne({ user_id: userId });
        if (!student) throw new AppError('Perfil de estudiante no encontrado', 404);
        return student;
    }

    async getActiveEnrollment(studentId) {
        const enrollment = await Enrollment.findOne({ student_id: studentId, status: 'active' }).sort({ created_at: -1 });
        if (!enrollment) throw new AppError('El estudiante no tiene una matrícula activa', 404);
        return enrollment;
    }

    async loadSession(sessionId) {
        return await ClassSession.findById(sessionId).populate(sessionPopulate);
    }

    async assertTeacherSession(userId, sessionId) {
        const teacher = await this.getTeacherProfile(userId);
        const session = await this.loadSession(sessionId);
        if (!session) throw new AppError('Sesión no encontrada', 404);
        if (toIdString(session.teacher_id) !== toIdString(teacher._id)) throw new AppError('No tienes permiso sobre esta sesión', 403);

        const assignment = await GroupTeacher.findOne({
            teacher_id: teacher._id,
            group_id: session.group_id?._id || session.group_id,
            area_id: session.area_id?._id || session.area_id,
        });
        if (!assignment) throw new AppError('El docente no tiene asignación para esta sesión', 403);
        return { teacher, session };
    }

    async assertTeacherMaterial(userId, materialId) {
        const teacher = await this.getTeacherProfile(userId);
        const material = await materialRepository.findById(materialId);
        if (!material) throw new AppError('Material no encontrado', 404);
        if (toIdString(material.teacher_id) !== toIdString(teacher._id)) throw new AppError('No tienes permiso sobre este material', 403);
        return { teacher, material };
    }

    async updateSessionTopic(userId, institutionId, sessionId, topic, requestContext) {
        if (topic === undefined || topic === null) return;
        const normalized = normalizeOptionalText(topic);
        if (!normalized) throw new AppError('El tema de la sesión es requerido', 400);
        await calendarService.update(userId, 'teacher', institutionId, sessionId, { topic: normalized }, requestContext);
    }

    async prepareResource(file, linkUrl, { allowEmpty = false } = {}) {
        const hasFile = Boolean(file);
        const normalizedLink = normalizeLinkUrl(linkUrl);
        const hasLink = Boolean(normalizedLink);
        if (hasFile && hasLink) throw new AppError('Usa un archivo o un link, no ambos', 400);
        if (!allowEmpty && !hasFile && !hasLink) throw new AppError('Debes adjuntar un archivo o registrar un link', 400);
        return { file, linkUrl: normalizedLink, hasFile, hasLink };
    }

    async createTeacherMaterial(userId, data, file, institutionId, requestContext) {
        const { teacher } = await this.assertTeacherSession(userId, data.session_id);
        const resource = await this.prepareResource(file, data.link_url);
        await this.updateSessionTopic(userId, institutionId, data.session_id, data.topic, requestContext);
        let uploaded = null;

        try {
            if (resource.hasFile) {
                uploaded = await getStorageService().uploadMaterial({
                    sessionId: data.session_id,
                    buffer: file.buffer,
                    mimeType: file.mimetype || 'application/octet-stream',
                    originalName: file.originalname,
                });
            }
            const material = await materialRepository.create({
                title: data.title.trim(),
                description: normalizeOptionalText(data.description),
                session_id: data.session_id,
                teacher_id: teacher._id,
                material_type: resource.hasFile ? 'file' : 'link',
                link_url: resource.hasLink ? resource.linkUrl : null,
                file_url: uploaded?.signedUrl || null,
                original_name: resource.hasFile ? file.originalname : null,
                mime_type: resource.hasFile ? (file.mimetype || 'application/octet-stream') : null,
                size_bytes: resource.hasFile ? file.size : 0,
                storage_provider: uploaded?.provider || null,
                storage_bucket: uploaded?.bucket || null,
                storage_key: uploaded?.key || null,
                storage_signed_url: uploaded?.signedUrl || null,
                storage_signed_url_expires_at: uploaded?.signedUrlExpiresAt || null,
            });
            const hydrated = await materialRepository.findById(material._id);
            return { material: serializeMaterial(hydrated) };
        } catch (error) {
            if (uploaded) await getStorageService().deleteObject({ bucket: uploaded.bucket, key: uploaded.key }).catch(() => undefined);
            throw error;
        }
    }

    async getTeacherMaterials(userId, filters = {}) {
        const teacher = await this.getTeacherProfile(userId);
        const query = filters.session_id ? { session_id: filters.session_id } : {};
        const materials = await materialRepository.findByTeacher(teacher._id, query);
        const filtered = materials.filter((material) => {
            const session = material.session_id;
            return (!filters.group_id || toIdString(session?.group_id) === filters.group_id)
                && (!filters.area_id || toIdString(session?.area_id) === filters.area_id);
        });
        await MediaUrlService.refreshMaterials(filtered);
        return { materials: filtered.map(serializeMaterial) };
    }

    async getTeacherSessions(userId, filters = {}) {
        const teacher = await this.getTeacherProfile(userId);
        const query = { teacher_id: teacher._id };
        if (filters.school_year_id) query.school_year_id = filters.school_year_id;
        if (filters.group_id) query.group_id = filters.group_id;
        if (filters.area_id) query.area_id = filters.area_id;
        const sessions = await ClassSession.find(query).populate(sessionPopulate).sort({ start_at: -1 });
        return { sessions: sessions.map(serializeSession) };
    }

    async updateTeacherMaterial(userId, materialId, data, file, institutionId, requestContext) {
        const { material } = await this.assertTeacherMaterial(userId, materialId);
        const targetSessionId = data.session_id || toIdString(material.session_id);
        await this.assertTeacherSession(userId, targetSessionId);
        const resource = await this.prepareResource(file, data.link_url, { allowEmpty: true });
        await this.updateSessionTopic(userId, institutionId, targetSessionId, data.topic, requestContext);
        let uploaded = null;

        try {
            if (resource.hasFile) {
                uploaded = await getStorageService().uploadMaterial({
                    sessionId: targetSessionId,
                    buffer: file.buffer,
                    mimeType: file.mimetype || 'application/octet-stream',
                    originalName: file.originalname,
                });
            }
            const payload = {};
            if (data.title !== undefined) payload.title = data.title.trim();
            if (data.description !== undefined) payload.description = normalizeOptionalText(data.description);
            if (data.session_id !== undefined) payload.session_id = data.session_id;

            if (resource.hasFile) Object.assign(payload, {
                material_type: 'file', link_url: null, file_url: uploaded.signedUrl,
                original_name: file.originalname, mime_type: file.mimetype || 'application/octet-stream',
                size_bytes: file.size, storage_provider: uploaded.provider, storage_bucket: uploaded.bucket,
                storage_key: uploaded.key, storage_signed_url: uploaded.signedUrl,
                storage_signed_url_expires_at: uploaded.signedUrlExpiresAt,
            });
            if (resource.hasLink) Object.assign(payload, {
                material_type: 'link', link_url: resource.linkUrl, file_url: null, original_name: null,
                mime_type: null, size_bytes: 0, storage_provider: null, storage_bucket: null,
                storage_key: null, storage_signed_url: null, storage_signed_url_expires_at: null,
            });

            const updated = await materialRepository.update(materialId, payload);
            if ((resource.hasFile || resource.hasLink) && material.storage_bucket && material.storage_key) {
                await getStorageService().deleteObject({ bucket: material.storage_bucket, key: material.storage_key }).catch((error) => {
                    console.error('Failed to delete previous material from S3', error);
                });
            }
            await MediaUrlService.refreshMaterial(updated);
            return { material: serializeMaterial(updated) };
        } catch (error) {
            if (uploaded) await getStorageService().deleteObject({ bucket: uploaded.bucket, key: uploaded.key }).catch(() => undefined);
            throw error;
        }
    }

    async deleteTeacherMaterial(userId, materialId) {
        const { material } = await this.assertTeacherMaterial(userId, materialId);
        await materialRepository.delete(materialId);
        if (material.storage_bucket && material.storage_key) {
            await getStorageService().deleteObject({ bucket: material.storage_bucket, key: material.storage_key }).catch((error) => {
                console.error('Failed to delete material from S3', error);
            });
        }
    }

    async getStudentMaterials(userId, filters = {}) {
        const student = await this.getStudentProfile(userId);
        const enrollment = await this.getActiveEnrollment(student._id);
        const sessions = await ClassSession.find({ group_id: enrollment.group_id, school_year_id: enrollment.school_year_id }).select('_id');
        const sessionIds = sessions.map((item) => item._id);
        if (filters.session_id && !sessionIds.some((id) => toIdString(id) === filters.session_id)) return { materials: [] };
        const query = filters.session_id ? { session_id: filters.session_id } : {};
        const materials = await materialRepository.findByStudentSessions(sessionIds, query);
        const filtered = materials.filter((material) => !filters.area_id || toIdString(material.session_id?.area_id) === filters.area_id);
        await MediaUrlService.refreshMaterials(filtered);
        return { materials: filtered.map(serializeMaterial) };
    }

    async getStudentMaterial(userId, materialId) {
        const { materials } = await this.getStudentMaterials(userId);
        const material = materials.find((item) => item._id === materialId);
        if (!material) throw new AppError('Material no encontrado', 404);
        return { material };
    }
}

export default new MaterialService();
