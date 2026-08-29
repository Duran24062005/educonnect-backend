import { z } from 'zod';
import { objectIdSchema, nonEmptyString } from '../../shared/common.validators.js';

const optionalTrimmedString = z.union([z.string(), z.null(), z.undefined()]).transform((value) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
});

export const materialsQuerySchema = {
    query: z.object({
        group_id: objectIdSchema.optional(),
        area_id: objectIdSchema.optional(),
        session_id: objectIdSchema.optional(),
    }).passthrough(),
};

export const teacherSessionsQuerySchema = {
    query: z.object({
        school_year_id: objectIdSchema.optional(),
        group_id: objectIdSchema.optional(),
        area_id: objectIdSchema.optional(),
    }).passthrough(),
};

export const createMaterialSchema = {
    body: z.object({
        title: nonEmptyString.max(180),
        description: optionalTrimmedString,
        session_id: objectIdSchema,
        link_url: optionalTrimmedString,
        topic: optionalTrimmedString,
    }).passthrough(),
};

export const updateMaterialSchema = {
    params: z.object({ material_id: objectIdSchema }),
    body: z.object({
        title: nonEmptyString.max(180).optional(),
        description: optionalTrimmedString.optional(),
        session_id: objectIdSchema.optional(),
        link_url: optionalTrimmedString.optional(),
        topic: optionalTrimmedString.optional(),
    }).passthrough(),
};

export const materialParamSchema = {
    params: z.object({ material_id: objectIdSchema }),
};
