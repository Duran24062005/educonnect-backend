import { z } from 'zod';
import { objectIdSchema } from '../../shared/common.validators.js';

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida');

const entryFields = z.object({
    teaching_assignment_id: objectIdSchema,
    aula_id: objectIdSchema,
    entry_key: z.string().trim().min(1).max(120).optional(),
    weekday: z.coerce.number().int().min(1).max(7),
    start_time: timeSchema,
    end_time: timeSchema,
});

export const scheduleEntryListSchema = { params: z.object({ id: objectIdSchema }) };
export const scheduleEntryIdSchema = { params: z.object({ id: objectIdSchema, entryId: objectIdSchema }) };
export const createScheduleEntrySchema = { params: z.object({ id: objectIdSchema }), body: entryFields.passthrough() };
export const updateScheduleEntrySchema = {
    params: z.object({ id: objectIdSchema, entryId: objectIdSchema }),
    body: entryFields.partial().passthrough().refine((value) => Object.keys(value).length > 0, 'Debes enviar al menos un campo'),
};
