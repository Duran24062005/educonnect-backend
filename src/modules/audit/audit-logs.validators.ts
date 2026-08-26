import { z } from 'zod';
import { objectIdSchema, paginationQuerySchema } from '../../shared/common.validators.js';

export const auditLogQuerySchema = {
    query: paginationQuerySchema.extend({
        action: z.string().trim().min(1).max(100).optional(),
        entity_type: z.string().trim().min(1).max(100).optional(),
        entity_id: z.string().trim().min(1).max(100).optional(),
        actor_user_id: objectIdSchema.optional(),
    }),
};
