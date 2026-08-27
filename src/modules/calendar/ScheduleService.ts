// @ts-nocheck
import { randomUUID } from 'node:crypto';
import WeeklySchedule from '../../models/WeeklyScheduleModel.js';
import Institution from '../../models/InstitutionModel.js';
import SchoolYear from '../../models/SchoolYearModel.js';
import Group from '../../models/GroupModel.js';
import AppError from '../../utils/AppError.js';
import AuditLogService from '../audit/AuditLogService.js';

const schedulePopulate = [
    { path: 'school_year_id' },
    { path: 'availability_windows.group_id', populate: [{ path: 'grade_id' }, { path: 'school_year_id' }, { path: 'shift_id' }, { path: 'campus_id' }] },
    // Keep legacy slots readable in archived schedules.
    { path: 'slots.group_id', populate: [{ path: 'grade_id' }, { path: 'school_year_id' }, { path: 'shift_id' }, { path: 'campus_id' }] },
    { path: 'slots.area_id' },
    { path: 'slots.teacher_id', populate: { path: 'user_id', populate: { path: 'person_id' } } },
    { path: 'slots.aula_id' },
];

const id = (value) => value?._id?.toString?.() || value?.toString?.() || null;
const minutes = (time) => {
    const [hours, mins] = String(time).split(':').map(Number);
    return hours * 60 + mins;
};
const dateKey = (value) => new Date(value).toISOString().slice(0, 10);
const dateAtMidnight = (date) => new Date(`${date}T00:00:00.000Z`);
const entity = (value, fallback) => ({ _id: id(value), name: value?.name || fallback });
const weekdayByShortName = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

const localParts = (value, timeZone) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'short',
        hourCycle: 'h23',
    }).formatToParts(value);
    const get = (type) => parts.find((part) => part.type === type)?.value;
    return {
        date: `${get('year')}-${get('month')}-${get('day')}`,
        time: `${get('hour')}:${get('minute')}`,
        weekday: weekdayByShortName[get('weekday')],
    };
};

const personName = (teacher) => `${teacher?.user_id?.person_id?.first_name || ''} ${teacher?.user_id?.person_id?.last_name || ''}`.trim() || teacher?.user_id?.email || 'Docente';

class ScheduleService {
    async getInstitution(institutionId) {
        if (!institutionId) return { timezone: 'America/Bogota' };
        const institution = await Institution.findById(institutionId);
        if (!institution) throw new AppError('Institución no encontrada', 404);
        return institution;
    }

    serializeSchedule(schedule) {
        return {
            id: id(schedule),
            school_year: entity(schedule.school_year_id, 'Año escolar'),
            version: schedule.version,
            status: schedule.status,
            school_days: schedule.school_days,
            published_at: schedule.published_at,
            availability_windows: (schedule.availability_windows || []).map((window) => ({
                window_id: window.window_id,
                start_time: window.start_time,
                end_time: window.end_time,
                group: entity(window.group_id, 'Grupo'),
            })),
            slots: (schedule.slots || []).map((slot) => ({
                slot_id: slot.slot_id,
                weekday: slot.weekday,
                start_time: slot.start_time,
                end_time: slot.end_time,
                group: entity(slot.group_id, 'Grupo'),
                area: entity(slot.area_id, 'Materia'),
                teacher: { _id: id(slot.teacher_id), name: personName(slot.teacher_id) },
                aula: entity(slot.aula_id, 'Aula'),
            })),
        };
    }

    async list(_institutionId, query = {}) {
        const filter = {};
        if (query.school_year_id) filter.school_year_id = query.school_year_id;
        if (query.status) filter.status = query.status;
        const schedules = await WeeklySchedule.find(filter).populate(schedulePopulate).sort({ school_year_id: 1, version: -1 });
        return { schedules: schedules.map((schedule) => this.serializeSchedule(schedule)) };
    }

