import { z } from 'zod';
import { ACTIVITY_ALLOWED_EXTENSIONS, STUDENT_ACTIVITY_STATES } from '../../shared/activity.constants.js';
import { nonEmptyString, objectIdSchema } from '../../shared/common.validators.js';

const optionalTrimmedString = z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
        if (typeof value !== 'string') return null;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    });

const rubricCriterionSchema = z.object({
    title: nonEmptyString.max(150),
    description: optionalTrimmedString,
    max_points: z.coerce.number().positive().max(1000),
});

const rubricScoreSchema = z.object({
    criterion_id: objectIdSchema,
    earned_points: z.coerce.number().min(0),
    feedback: optionalTrimmedString,
});

export const teacherActivitiesQuerySchema = {
    query: z
        .object({
            group_id: objectIdSchema.optional(),
            area_id: objectIdSchema.optional(),
            period_id: objectIdSchema.optional(),
        })
        .passthrough(),
};

export const studentActivitiesQuerySchema = {
    query: z
        .object({
            area_id: objectIdSchema.optional(),
            period_id: objectIdSchema.optional(),
            status: z.enum(STUDENT_ACTIVITY_STATES).optional(),
        })
        .passthrough(),
};

export const createActivitySchema = {
    body: z
        .object({
            title: nonEmptyString.max(180),
            description: optionalTrimmedString,
            context: nonEmptyString.max(4000),
            group_id: objectIdSchema,
            area_id: objectIdSchema,
            period_id: objectIdSchema,
            open_at: z.coerce.date(),
            due_at: z.coerce.date().optional(),
            allowed_extensions: z.array(z.enum(ACTIVITY_ALLOWED_EXTENSIONS)).min(1),
            rubric_criteria: z.array(rubricCriterionSchema).min(1),
        })
        .passthrough(),
};

export const activityParamSchema = {
    params: z.object({
        activity_id: objectIdSchema,
    }),
};

export const updateActivitySchema = {
    params: z.object({
        activity_id: objectIdSchema,
    }),
    body: z
        .object({
            title: nonEmptyString.max(180).optional(),
            description: optionalTrimmedString.optional(),
            context: nonEmptyString.max(4000).optional(),
            open_at: z.coerce.date().optional(),
            due_at: z.union([z.coerce.date(), z.null()]).optional(),
            allowed_extensions: z.array(z.enum(ACTIVITY_ALLOWED_EXTENSIONS)).min(1).optional(),
            rubric_criteria: z.array(rubricCriterionSchema).min(1).optional(),
        })
        .passthrough(),
};

export const reviewActivitySubmissionSchema = {
    params: z.object({
        activity_id: objectIdSchema,
        student_id: objectIdSchema,
    }),
    body: z
        .object({
            rubric_scores: z.array(rubricScoreSchema).min(1),
            teacher_feedback: optionalTrimmedString.optional(),
        })
        .passthrough(),
};

export const activityStudentParamSchema = {
    params: z.object({
        activity_id: objectIdSchema,
        student_id: objectIdSchema,
    }),
};
