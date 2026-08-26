import { z } from 'zod';
import { nonEmptyString, objectIdSchema } from '../../shared/common.validators.js';

const optionalTrimmedString = z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
        if (typeof value !== 'string') return null;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    });

export const notificationsQuerySchema = {
    query: z
        .object({
            read: z
                .enum(['true', 'false'])
                .transform((value) => value === 'true')
                .optional(),
            limit: z.coerce.number().int().min(1).max(100).optional(),
        })
        .passthrough(),
};

export const notificationIdParamSchema = {
    params: z.object({
        id: objectIdSchema,
    }),
};

export const createAdminAnnouncementSchema = {
    body: z
        .object({
            title: nonEmptyString.max(180),
            message: nonEmptyString.max(2000),
            target_role: z.enum(['admin', 'teacher', 'student', 'parent', 'teacher_student', 'teacher_admin', 'all']),
        })
        .passthrough(),
};

export const createTeacherAnnouncementSchema = {
    body: z
        .object({
            title: nonEmptyString.max(180),
            message: nonEmptyString.max(2000),
            scope: z.enum(['all_my_students', 'group']),
            group_id: z.union([objectIdSchema, z.null(), z.undefined()]).optional(),
            context_note: optionalTrimmedString.optional(),
        })
        .passthrough()
        .superRefine((value, ctx) => {
            if (value.scope === 'group' && !value.group_id) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'group_id is required when scope is group',
                    path: ['group_id'],
                });
            }
        }),
};
