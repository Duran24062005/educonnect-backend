import { z } from 'zod';
import { objectIdSchema } from './common.validators.js';

const dateOnlySchema = z.string().date();
const statusSchema = z.enum(['pending', 'present', 'absent', 'late', 'excused']);

export const createAttendanceSessionSchema = {
    body: z.object({
        school_year_id: objectIdSchema,
        period_id: objectIdSchema.optional(),
        group_id: objectIdSchema,
        area_id: objectIdSchema.optional(),
        teacher_id: objectIdSchema.optional(),
        date: dateOnlySchema,
        topic: z.string().trim().max(300).optional(),
    }).passthrough(),
};

export const attendanceSessionsQuerySchema = {
    query: z.object({
        school_year_id: objectIdSchema,
        group_id: objectIdSchema.optional(),
        from: dateOnlySchema.optional(),
        to: dateOnlySchema.optional(),
    }).passthrough().refine((value) => {
        if (!value.from || !value.to) return true;
        return value.from <= value.to;
    }, 'La fecha inicial debe ser anterior o igual a la fecha final'),
};

export const attendanceSessionParamSchema = { params: z.object({ id: objectIdSchema }) };

export const updateAttendanceRecordsSchema = {
    params: z.object({ id: objectIdSchema }),
    body: z.object({
        records: z.array(z.object({
            student_id: objectIdSchema,
            status: statusSchema,
            note: z.string().trim().max(500).nullable().optional(),
            justification: z.string().trim().max(1000).nullable().optional(),
        })).min(1),
    }).passthrough(),
};

export const updateAttendanceSessionStatusSchema = {
    params: z.object({ id: objectIdSchema }),
    body: z.object({ status: z.enum(['open', 'closed']) }).passthrough(),
};

export const attendanceStudentSummarySchema = {
    params: z.object({ student_id: objectIdSchema }),
    query: z.object({ school_year_id: objectIdSchema }).passthrough(),
};

export const guardianAttendanceQuerySchema = {
    query: z.object({ school_year_id: objectIdSchema }).passthrough(),
};