    async initialWindows(schoolYearId, published) {
        if (published?.availability_windows?.length) {
            return published.availability_windows.map((window) => ({
                window_id: window.window_id,
                group_id: window.group_id,
                start_time: window.start_time,
                end_time: window.end_time,
            }));
        }

        // Legacy exact subject slots are not converted. Windows are derived
        // only from each group's configured active shift and require review.
        const groups = await Group.find({ school_year_id: schoolYearId }).populate('shift_id');
        return groups
            .filter((group) => group.shift_id?.status === 'active')
            .map((group) => ({
                window_id: randomUUID(),
                group_id: group._id,
                start_time: group.shift_id.start_time,
                end_time: group.shift_id.end_time,
            }));
    }

    async createDraft(userId, institutionId, schoolYearId) {
        const schoolYear = await SchoolYear.findById(schoolYearId);
        if (!schoolYear) throw new AppError('Año escolar no encontrado', 404);
        const existingDraft = await WeeklySchedule.findOne({ school_year_id: schoolYearId, status: 'draft' }).populate(schedulePopulate);
        if (existingDraft) return this.serializeSchedule(existingDraft);

        const published = await WeeklySchedule.findOne({ school_year_id: schoolYearId, status: 'published' });
        const institution = await this.getInstitution(institutionId);
        const version = (await WeeklySchedule.countDocuments({ school_year_id: schoolYearId })) + 1;
        const draft = await WeeklySchedule.create({
            school_year_id: schoolYearId,
            version,
            status: 'draft',
            school_days: published?.school_days || institution.school_days || [1, 2, 3, 4, 5],
            availability_windows: await this.initialWindows(schoolYearId, published),
            slots: [],
            created_by: userId,
            updated_by: userId,
        });
        return this.serializeSchedule(await WeeklySchedule.findById(draft._id).populate(schedulePopulate));
    }

    async updateDraft(userId, idValue, data) {
        const schedule = await WeeklySchedule.findById(idValue);
        if (!schedule) throw new AppError('Borrador de horario no encontrado', 404);
        if (schedule.status !== 'draft') throw new AppError('Solo se puede editar un borrador', 409);
        schedule.school_days = [...new Set(data.school_days.map(Number))].sort((left, right) => left - right);
        schedule.availability_windows = (data.availability_windows || []).map((window) => ({
            ...window,
            window_id: window.window_id || randomUUID(),
        }));
        schedule.updated_by = userId;
        await schedule.save();
        return this.serializeSchedule(await WeeklySchedule.findById(schedule._id).populate(schedulePopulate));
    }

    async validateDraft(schedule) {
        const errors = [];
        const schoolDays = [...new Set((schedule.school_days || []).map(Number))];
        if (!schoolDays.length || schoolDays.some((day) => day < 1 || day > 7)) errors.push('Configura al menos un día lectivo válido');
        if (!(schedule.availability_windows || []).length) errors.push('Configura al menos una ventana de disponibilidad');

        const seenGroups = new Set();
        const seenWindows = new Set();
        for (const window of schedule.availability_windows || []) {
            if (seenGroups.has(id(window.group_id))) errors.push(`El grupo ${id(window.group_id)} tiene más de una ventana de disponibilidad`);
            seenGroups.add(id(window.group_id));
            if (seenWindows.has(window.window_id)) errors.push(`La ventana ${window.window_id} está duplicada`);
            seenWindows.add(window.window_id);
            if (minutes(window.end_time) <= minutes(window.start_time)) errors.push(`La hora final de la ventana ${window.window_id} debe ser posterior a la inicial`);

            const group = await Group.findById(window.group_id).populate('shift_id').populate('school_year_id');
            if (!group) {
                errors.push(`Grupo no encontrado para la ventana ${window.window_id}`);
                continue;
            }
            if (id(group.school_year_id) !== id(schedule.school_year_id)) errors.push(`El grupo de la ventana ${window.window_id} no pertenece al año escolar`);
            if (!group.shift_id || group.shift_id.status !== 'active') {
                errors.push(`El grupo ${group.name} debe tener una jornada activa configurada`);
            } else if (minutes(window.start_time) < minutes(group.shift_id.start_time) || minutes(window.end_time) > minutes(group.shift_id.end_time)) {
                errors.push(`La ventana del grupo ${group.name} debe estar dentro de su jornada ${group.shift_id.name}`);
            }
        }
        return errors;
    }

