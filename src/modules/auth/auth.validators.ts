import { z } from 'zod';

const allowedRoles = ['Student', 'Teacher', 'Parent', 'Guardian'] as const;

export const registerSchema = {
    body: z
        .object({
            email: z.string().trim().email(),
            password: z.string().min(8),
            password_confirm: z.string().min(8),
        })
        .passthrough(),
};

export const loginSchema = {
    body: z
        .object({
            email: z.string().trim().email(),
            password: z.string().min(1),
        })
        .passthrough(),
};

export const completeProfileSchema = {
    body: z
        .object({
            first_name: z.string().trim().min(1),
            last_name: z.string().trim().min(1),
            born_date: z.string().trim().optional(),
            document_type: z.enum(['CC', 'RC', 'CE']),
            document_number: z.string().trim().min(4).max(20),
            phone: z.string().trim().min(7).max(20).optional(),
            requested_role: z.enum(allowedRoles).optional(),
        })
        .passthrough(),
};

export const changePasswordSchema = {
    body: z
        .object({
            current_password: z.string().min(1),
            new_password: z.string().min(8),
            new_password_confirm: z.string().min(8),
        })
        .passthrough(),
};

export const requestPasswordResetSchema = {
    body: z
        .object({
            email: z.string().trim().email(),
        })
        .passthrough(),
};

export const verifyPasswordResetCodeSchema = {
    body: z
        .object({
            email: z.string().trim().email(),
            code: z.string().regex(/^\d{6}$/),
        })
        .passthrough(),
};

export const resetPasswordSchema = {
    body: z
        .object({
            reset_token: z.string().min(1),
            new_password: z.string().min(8),
            new_password_confirm: z.string().min(8),
        })
        .passthrough(),
};
