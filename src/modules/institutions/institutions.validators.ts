import { z } from 'zod';
import { objectIdSchema } from '../../shared/common.validators.js';

export const createInstitutionSchema = {
    body: z.object({
        name: z.string().trim().min(3).max(200),
        code: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9-]+$/),
        type: z.enum(['private', 'public']),
        max_students: z.coerce.number().int().min(1).max(800).optional(),
        timezone: z.string().trim().min(1).max(100).optional(),
    }),
};

export const assignInstitutionUserSchema = {
    params: z.object({ user_id: objectIdSchema }),
};

const structureId = { params: z.object({ id: objectIdSchema }) };
const campusBody = z.object({ name: z.string().trim().min(2).max(120), code: z.string().trim().min(2).max(30).regex(/^[A-Za-z0-9-]+$/), address: z.string().trim().max(250).optional(), status: z.enum(['active', 'inactive']).optional() });
const shiftBody = z.object({ name: z.string().trim().min(2).max(80), code: z.string().trim().min(2).max(30).regex(/^[A-Za-z0-9-]+$/), shift_type: z.enum(['morning', 'afternoon', 'hybrid']).default('morning'), start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), status: z.enum(['active', 'inactive']).optional() });
export const campusCreateSchema = { body: campusBody };
export const campusUpdateSchema = { ...structureId, body: campusBody.partial() };
export const campusIdSchema = structureId;
export const shiftCreateSchema = { body: shiftBody };
export const shiftUpdateSchema = { ...structureId, body: shiftBody.partial() };
export const shiftIdSchema = structureId;
export const scheduleConfigSchema = {
    body: z.object({ school_days: z.array(z.coerce.number().int().min(1).max(7)).min(1).max(7) }).passthrough(),
};