    async publish(userId, institutionId, idValue, requestContext = {}) {
        const schedule = await WeeklySchedule.findById(idValue);
        if (!schedule) throw new AppError('Horario no encontrado', 404);
        if (schedule.status !== 'draft') throw new AppError('Solo se puede publicar un borrador', 409);
        const errors = await this.validateDraft(schedule);
        const institution = await this.getInstitution(institutionId);
        if (institution.school_days && schedule.school_days.some((day) => !institution.school_days.includes(Number(day)))) {
            errors.push('El horario no puede usar días que la institución no tiene configurados como lectivos');
        }
        if (errors.length) throw new AppError('El horario no puede publicarse', 409, { errors });

        const previous = await WeeklySchedule.findOne({ school_year_id: schedule.school_year_id, status: 'published' });
        if (previous) await WeeklySchedule.updateOne({ _id: previous._id }, { status: 'archived', updated_by: userId });
        schedule.status = 'published';
        schedule.published_at = new Date();
        schedule.published_by = userId;
        schedule.updated_by = userId;
        await schedule.save();
        await AuditLogService.record({ actorUserId: userId, actorRole: 'admin', action: 'schedule.published', entityType: 'WeeklySchedule', entityId: schedule._id, before: previous, after: schedule, institutionId, ...requestContext });
        return this.serializeSchedule(await WeeklySchedule.findById(schedule._id).populate(schedulePopulate));
    }

    async findPublished(schoolYearId) {
        return WeeklySchedule.findOne({ school_year_id: schoolYearId, status: 'published' }).populate(schedulePopulate);
    }

    async assertSessionDate(institutionId, data, references) {
        const institution = await this.getInstitution(institutionId);
        const startAt = new Date(data.start_at);
        const endAt = new Date(data.end_at);
        const start = localParts(startAt, institution.timezone || 'America/Bogota');
        const end = localParts(endAt, institution.timezone || 'America/Bogota');
        if (start.date !== end.date) throw new AppError('La sesión debe comenzar y terminar el mismo día', 400);
        const yearStart = dateKey(references.schoolYear.start_date);
        const yearEnd = dateKey(references.schoolYear.end_date);
        if (start.date < yearStart || start.date > yearEnd) throw new AppError('La sesión está fuera del año escolar', 409);
        return { institution, local: start, localEnd: end, occurrenceDate: dateAtMidnight(start.date) };
    }

    async assertSessionWithinAvailability(institutionId, data, references) {
        const schedule = await this.findPublished(data.school_year_id);
        if (!schedule) throw new AppError('No existe un horario semanal publicado para el año escolar', 409);
        const { local, localEnd, occurrenceDate } = await this.assertSessionDate(institutionId, data, references);
        if (!schedule.school_days.includes(local.weekday)) throw new AppError('La fecha no corresponde a un día lectivo', 409);

        const window = (schedule.availability_windows || []).find((item) => id(item.group_id) === id(data.group_id));
        if (!window) throw new AppError('El grupo no tiene una ventana de disponibilidad publicada', 409);
        if (minutes(local.time) < minutes(window.start_time) || minutes(localEnd.time) > minutes(window.end_time)) {
            throw new AppError(`La sesión debe estar dentro de la jornada permitida (${window.start_time} - ${window.end_time})`, 409);
        }
        return { schedule, window, occurrenceDate, local };
    }
}

export { dateKey, dateAtMidnight };
export default new ScheduleService();
