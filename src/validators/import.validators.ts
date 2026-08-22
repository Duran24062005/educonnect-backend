import { z } from 'zod';
import { idParamSchema } from './common.validators.js';

const entitySchema = z.enum(['students', 'guardians', 'teachers', 'grades', 'areas', 'groups', 'enrollments']);

export const importPreviewSchema = {
    body: z.object({ entity: entitySchema }),
};

export const importListSchema = {
    query: z.object({ limit: z.coerce.number().int().min(1).max(100).optional() }).passthrough(),
};

export const importJobParamSchema = idParamSchema;
