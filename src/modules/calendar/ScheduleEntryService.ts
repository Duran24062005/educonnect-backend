// @ts-nocheck
import mongoose from 'mongoose';
import ScheduleEntry from '../../models/ScheduleEntryModel.js';
import WeeklySchedule from '../../models/WeeklyScheduleModel.js';
import TeachingAssignment from '../../models/TeachingAssignmentModel.js';
import Group from '../../models/GroupModel.js';
import GradeArea from '../../models/GradeAreaModel.js';
import Aula from '../../models/AulaModel.js';
import ClassSession from '../../models/ClassSessionModel.js';
import AppError from '../../utils/AppError.js';
import AuditLogService from '../audit/AuditLogService.js';

const id = (value) => value?._id?.toString?.() || value?.toString?.() || null;
const minutes = (value) => { const [hours, mins] = String(value).split(':').map(Number); return hours * 60 + mins; };
const entity = (value, fallback) => ({ id: id(value), name: value?.name || fallback });
const teacherName = (teacher) => `${teacher?.user_id?.person_id?.first_name || ''} ${teacher?.user_id?.person_id?.last_name || ''}`.trim() || teacher?.user_id?.email || 'Docente';

const populate = [
    { path: 'schedule_id' },
    { path: 'teaching_assignment_id', populate: [
        { path: 'school_year_id' },
        { path: 'group_id', populate: [{ path: 'grade_id' }, { path: 'school_year_id' }, { path: 'shift_id' }, { path: 'campus_id' }] },
        { path: 'area_id' },
        { path: 'teacher_id', populate: { path: 'user_id', populate: { path: 'person_id' } } },
    ] },
    { path: 'group_id', populate: [{ path: 'grade_id' }, { path: 'school_year_id' }, { path: 'shift_id' }, { path: 'campus_id' }] },
    { path: 'area_id' },
    { path: 'teacher_id', populate: { path: 'user_id', populate: { path: 'person_id' } } },
    { path: 'aula_id' },
];

const localParts = (value, timeZone) => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value);
    const get = (type) => parts.find((part) => part.type === type)?.value;
    return `${get('year')}-${get('month')}-${get('day')}`;
};

const localDateTime = (dateKey, time, timeZone) => {
    const guess = new Date(`${dateKey}T${time}:00.000Z`);
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(guess);
    const get = (type) => Number(parts.find((part) => part.type === type)?.value);
    const represented = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
    return new Date(guess.getTime() - (represented - guess.getTime()));
};

const dateOnly = (date) => date.toISOString().slice(0, 10);
const addDay = (date) => new Date(date.getTime() + 24 * 60 * 60 * 1000);

class ScheduleEntryService {
    serialize(entry) {
        const assignment = entry.teaching_assignment_id;
        const group = entry.group_id || assignment?.group_id;
        const area = entry.area_id || assignment?.area_id;
        const teacher = entry.teacher_id || assignment?.teacher_id;
        return {
            id: id(entry),
            schedule_id: id(entry.schedule_id),
            teaching_assignment_id: id(assignment),
            entry_key: entry.entry_key,
            weekday: entry.weekday,
            start_time: entry.start_time,
            end_time: entry.end_time,
            status: entry.status,
            group: entity(group, 'Grupo'),
            area: entity(area, 'Materia'),
            teacher: { id: id(teacher), name: teacherName(teacher) },
            aula: entity(entry.aula_id, 'Aula'),
            campus: entity(entry.campus_id, 'Sede'),
        };
    }

    async getSchedule(scheduleId) {
        const schedule = await WeeklySchedule.findById(scheduleId);
        if (!schedule) throw new AppError('Horario no encontrado', 404);
        return schedule;
    }

