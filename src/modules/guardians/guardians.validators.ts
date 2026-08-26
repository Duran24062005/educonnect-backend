import { z } from 'zod';
import { objectIdSchema } from '../../shared/common.validators.js';

export const schoolYearQuerySchema = {
    query: z.object({
        school_year_id: objectIdSchema,
    }),
};

export const guardianAttendanceQuerySchema = {
    query: z.object({
        school_year_id: objectIdSchema,
    }),
};

export const guardianBulletinQuerySchema = {
    query: z.object({
        school_year_id: objectIdSchema,
        period_id: objectIdSchema,
        student_id: objectIdSchema,
    }),
};
