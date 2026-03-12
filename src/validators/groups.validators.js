import { z } from 'zod';
import {
    idParamSchema,
    groupParamSchema,
    gradeParamSchema,
    objectIdSchema,
    schoolYearParamSchema,
    studentParamSchema,
} from './common.validators.js';

export const createGroupSchema = {
    body: z
        .object({
            name: z.string().trim().min(1),
            grade_id: objectIdSchema,
            school_year_id: objectIdSchema,
            max_capacity: z.coerce.number().int().min(1),
        })
        .passthrough(),
};

export const updateGroupSchema = {
    params: idParamSchema,
    body: z
        .object({
            name: z.string().trim().min(1).optional(),
            grade_id: objectIdSchema.optional(),
            school_year_id: objectIdSchema.optional(),
            max_capacity: z.coerce.number().int().min(1).optional(),
        })
        .passthrough(),
};

export const groupIdSchema = { params: idParamSchema };
export const groupDetailSummarySchema = { params: groupParamSchema };
export const groupsBySchoolYearSchema = { params: schoolYearParamSchema };

export const enrollStudentSchema = {
    body: z
        .object({
            student_id: objectIdSchema,
            group_id: objectIdSchema,
            school_year_id: objectIdSchema,
        })
        .passthrough(),
};

export const transferEnrollmentSchema = {
    body: z
        .object({
            student_id: objectIdSchema,
            school_year_id: objectIdSchema,
            to_group_id: objectIdSchema,
            reason: z.string().trim().optional(),
            observations: z.string().trim().optional(),
        })
        .passthrough(),
};

export const enrollmentStatusSchema = {
    params: idParamSchema,
    body: z
        .object({
            status: z.enum(['active', 'transferred', 'retired']),
        })
        .passthrough(),
};

export const studentsByGroupSchema = { params: groupParamSchema };
export const enrollmentsByStudentSchema = { params: studentParamSchema };

export const assignTeacherSchema = {
    body: z
        .object({
            teacher_id: objectIdSchema,
            group_id: objectIdSchema,
            area_id: objectIdSchema,
        })
        .passthrough(),
};

export const teachersByGroupSchema = { params: groupParamSchema };
export const groupsByTeacherSchema = { params: z.object({ teacher_id: objectIdSchema }) };

export const assignAreaToGradeSchema = {
    body: z
        .object({
            grade_id: objectIdSchema,
            area_id: objectIdSchema,
            weekly_hours: z.coerce.number().int().min(1),
        })
        .passthrough(),
};

export const areasByGradeSchema = { params: gradeParamSchema };
