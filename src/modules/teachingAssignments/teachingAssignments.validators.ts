import { z } from 'zod';
import { objectIdSchema } from '../../shared/common.validators.js';

export const teachingAssignmentQuerySchema = {
    query: z.object({
        school_year_id: objectIdSchema.optional(),
        teacher_id: objectIdSchema.optional(),
        group_id: objectIdSchema.optional(),
        area_id: objectIdSchema.optional(),
        status: z.enum(['active', 'inactive']).optional(),
    }).passthrough(),
};

export const createTeachingAssignmentSchema = {
    body: z.object({
        school_year_id: objectIdSchema,
        teacher_id: objectIdSchema,
        group_id: objectIdSchema,
        area_id: objectIdSchema,
    }).passthrough(),
};

export const updateTeachingAssignmentSchema = {
    params: z.object({ id: objectIdSchema }),
    body: z.object({ status: z.enum(['active', 'inactive']) }).passthrough(),
};

export const teachingAssignmentIdSchema = {
    params: z.object({ id: objectIdSchema }),
};
