import { z } from 'zod';
import { objectIdSchema } from '../../shared/common.validators.js';

const isoDateTimeSchema = z.coerce.date();
const dateOnlySchema = z.string().date();

export const calendarQuerySchema = {
    query: z
        .object({
            from: dateOnlySchema,
            to: dateOnlySchema,
            school_year_id: objectIdSchema.optional(),
            grade_id: objectIdSchema.optional(),
            group_id: objectIdSchema.optional(),
            area_id: objectIdSchema.optional(),
            teacher_id: objectIdSchema.optional(),
            aula_id: objectIdSchema.optional(),
        })
        .passthrough(),
};

export const calendarCatalogQuerySchema = {
    query: z
        .object({
            school_year_id: objectIdSchema.optional(),
        })
        .passthrough(),
};

const sessionFields = z.object({
    school_year_id: objectIdSchema,
    group_id: objectIdSchema,
    area_id: objectIdSchema,
    teacher_id: objectIdSchema,
    aula_id: objectIdSchema,
    start_at: isoDateTimeSchema,
    end_at: isoDateTimeSchema,
    topic: z.string().trim().min(1).max(500),
});

export const createCalendarSessionSchema = {
    body: sessionFields.passthrough(),
};

export const createCalendarExceptionSchema = {
    body: z.object({
        type: z.enum(['cancelled', 'override', 'additional']).optional(),
        session_id: objectIdSchema.optional(),
        schedule_entry_id: objectIdSchema.optional(),
        occurrence_date: dateOnlySchema.optional(),
        school_year_id: objectIdSchema.optional(),
        group_id: objectIdSchema.optional(),
        area_id: objectIdSchema.optional(),
        teacher_id: objectIdSchema.optional(),
        aula_id: objectIdSchema.optional(),
        start_at: isoDateTimeSchema.optional(),
        end_at: isoDateTimeSchema.optional(),
        topic: z.string().trim().min(1).max(500).optional(),
        reason: z.string().trim().min(3).max(1000),
    }).passthrough().superRefine((value, ctx) => {
        if (value.type === 'cancelled' && !value.session_id && !value.schedule_entry_id) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['session_id'], message: 'Indica la sesión o entrada que se cancelará' });
        }
        if ((value.type === 'additional' || value.type === 'override' || !value.type) && (!value.school_year_id || !value.group_id || !value.area_id || !value.teacher_id || !value.aula_id || !value.start_at || !value.end_at || !value.topic)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['schedule'], message: 'Una excepción adicional o modificada requiere la información completa de la sesión' });
        }
    }),
};

export const updateCalendarSessionSchema = {
    params: z.object({ id: objectIdSchema }),
    body: z
        .object({
            school_year_id: objectIdSchema.optional(),
            group_id: objectIdSchema.optional(),
            area_id: objectIdSchema.optional(),
            teacher_id: objectIdSchema.optional(),
            aula_id: objectIdSchema.optional(),
            start_at: isoDateTimeSchema.optional(),
            end_at: isoDateTimeSchema.optional(),
            topic: z.string().trim().min(1).max(500).optional(),
            status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
        })
        .passthrough()
        .refine((value) => Object.keys(value).length > 0, 'Debes enviar al menos un campo para actualizar'),
};

export const calendarSessionParamSchema = {
    params: z.object({ id: objectIdSchema }),
};
