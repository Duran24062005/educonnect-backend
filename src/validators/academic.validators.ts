import { z } from 'zod';
import { idParamSchema, objectIdSchema, schoolYearParamSchema } from './common.validators.js';

export const createSchoolYearSchema = {
    body: z
        .object({
            year: z.coerce.number().int().min(2000).max(2100),
            start_date: z.string().date(),
            end_date: z.string().date(),
            is_active: z.boolean().optional(),
        })
        .passthrough(),
};

export const schoolYearIdSchema = { params: idParamSchema };
export const resourceIdSchema = { params: idParamSchema };

export const promoteStudentsSchema = {
    body: z
        .object({
            from_school_year_id: objectIdSchema,
            to_school_year_id: objectIdSchema,
        })
        .passthrough(),
};

export const periodsBySchoolYearSchema = { params: schoolYearParamSchema };

export const createPeriodSchema = {
    body: z
        .object({
            school_year_id: objectIdSchema,
            name: z.string().trim().min(1),
            weight: z.coerce.number().min(0).max(1),
            start_date: z.string().date(),
            end_date: z.string().date(),
        })
        .passthrough(),
};

export const createGradeSchema = {
    body: z
        .object({
            name: z.string().trim().min(1),
            level: z.string().trim().optional(),
            description: z.string().trim().optional(),
        })
        .passthrough(),
};

export const updateGradeSchema = {
    params: idParamSchema,
    body: z
        .object({
            name: z.string().trim().min(1).optional(),
            level: z.string().trim().optional(),
            description: z.string().trim().optional(),
        })
        .passthrough(),
};

export const createAreaSchema = {
    body: z
        .object({
            name: z.string().trim().min(1),
            description: z.string().trim().optional(),
        })
        .passthrough(),
};

export const updateAreaSchema = {
    params: idParamSchema,
    body: z
        .object({
            name: z.string().trim().min(1).optional(),
            description: z.string().trim().optional(),
        })
        .passthrough(),
};

export const createAulaSchema = {
    body: z
        .object({
            name: z.string().trim().min(1),
            max_capacity: z.coerce.number().int().min(1),
        })
        .passthrough(),
};

export const updateAulaSchema = {
    params: idParamSchema,
    body: z
        .object({
            name: z.string().trim().min(1).optional(),
            max_capacity: z.coerce.number().int().min(1).optional(),
        })
        .passthrough(),
};
