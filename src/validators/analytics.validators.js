import { z } from 'zod';
import { objectIdSchema } from './common.validators.js';

const schoolYearRequired = z.object({
    school_year_id: objectIdSchema,
});

export const studentOverviewQuerySchema = { query: schoolYearRequired };
export const studentAreasQuerySchema = { query: schoolYearRequired };
export const studentAreaTrendQuerySchema = {
    query: schoolYearRequired.extend({
        area_id: objectIdSchema,
    }),
};
export const studentPeriodSummaryQuerySchema = { query: schoolYearRequired };

export const teacherGroupsQuerySchema = { query: schoolYearRequired };
export const teacherGroupPerformanceQuerySchema = {
    query: schoolYearRequired.extend({
        group_id: objectIdSchema,
        area_id: objectIdSchema,
        period_id: objectIdSchema.optional(),
    }),
};
export const teacherGroupTrendQuerySchema = {
    query: schoolYearRequired.extend({
        group_id: objectIdSchema,
        area_id: objectIdSchema,
    }),
};
export const teacherStudentDetailQuerySchema = {
    query: schoolYearRequired.extend({
        student_id: objectIdSchema,
        area_id: objectIdSchema,
    }),
};

export const adminInstitutionOverviewQuerySchema = {
    query: schoolYearRequired.extend({
        period_id: objectIdSchema.optional(),
    }),
};
export const adminInstitutionTrendQuerySchema = { query: schoolYearRequired };
export const adminByGradeQuerySchema = {
    query: schoolYearRequired.extend({
        period_id: objectIdSchema.optional(),
    }),
};
export const adminByAreaQuerySchema = {
    query: schoolYearRequired.extend({
        grade_id: objectIdSchema.optional(),
        period_id: objectIdSchema.optional(),
    }),
};
export const adminGradeDetailQuerySchema = {
    query: schoolYearRequired.extend({
        grade_id: objectIdSchema,
        period_id: objectIdSchema.optional(),
    }),
};
