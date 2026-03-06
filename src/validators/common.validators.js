import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid MongoDB ObjectId');

export const paginationQuerySchema = z
    .object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
    })
    .passthrough();

export const idParamSchema = z.object({ id: objectIdSchema });

export const schoolYearParamSchema = z.object({ school_year_id: objectIdSchema });
export const studentParamSchema = z.object({ student_id: objectIdSchema });
export const groupParamSchema = z.object({ group_id: objectIdSchema });
export const gradeParamSchema = z.object({ grade_id: objectIdSchema });
export const gradeItemParamSchema = z.object({ grade_item_id: objectIdSchema });

export const nonEmptyString = z.string().trim().min(1);
