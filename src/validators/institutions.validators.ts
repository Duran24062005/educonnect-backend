import { z } from 'zod';
import { objectIdSchema } from './common.validators.js';

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
