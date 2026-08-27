import { z } from 'zod';
import { objectIdSchema } from '../../shared/common.validators.js';

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida');
const schoolDaysSchema = z.array(z.coerce.number().int().min(1).max(7)).min(1).max(7);

const availabilityWindowSchema = z.object({
    window_id: z.string().trim().min(1).max(100).optional(),
    group_id: objectIdSchema,
    start_time: timeSchema,
    end_time: timeSchema,
});

export const scheduleQuerySchema = {
    query: z.object({ school_year_id: objectIdSchema.optional(), status: z.enum(['draft', 'published', 'archived']).optional() }).passthrough(),
};

export const scheduleIdSchema = { params: z.object({ id: objectIdSchema }) };

export const createScheduleSchema = {
    body: z.object({ school_year_id: objectIdSchema }).passthrough(),
};

export const updateScheduleSchema = {
    params: z.object({ id: objectIdSchema }),
    body: z.object({ school_days: schoolDaysSchema, availability_windows: z.array(availabilityWindowSchema).max(500) }).passthrough(),
};
