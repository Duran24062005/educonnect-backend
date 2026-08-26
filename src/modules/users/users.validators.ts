import { z } from 'zod';
import { idParamSchema, paginationQuerySchema, objectIdSchema } from '../../shared/common.validators.js';

const roleFilter = ['student', 'teacher', 'admin', 'parent', 'guardian'] as const;
const statusFilter = ['active', 'pending', 'inactive', 'blocked', 'egresado'] as const;

export const listUsersSchema = {
    query: paginationQuerySchema.extend({
        role: z.enum(roleFilter).optional(),
        status: z.enum(statusFilter).optional(),
        search: z.string().trim().optional(),
    }),
};

export const usersByRoleSchema = {
    params: z.object({ role: z.enum(roleFilter) }),
    query: paginationQuerySchema,
};

export const userIdParamSchema = {
    params: idParamSchema,
};

export const userSessionParamSchema = {
    params: z.object({
        id: objectIdSchema,
        jti: z.string().uuid(),
    }),
};

export const updateUserSchema = {
    params: idParamSchema,
    body: z
        .object({
            first_name: z.string().trim().min(2).optional(),
            last_name: z.string().trim().min(2).optional(),
            birthdate: z.string().date().optional(),
            born_date: z.string().date().optional(),
            document_number: z.string().trim().min(4).max(20).optional(),
        })
        .passthrough(),
};

export const uploadProfilePhotoSchema = {
    params: idParamSchema,
};

export const approveUserSchema = {
    params: idParamSchema,
    body: z
        .object({
            role: z.enum(roleFilter),
        })
        .passthrough(),
};

export const changeUserStatusSchema = {
    params: idParamSchema,
    body: z
        .object({
            status: z.enum(statusFilter),
        })
        .passthrough(),
};

export const optionalUserOwnershipSchema = {
    params: z.object({ id: objectIdSchema }),
};
