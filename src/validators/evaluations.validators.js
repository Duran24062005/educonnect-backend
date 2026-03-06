import { z } from 'zod';
import {
    idParamSchema,
    objectIdSchema,
    schoolYearParamSchema,
    studentParamSchema,
    gradeItemParamSchema,
} from './common.validators.js';

export const listGradeItemsSchema = {
    query: z
        .object({
            period_id: objectIdSchema,
            area_id: objectIdSchema,
        })
        .passthrough(),
};

export const createGradeItemSchema = {
    body: z
        .object({
            name: z.string().trim().min(1),
            percentage: z.coerce.number().min(0).max(100),
            area_id: objectIdSchema,
            period_id: objectIdSchema,
        })
        .passthrough(),
};

export const updateGradeItemSchema = {
    params: idParamSchema,
    body: z
        .object({
            name: z.string().trim().min(1).optional(),
            percentage: z.coerce.number().min(0).max(100).optional(),
            area_id: objectIdSchema.optional(),
            period_id: objectIdSchema.optional(),
        })
        .passthrough(),
};

export const deleteGradeItemSchema = { params: idParamSchema };

export const registerScoreSchema = {
    body: z
        .object({
            student_id: objectIdSchema,
            grade_item_id: objectIdSchema,
            score: z.coerce.number().min(0).max(10),
        })
        .passthrough(),
};

export const scoresByStudentSchema = { params: studentParamSchema };
export const scoresByGradeItemSchema = { params: gradeItemParamSchema };

export const calculatePeriodResultSchema = {
    body: z
        .object({
            student_id: objectIdSchema,
            area_id: objectIdSchema,
            period_id: objectIdSchema,
        })
        .passthrough(),
};

export const periodResultsByStudentSchema = { params: studentParamSchema };

export const calculateFinalResultSchema = {
    body: z
        .object({
            student_id: objectIdSchema,
            school_year_id: objectIdSchema,
        })
        .passthrough(),
};

export const finalResultsByYearSchema = {
    params: schoolYearParamSchema,
    query: z
        .object({
            status: z.enum(['passed', 'failed', 'repeating']).optional(),
        })
        .passthrough(),
};

export const studentFinalResultSchema = {
    params: z.object({
        student_id: objectIdSchema,
        school_year_id: objectIdSchema,
    }),
};

export const yearStatsSchema = { params: schoolYearParamSchema };
