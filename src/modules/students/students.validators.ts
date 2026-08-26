import { z } from 'zod';
import { idParamSchema, objectIdSchema } from '../../shared/common.validators.js';

const guardianRelationshipSchema = z.enum(['mother', 'father', 'guardian', 'other']);

export const assignAulaSchema = {
    params: idParamSchema,
    body: z
        .object({
            aula_id: objectIdSchema,
        })
        .passthrough(),
};

export const replaceGuardiansSchema = {
    params: idParamSchema,
    body: z.object({
        guardians: z.array(z.object({
            guardian_id: objectIdSchema,
            relationship: guardianRelationshipSchema.optional(),
            is_authorized: z.boolean().optional(),
        })).max(10),
    }),
};