    async resolve(data, schedule) {
        const assignment = await TeachingAssignment.findById(data.teaching_assignment_id)
            .populate('school_year_id')
            .populate({ path: 'group_id', populate: [{ path: 'grade_id' }, { path: 'school_year_id' }, { path: 'shift_id' }, { path: 'campus_id' }] })
            .populate('area_id')
            .populate({ path: 'teacher_id', populate: { path: 'user_id', populate: { path: 'person_id' } } });
        if (!assignment) throw new AppError('Asignación docente no encontrada', 404);
        if (assignment.status !== 'active') throw new AppError('La asignación docente está inactiva', 409);
        const schoolYearId = id(assignment.school_year_id || assignment.group_id?.school_year_id);
        if (schoolYearId !== id(schedule.school_year_id)) throw new AppError('La asignación no pertenece al año escolar del horario', 400);
        if (!(await GradeArea.exists({ grade_id: assignment.group_id.grade_id, area_id: assignment.area_id._id }))) throw new AppError('El área no está configurada para el grado del grupo', 400);
        if (!schedule.school_days.includes(Number(data.weekday))) throw new AppError('El día no está configurado como lectivo', 409);
        if (minutes(data.end_time) <= minutes(data.start_time)) throw new AppError('La hora final debe ser posterior a la inicial', 400);

        const aula = await Aula.findById(data.aula_id);
        if (!aula) throw new AppError('Aula no encontrada', 404);
        if (assignment.group_id.campus_id && (!aula.campus_id || id(aula.campus_id) !== id(assignment.group_id.campus_id))) throw new AppError('El aula no pertenece a la sede del grupo', 409);

        const window = (schedule.availability_windows || []).find((item) => id(item.group_id) === id(assignment.group_id));
        if (!window) throw new AppError('El grupo no tiene una ventana de disponibilidad publicada', 409);
        if (minutes(data.start_time) < minutes(window.start_time) || minutes(data.end_time) > minutes(window.end_time)) throw new AppError(`La entrada debe estar dentro de la disponibilidad (${window.start_time} - ${window.end_time})`, 409);
        const shift = assignment.group_id.shift_id;
        if (!shift || shift.status !== 'active') throw new AppError('El grupo debe tener una jornada activa configurada', 409);
        if (minutes(data.start_time) < minutes(shift.start_time) || minutes(data.end_time) > minutes(shift.end_time)) throw new AppError(`La entrada debe estar dentro de la jornada ${shift.name}`, 409);
        return { assignment, aula, group: assignment.group_id, campus: assignment.group_id.campus_id || null };
    }

