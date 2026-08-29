import { z } from 'zod';
import { objectIdSchema, paginationQuerySchema } from '../../shared/common.validators.js';

const institutionBody = z.object({
    name: z.string().trim().min(3).max(200),
    code: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9-]+$/),
    type: z.enum(['private', 'public']),
    max_students: z.coerce.number().int().min(1).max(800).optional(),
    timezone: z.string().trim().min(1).max(100).optional(),
});

export const primaryAdminBody = z.object({
    first_name: z.string().trim().min(1).max(100),
    last_name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(150),
    document_type: z.enum(['CC', 'RC', 'CE']),
    document_number: z.string().trim().min(4).max(20).regex(/^[0-9A-Za-z-]+$/),
    phone: z.string().trim().min(7).max(20).optional(),
});

export const listInstitutionsSchema = {
    query: paginationQuerySchema.extend({
        search: z.string().trim().max(100).optional(),
        type: z.enum(['private', 'public']).optional(),
        status: z.enum(['sandbox', 'active', 'suspended', 'archived']).optional(),
    }),
};

export const institutionIdSchema = { params: z.object({ id: objectIdSchema }) };

export const createInstitutionSchema = {
    body: z.object({ institution: institutionBody, primary_admin: primaryAdminBody }),
};

export const assignPrimaryAdminSchema = {
    ...institutionIdSchema,
    body: primaryAdminBody,
};

export const updateInstitutionSchema = {
    ...institutionIdSchema,
    body: z.object({
        name: z.string().trim().min(3).max(200).optional(),
        code: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9-]+$/).optional(),
        type: z.enum(['private', 'public']).optional(),
        max_students: z.coerce.number().int().min(1).max(800).optional(),
        timezone: z.string().trim().min(1).max(100).optional(),
    }),
};

export const changeInstitutionStatusSchema = {
    ...institutionIdSchema,
    body: z.object({ status: z.enum(['active', 'suspended']) }),
};
