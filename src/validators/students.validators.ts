import { z } from 'zod';
import { idParamSchema, objectIdSchema } from './common.validators.js';

export const assignAulaSchema = {
    params: idParamSchema,
    body: z
        .object({
            aula_id: objectIdSchema,
        })
        .passthrough(),
};
