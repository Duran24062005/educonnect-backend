// @ts-nocheck
import TeachingAssignment from '../../models/TeachingAssignmentModel.js';
import SchoolYear from '../../models/SchoolYearModel.js';
import Group from '../../models/GroupModel.js';
import Area from '../../models/AreaModel.js';
import Teacher from '../../models/TeacherModel.js';
import GradeArea from '../../models/GradeAreaModel.js';
import AppError from '../../utils/AppError.js';
import AuditLogService from '../audit/AuditLogService.js';
import { resolveTeacherByUserId } from '../../shared/accessScope.service.js';

const toId = (value) => value?._id?.toString?.() || value?.toString?.() || null;
const teacherName = (teacher) => `${teacher?.user_id?.person_id?.first_name || ''} ${teacher?.user_id?.person_id?.last_name || ''}`.trim() || teacher?.user_id?.email || 'Docente';

const populate = [
    { path: 'school_year_id' },
    { path: 'teacher_id', populate: { path: 'user_id', populate: { path: 'person_id' } } },
    { path: 'group_id', populate: [{ path: 'grade_id' }, { path: 'school_year_id' }, { path: 'campus_id' }, { path: 'shift_id' }] },
    { path: 'area_id' },
];

class TeachingAssignmentService {
    serialize(item) {
        return {
            id: toId(item),
            school_year_id: toId(item.school_year_id || item.group_id?.school_year_id),
            status: item.status || 'active',
            teacher: { id: toId(item.teacher_id), name: teacherName(item.teacher_id) },
            group: { id: toId(item.group_id), name: item.group_id?.name || 'Grupo' },
            area: { id: toId(item.area_id), name: item.area_id?.name || 'Materia' },
            created_at: item.created_at,
            updated_at: item.updated_at,
        };
    }

    async validateReferences(data) {
        const [schoolYear, group, area, teacher] = await Promise.all([
            SchoolYear.findById(data.school_year_id),
            Group.findById(data.group_id).populate('school_year_id'),
            Area.findById(data.area_id),
            Teacher.findById(data.teacher_id),
        ]);
        if (!schoolYear) throw new AppError('Año escolar no encontrado', 404);
        if (!group) throw new AppError('Grupo no encontrado', 404);
        if (!area) throw new AppError('Área no encontrada', 404);
        if (!teacher) throw new AppError('Docente no encontrado', 404);
        if (toId(group.school_year_id) !== toId(schoolYear)) throw new AppError('El grupo no pertenece al año escolar enviado', 400);
        if (!(await GradeArea.exists({ grade_id: group.grade_id, area_id: area._id }))) {
            throw new AppError('El área no está configurada para el grado del grupo', 400);
        }
        return { schoolYear, group, area, teacher };
    }

    async list(userId, role, query = {}) {
        const filter = {};
        if (query.school_year_id) filter.school_year_id = query.school_year_id;
        if (query.group_id) filter.group_id = query.group_id;
        if (query.area_id) filter.area_id = query.area_id;
        if (query.status) filter.status = query.status;
        if (String(role).toLowerCase() === 'teacher') {
            const teacher = await resolveTeacherByUserId(userId);
            filter.teacher_id = teacher._id;
        } else if (query.teacher_id) {
            filter.teacher_id = query.teacher_id;
        }
        const items = await TeachingAssignment.find(filter).populate(populate).sort({ created_at: -1 });
        return { assignments: items.map((item) => this.serialize(item)) };
    }

    async get(id, userId, role) {
        const item = await TeachingAssignment.findById(id).populate(populate);
        if (!item) throw new AppError('Asignación docente no encontrada', 404);
        if (String(role).toLowerCase() === 'teacher') {
            const teacher = await resolveTeacherByUserId(userId);
            if (toId(item.teacher_id) !== toId(teacher)) throw new AppError('No tienes permiso para ver esta asignación', 403);
        }
        return this.serialize(item);
    }

    async create(userId, institutionId, data, requestContext = {}) {
        const refs = await this.validateReferences(data);
        const existing = await TeachingAssignment.findOne({ teacher_id: refs.teacher._id, group_id: refs.group._id, area_id: refs.area._id });
        if (existing) {
            if (existing.status === 'inactive') {
                existing.status = 'active';
                existing.school_year_id = refs.schoolYear._id;
                existing.updated_by = userId;
                await existing.save();
                return this.serialize(await TeachingAssignment.findById(existing._id).populate(populate));
            }
            throw new AppError('Este docente ya está asignado a este grupo y área', 409);
        }
        const item = await TeachingAssignment.create({ ...data, school_year_id: refs.schoolYear._id, status: 'active' });
        await AuditLogService.record({ actorUserId: userId, actorRole: 'admin', action: 'teaching_assignment.created', entityType: 'TeachingAssignment', entityId: item._id, before: null, after: item, institutionId, ...requestContext });
        return this.serialize(await TeachingAssignment.findById(item._id).populate(populate));
    }

    async update(userId, institutionId, id, data, requestContext = {}) {
        const item = await TeachingAssignment.findById(id);
        if (!item) throw new AppError('Asignación docente no encontrada', 404);
        const before = item.toObject();
        item.status = data.status;
        item.updated_by = userId;
        await item.save();
        await AuditLogService.record({ actorUserId: userId, actorRole: 'admin', action: `teaching_assignment.${data.status}`, entityType: 'TeachingAssignment', entityId: item._id, before, after: item, institutionId, ...requestContext });
        return this.serialize(await TeachingAssignment.findById(item._id).populate(populate));
    }
}

export default new TeachingAssignmentService();