    async assertNoConflict(scheduleId, refs, data, excludeId = null) {
        const entries = await ScheduleEntry.find({ schedule_id: scheduleId, status: 'active', ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
        const resources = [['grupo', refs.group._id], ['docente', refs.assignment.teacher_id], ['aula', refs.aula._id]];
        const conflict = entries.find((entry) => Number(entry.weekday) === Number(data.weekday)
            && minutes(data.start_time) < minutes(entry.end_time)
            && minutes(data.end_time) > minutes(entry.start_time)
            && resources.some(([, resourceId]) => [entry.group_id, entry.teacher_id, entry.aula_id].some((entryResource) => id(entryResource) === id(resourceId))));
        if (conflict) throw new AppError('Existe un conflicto de horario con el grupo, docente o aula seleccionado', 409, { conflict_id: id(conflict), conflict_entry_key: conflict.entry_key });
    }

    async list(scheduleId) {
        await this.getSchedule(scheduleId);
        const entries = await ScheduleEntry.find({ schedule_id: scheduleId, status: 'active' }).populate(populate).sort({ weekday: 1, start_time: 1 });
        return { entries: entries.map((entry) => this.serialize(entry)) };
    }

    async validateScheduleEntries(schedule) {
        const errors = [];
        const entries = await ScheduleEntry.find({ schedule_id: schedule._id, status: 'active' });
        for (const entry of entries) {
            try {
                const data = { teaching_assignment_id: id(entry.teaching_assignment_id), aula_id: id(entry.aula_id), weekday: entry.weekday, start_time: entry.start_time, end_time: entry.end_time };
                const refs = await this.resolve(data, schedule);
                await this.assertNoConflict(schedule._id, refs, data, entry._id);
            } catch (error) {
                errors.push({ entry_id: id(entry), message: error.message || 'Entrada de horario inválida' });
            }
        }
        return errors;
    }

    async create(userId, institutionId, scheduleId, data, context = {}) {
        const schedule = await this.getSchedule(scheduleId);
        if (schedule.status !== 'draft') throw new AppError('Solo se puede editar un borrador', 409);
        const refs = await this.resolve(data, schedule);
        await this.assertNoConflict(scheduleId, refs, data);
        const entry = await ScheduleEntry.create({
            schedule_id: schedule._id,
            teaching_assignment_id: refs.assignment._id,
            school_year_id: schedule.school_year_id,
            group_id: refs.group._id,
            area_id: refs.assignment.area_id._id,
            teacher_id: refs.assignment.teacher_id._id,
            campus_id: refs.campus?._id || null,
            aula_id: refs.aula._id,
            entry_key: data.entry_key || `${data.weekday}-${refs.assignment._id}-${data.start_time}`,
            weekday: data.weekday,
            start_time: data.start_time,
            end_time: data.end_time,
        });
        await AuditLogService.record({ actorUserId: userId, actorRole: 'admin', action: 'schedule_entry.created', entityType: 'ScheduleEntry', entityId: entry._id, before: null, after: entry, institutionId, ...context });
        return this.serialize(await ScheduleEntry.findById(entry._id).populate(populate));
    }

    async update(userId, institutionId, scheduleId, entryId, data, context = {}) {
        const schedule = await this.getSchedule(scheduleId);
        if (schedule.status !== 'draft') throw new AppError('Solo se puede editar un borrador', 409);
        const current = await ScheduleEntry.findOne({ _id: entryId, schedule_id: scheduleId, status: 'active' });
        if (!current) throw new AppError('Entrada de horario no encontrada', 404);
        const next = { teaching_assignment_id: data.teaching_assignment_id || id(current.teaching_assignment_id), aula_id: data.aula_id || id(current.aula_id), weekday: data.weekday ?? current.weekday, start_time: data.start_time || current.start_time, end_time: data.end_time || current.end_time, entry_key: data.entry_key || current.entry_key };
        const refs = await this.resolve(next, schedule);
        await this.assertNoConflict(scheduleId, refs, next, entryId);
        const before = current.toObject();
        Object.assign(current, { ...next, school_year_id: schedule.school_year_id, group_id: refs.group._id, area_id: refs.assignment.area_id._id, teacher_id: refs.assignment.teacher_id._id, campus_id: refs.campus?._id || null, teaching_assignment_id: refs.assignment._id, aula_id: refs.aula._id });
        await current.save();
        await AuditLogService.record({ actorUserId: userId, actorRole: 'admin', action: 'schedule_entry.updated', entityType: 'ScheduleEntry', entityId: current._id, before, after: current, institutionId, ...context });
        return this.serialize(await ScheduleEntry.findById(current._id).populate(populate));
    }

    async archive(userId, institutionId, scheduleId, entryId, context = {}) {
        const schedule = await this.getSchedule(scheduleId);
        if (schedule.status !== 'draft') throw new AppError('Solo se puede editar un borrador', 409);
        const entry = await ScheduleEntry.findOne({ _id: entryId, schedule_id: scheduleId, status: 'active' });
        if (!entry) throw new AppError('Entrada de horario no encontrada', 404);
        entry.status = 'archived';
        await entry.save();
        await AuditLogService.record({ actorUserId: userId, actorRole: 'admin', action: 'schedule_entry.archived', entityType: 'ScheduleEntry', entityId: entry._id, before: { status: 'active' }, after: entry, institutionId, ...context });
        return this.serialize(entry);
    }

    async ensureLegacyEntries(schedule) {
        const slots = schedule.slots || [];
        for (const slot of slots) {
            if (await ScheduleEntry.exists({ schedule_id: schedule._id, legacy_slot_id: slot.slot_id })) continue;
            const assignment = await TeachingAssignment.findOne({ teacher_id: slot.teacher_id, group_id: slot.group_id, area_id: slot.area_id });
            if (!assignment) continue;
            const aula = await Aula.findById(slot.aula_id);
            if (!aula) continue;
            await ScheduleEntry.create({ schedule_id: schedule._id, teaching_assignment_id: assignment._id, school_year_id: schedule.school_year_id, group_id: slot.group_id, area_id: slot.area_id, teacher_id: slot.teacher_id, campus_id: aula.campus_id || null, aula_id: slot.aula_id, entry_key: slot.slot_id, legacy_slot_id: slot.slot_id, weekday: slot.weekday, start_time: slot.start_time, end_time: slot.end_time });
        }
    }

    async materialize(schedule, previousSchedule = null) {
        await this.ensureLegacyEntries(schedule);
        const currentEntries = await ScheduleEntry.find({ schedule_id: schedule._id, status: 'active' });
        const previousEntries = previousSchedule ? await ScheduleEntry.find({ schedule_id: previousSchedule._id }) : [];
        const previousByKey = new Map(previousEntries.map((entry) => [entry.entry_key, entry]));
        const currentByKey = new Map(currentEntries.map((entry) => [entry.entry_key, entry]));
        const schoolYear = await mongoose.model('SchoolYear').findById(schedule.school_year_id);
        const institution = await mongoose.model('Institution').findById(schedule.institution_id);
        const timezone = institution?.timezone || 'America/Bogota';
        const today = localParts(new Date(), timezone);
        const datesFor = (entry) => {
            const dates = [];
            let cursor = new Date(schoolYear.start_date);
            const end = new Date(schoolYear.end_date);
            while (cursor <= end) { if (schedule.school_days.includes(cursor.getUTCDay() || 7) && (cursor.getUTCDay() || 7) === Number(entry.weekday)) dates.push(new Date(cursor)); cursor = addDay(cursor); }
            return dates;
        };
        if (previousSchedule) {
            const oldSessions = await ClassSession.find({ schedule_id: previousSchedule._id, status: 'scheduled' });
            for (const session of oldSessions) {
                if (dateOnly(session.occurrence_date || session.start_at) < today) continue;
                const oldEntry = previousEntries.find((entry) => id(entry._id) === id(session.schedule_entry_id));
                const replacement = oldEntry ? currentByKey.get(oldEntry.entry_key) : null;
                if (!replacement) { session.status = 'cancelled'; session.exception_reason = 'Entrada reemplazada por una nueva versión del horario'; session.updated_by = schedule.updated_by; await session.save(); continue; }
                const startDate = dateOnly(session.occurrence_date || session.start_at);
                session.schedule_id = schedule._id; session.schedule_entry_id = replacement._id; session.group_id = replacement.group_id; session.area_id = replacement.area_id; session.teacher_id = replacement.teacher_id; session.aula_id = replacement.aula_id; session.start_at = localDateTime(startDate, replacement.start_time, timezone); session.end_at = localDateTime(startDate, replacement.end_time, timezone); session.updated_by = schedule.updated_by; await session.save();
            }
        }
        for (const entry of currentEntries) {
            for (const date of datesFor(entry)) {
                const occurrenceDate = new Date(`${dateOnly(date)}T00:00:00.000Z`);
                const existing = await ClassSession.findOne({ schedule_entry_id: entry._id, occurrence_date: occurrenceDate });
                if (existing) continue;
                const startAt = localDateTime(dateOnly(date), entry.start_time, timezone);
                const endAt = localDateTime(dateOnly(date), entry.end_time, timezone);
                await ClassSession.create({ school_year_id: schedule.school_year_id, group_id: entry.group_id, area_id: entry.area_id, teacher_id: entry.teacher_id, aula_id: entry.aula_id, start_at: startAt, end_at: endAt, schedule_id: schedule._id, schedule_entry_id: entry._id, schedule_slot_id: entry.legacy_slot_id || null, occurrence_date: occurrenceDate, source: 'schedule', status: 'scheduled', topic: '', created_by: schedule.published_by || schedule.created_by, updated_by: schedule.updated_by });
            }
        }
    }
}

export default new ScheduleEntryService();
