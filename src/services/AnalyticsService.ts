// @ts-nocheck
import mongoose from 'mongoose';
import AppError from '../utils/AppError.js';
import AnalyticsRepository from '../repositories/AnalyticsRepository.js';
import UserService from './UserService.js';
import SimpleMemoryCache from '../utils/simpleMemoryCache.js';

const PASS_SCORE = 6;
const SUMMARY_CACHE_TTL_MS = 30_000;
const summaryCache = new SimpleMemoryCache();

const toIdString = (value) => value?._id?.toString?.() || value?.toString?.() || null;
const round2 = (value) => Number((value || 0).toFixed(2));

const computeAverage = (values) => {
    if (!values.length) return 0;
    return round2(values.reduce((sum, value) => sum + value, 0) / values.length);
};

const buildStudentProfileMap = (students) => {
    const map = new Map();

    for (const student of students) {
        const person = student.user_id?.person_id;
        const fullName = person ? `${person.first_name} ${person.last_name}`.trim() : 'Sin nombre';
        map.set(student._id.toString(), {
            full_name: fullName,
            email: student.user_id?.email || null,
        });
    }

    return map;
};

class AnalyticsService {
    async ensureSchoolYear(schoolYearId) {
        const schoolYear = await AnalyticsRepository.findSchoolYearById(schoolYearId);
        if (!schoolYear) {
            throw new AppError('Año escolar no encontrado', 404);
        }
        return schoolYear;
    }

    async getStudentContext(userId, schoolYearId) {
        const student = await AnalyticsRepository.findStudentByUserId(userId);
        if (!student) {
            throw new AppError('Perfil de estudiante no encontrado', 404);
        }

        const schoolYear = await this.ensureSchoolYear(schoolYearId);
        const periods = await AnalyticsRepository.findPeriodsBySchoolYear(schoolYearId);

        return { student, schoolYear, periods };
    }

    async getTeacherContext(userId, schoolYearId) {
        const teacher = await AnalyticsRepository.findTeacherByUserId(userId);
        if (!teacher) {
            throw new AppError('Perfil de docente no encontrado', 404);
        }

        await this.ensureSchoolYear(schoolYearId);

        return { teacher };
    }

    aggregateAreaAverages(results) {
        const areaMap = new Map();

        for (const row of results) {
            const areaId = toIdString(row.area_id);
            if (!areaMap.has(areaId)) {
                areaMap.set(areaId, {
                    area_id: areaId,
                    area_name: row.area_id?.name || 'Área',
                    values: [],
                });
            }
            areaMap.get(areaId).values.push(row.final_score);
        }

        return Array.from(areaMap.values()).map((item) => {
            const finalAverage = computeAverage(item.values);
            return {
                area_id: item.area_id,
                area_name: item.area_name,
                final_average: finalAverage,
                status: finalAverage >= PASS_SCORE ? 'passed' : 'failed',
            };
        });
    }

    async getStudentOverview(userId, schoolYearId) {
        const { student, schoolYear, periods } = await this.getStudentContext(userId, schoolYearId);
        const periodIds = periods.map((period) => period._id);

        const results = await AnalyticsRepository.findPeriodAreaResults({
            student_id: student._id,
            period_id: { $in: periodIds },
        });

        const areas = this.aggregateAreaAverages(results);
        const finalResult = await AnalyticsRepository.findFinalResult(student._id, schoolYearId);
        const generalAverage = areas.length > 0
            ? computeAverage(areas.map((area) => area.final_average))
            : round2(finalResult?.final_score || 0);

        const passedAreas = areas.filter((area) => area.status === 'passed').length;
        const failedAreas = areas.filter((area) => area.status === 'failed').length;

        return {
            student_id: student._id,
            school_year: {
                _id: schoolYear._id,
                year: schoolYear.year,
                name: String(schoolYear.year),
            },
            summary: {
                general_average: generalAverage,
                passed_areas: passedAreas,
                failed_areas: failedAreas,
                final_status: finalResult?.status || (generalAverage >= PASS_SCORE ? 'passed' : 'failed'),
            },
        };
    }

    async getStudentAreas(userId, schoolYearId) {
        const { student, periods } = await this.getStudentContext(userId, schoolYearId);
        const periodIds = periods.map((period) => period._id);

        const results = await AnalyticsRepository.findPeriodAreaResults({
            student_id: student._id,
            period_id: { $in: periodIds },
        });

        return {
            areas: this.aggregateAreaAverages(results),
        };
    }

    async getStudentAreaTrend(userId, schoolYearId, areaId) {
        const { student, periods } = await this.getStudentContext(userId, schoolYearId);
        const periodIds = periods.map((period) => period._id);
        const area = await AnalyticsRepository.findAreaById(areaId);
        if (!area) {
            throw new AppError('Área no encontrada', 404);
        }

        const results = await AnalyticsRepository.findPeriodAreaResults({
            student_id: student._id,
            period_id: { $in: periodIds },
            area_id: areaId,
        });

        const rowsByPeriod = new Map();
        for (const row of results) {
            rowsByPeriod.set(toIdString(row.period_id), row.final_score);
        }

        return {
            area_id: area._id,
            area_name: area.name,
            periods: periods.map((period) => {
                const score = rowsByPeriod.get(period._id.toString()) || 0;
                return {
                    period_id: period._id,
                    period_name: period.name,
                    average: round2(score),
                    status: score >= PASS_SCORE ? 'passed' : 'failed',
                };
            }),
        };
    }

    async getStudentPeriodSummary(userId, schoolYearId) {
        const { student, periods } = await this.getStudentContext(userId, schoolYearId);
        const periodIds = periods.map((period) => period._id);

        const results = await AnalyticsRepository.findPeriodAreaResults({
            student_id: student._id,
            period_id: { $in: periodIds },
        });

        const bucket = new Map();
        for (const period of periods) {
            bucket.set(period._id.toString(), []);
        }

        for (const row of results) {
            const periodId = toIdString(row.period_id);
            if (!bucket.has(periodId)) {
                bucket.set(periodId, []);
            }
            bucket.get(periodId).push(row.final_score);
        }

        return {
            periods: periods.map((period) => {
                const values = bucket.get(period._id.toString()) || [];
                const average = computeAverage(values);
                return {
                    period_id: period._id,
                    period_name: period.name,
                    general_average: average,
                    passed_areas: values.filter((value) => value >= PASS_SCORE).length,
                    failed_areas: values.filter((value) => value < PASS_SCORE).length,
                };
            }),
        };
    }

    async getTeacherGroups(userId, schoolYearId) {
        const { teacher } = await this.getTeacherContext(userId, schoolYearId);

        const assignments = await AnalyticsRepository.findTeacherAssignmentsByYear(teacher._id, schoolYearId);

        return {
            groups: assignments.map((item) => ({
                group_id: item.group_id?._id,
                group_name: item.group_id?.name,
                grade_id: item.group_id?.grade_id?._id,
                grade_name: item.group_id?.grade_id?.name,
                area_id: item.area_id?._id,
                area_name: item.area_id?.name,
            })),
        };
    }

    buildTeacherSummaryRows(assignments, enrollmentsByGroup, periods, results, studentProfileMap) {
        const resultsByAssignment = new Map();

        for (const assignment of assignments) {
            resultsByAssignment.set(`${toIdString(assignment.group_id)}:${toIdString(assignment.area_id)}`, []);
        }

        for (const row of results) {
            const studentId = toIdString(row.student_id);
            const areaId = toIdString(row.area_id);
            for (const assignment of assignments) {
                const assignmentGroupId = toIdString(assignment.group_id);
                const assignmentAreaId = toIdString(assignment.area_id);
                if (assignmentAreaId !== areaId) continue;

                const studentIds = enrollmentsByGroup.get(assignmentGroupId) || [];
                if (studentIds.includes(studentId)) {
                    resultsByAssignment.get(`${assignmentGroupId}:${assignmentAreaId}`)?.push(row);
                }
            }
        }

        return assignments.map((assignment) => {
            const groupId = toIdString(assignment.group_id);
            const areaId = toIdString(assignment.area_id);
            const assignmentResults = resultsByAssignment.get(`${groupId}:${areaId}`) || [];
            const studentIds = enrollmentsByGroup.get(groupId) || [];

            const valuesByStudent = new Map();
            const periodValuesByStudent = new Map();

            for (const studentId of studentIds) {
                valuesByStudent.set(studentId, []);
            }
            for (const period of periods) {
                periodValuesByStudent.set(period._id.toString(), new Map());
                for (const studentId of studentIds) {
                    periodValuesByStudent.get(period._id.toString()).set(studentId, 0);
                }
            }

            for (const row of assignmentResults) {
                const studentId = toIdString(row.student_id);
                const periodId = toIdString(row.period_id);
                if (valuesByStudent.has(studentId)) {
                    valuesByStudent.get(studentId).push(row.final_score);
                }
                periodValuesByStudent.get(periodId)?.set(studentId, row.final_score);
            }

            const students = studentIds.map((studentId) => {
                const average = computeAverage(valuesByStudent.get(studentId) || []);
                const studentProfile = studentProfileMap.get(studentId) || {};
                return {
                    student_id: studentId,
                    student_name: studentProfile.full_name || 'Sin nombre',
                    student_email: studentProfile.email || null,
                    average,
                    status: average >= PASS_SCORE ? 'passed' : 'failed',
                };
            });

            const periodsSummary = periods.map((period) => {
                const values = Array.from(periodValuesByStudent.get(period._id.toString())?.values() || []);
                const passed = values.filter((value) => value >= PASS_SCORE).length;
                return {
                    period_name: period.name,
                    average: computeAverage(values),
                    passed,
                    failed: values.length - passed,
                };
            });

            const averages = students.map((student) => student.average);
            const passed = students.filter((student) => student.status === 'passed').length;

            return {
                group_id: assignment.group_id?._id,
                group_name: assignment.group_id?.name,
                grade_name: assignment.group_id?.grade_id?.name || 'Grado',
                area_id: assignment.area_id?._id,
                area_name: assignment.area_id?.name || 'Área',
                student_count: students.length,
                average: computeAverage(averages),
                passed,
                failed: students.length - passed,
                periods: periodsSummary,
                students,
            };
        });
    }

    async getTeacherDashboardSummary(userId, schoolYearId) {
        const cacheKey = `teacher-dashboard:${userId}:${schoolYearId}`;
        return summaryCache.getOrSet(cacheKey, async () => {
            const { teacher } = await this.getTeacherContext(userId, schoolYearId);
            const assignments = await AnalyticsRepository.findTeacherAssignmentsByYear(teacher._id, schoolYearId);
            const periods = await AnalyticsRepository.findPeriodsBySchoolYear(schoolYearId);

            if (!assignments.length) {
                return {
                    school_year_id: schoolYearId,
                    summary: {
                        assignment_count: 0,
                        group_count: 0,
                        student_count: 0,
                        average: 0,
                        passed: 0,
                        failed: 0,
                    },
                    groups: [],
                };
            }

            const uniqueGroupIds = [...new Set(assignments.map((assignment) => toIdString(assignment.group_id)).filter(Boolean))];
            const uniqueAreaIds = [...new Set(assignments.map((assignment) => toIdString(assignment.area_id)).filter(Boolean))];
            const enrollmentsByGroup = new Map();
            const allStudentIds = new Set();

            await Promise.all(uniqueGroupIds.map(async (groupId) => {
                const enrollments = await AnalyticsRepository.findActiveEnrollmentsByGroupAndYear(groupId, schoolYearId);
                const studentIds = enrollments.map((enrollment) => enrollment.student_id.toString());
                enrollmentsByGroup.set(groupId, studentIds);
                studentIds.forEach((studentId) => allStudentIds.add(studentId));
            }));

            const studentIds = Array.from(allStudentIds);
            const results = studentIds.length
                ? await AnalyticsRepository.findPeriodAreaResults({
                    student_id: { $in: studentIds },
                    area_id: { $in: uniqueAreaIds },
                    period_id: { $in: periods.map((period) => period._id) },
                })
                : [];
            const studentDocs = studentIds.length ? await AnalyticsRepository.findStudentsByIds(studentIds) : [];
            const studentProfileMap = buildStudentProfileMap(studentDocs);
            const groups = this.buildTeacherSummaryRows(assignments, enrollmentsByGroup, periods, results, studentProfileMap);
            const allStudents = groups.flatMap((group) => group.students);
            const passed = allStudents.filter((student) => student.status === 'passed').length;

            return {
                school_year_id: schoolYearId,
                summary: {
                    assignment_count: assignments.length,
                    group_count: uniqueGroupIds.length,
                    student_count: studentIds.length,
                    average: computeAverage(allStudents.map((student) => student.average)),
                    passed,
                    failed: allStudents.length - passed,
                },
                groups,
            };
        }, SUMMARY_CACHE_TTL_MS);
    }

    async getTeacherGroupPerformance(userId, schoolYearId, groupId, areaId, periodId = null) {
        const { teacher } = await this.getTeacherContext(userId, schoolYearId);

        const isAllowed = await AnalyticsRepository.teacherHasAssignment(teacher._id, groupId, areaId, schoolYearId);
        if (!isAllowed) {
            throw new AppError('El docente no tiene asignación para este grupo y área', 403);
        }

        const group = await AnalyticsRepository.findGroupById(groupId);
        const area = await AnalyticsRepository.findAreaById(areaId);
        if (!group || !area) {
            throw new AppError('Grupo o área no encontrada', 404);
        }

        const enrollments = await AnalyticsRepository.findActiveEnrollmentsByGroupAndYear(groupId, schoolYearId);
        const studentIds = enrollments.map((item) => item.student_id.toString());
        if (!studentIds.length) {
            return {
                group: { _id: group._id, name: group.name },
                area: { _id: area._id, name: area.name },
                summary: { student_count: 0, average: 0, passed: 0, failed: 0 },
                students: [],
            };
        }

        const periods = await AnalyticsRepository.findPeriodsBySchoolYear(schoolYearId);
        const scopedPeriodIds = periodId ? [new mongoose.Types.ObjectId(periodId)] : periods.map((p) => p._id);

        const periodResults = await AnalyticsRepository.findPeriodAreaResults({
            student_id: { $in: studentIds },
            area_id: areaId,
            period_id: { $in: scopedPeriodIds },
        });

        const valuesByStudent = new Map();
        for (const id of studentIds) valuesByStudent.set(id, []);
        for (const row of periodResults) {
            const id = toIdString(row.student_id);
            if (valuesByStudent.has(id)) {
                valuesByStudent.get(id).push(row.final_score);
            }
        }

        const studentsDocs = await AnalyticsRepository.findStudentsByIds(studentIds);
        const studentProfileMap = buildStudentProfileMap(studentsDocs);

        const students = studentIds.map((id) => {
            const avg = computeAverage(valuesByStudent.get(id));
            const studentProfile = studentProfileMap.get(id) || {};
            return {
                student_id: id,
                student_name: studentProfile.full_name || 'Sin nombre',
                student_email: studentProfile.email,
                average: avg,
                status: avg >= PASS_SCORE ? 'passed' : 'failed',
            };
        });

        const averages = students.map((row) => row.average);
        const passed = students.filter((row) => row.status === 'passed').length;

        return {
            group: { _id: group._id, name: group.name },
            area: { _id: area._id, name: area.name },
            summary: {
                student_count: students.length,
                average: computeAverage(averages),
                passed,
                failed: students.length - passed,
            },
            students,
        };
    }

    async getTeacherGroupTrend(userId, schoolYearId, groupId, areaId) {
        const { teacher } = await this.getTeacherContext(userId, schoolYearId);

        const isAllowed = await AnalyticsRepository.teacherHasAssignment(teacher._id, groupId, areaId, schoolYearId);
        if (!isAllowed) {
            throw new AppError('El docente no tiene asignación para este grupo y área', 403);
        }

        const periods = await AnalyticsRepository.findPeriodsBySchoolYear(schoolYearId);
        const enrollments = await AnalyticsRepository.findActiveEnrollmentsByGroupAndYear(groupId, schoolYearId);
        const studentIds = enrollments.map((item) => item.student_id.toString());

        const periodRows = [];

        for (const period of periods) {
            const results = await AnalyticsRepository.findPeriodAreaResults({
                period_id: period._id,
                area_id: areaId,
                student_id: { $in: studentIds },
            });

            const valuesByStudent = new Map();
            for (const id of studentIds) valuesByStudent.set(id, 0);
            for (const row of results) {
                valuesByStudent.set(toIdString(row.student_id), row.final_score);
            }

            const values = Array.from(valuesByStudent.values());
            const passed = values.filter((value) => value >= PASS_SCORE).length;

            periodRows.push({
                period_id: period._id,
                period_name: period.name,
                average: computeAverage(values),
                passed,
                failed: values.length - passed,
            });
        }

        return { periods: periodRows };
    }

    async getTeacherStudentDetail(userId, schoolYearId, studentId, areaId) {
        const { teacher } = await this.getTeacherContext(userId, schoolYearId);

        const enrollment = await AnalyticsRepository.findEnrollmentByStudentAndYear(studentId, schoolYearId);
        if (!enrollment) {
            throw new AppError('El estudiante no está matriculado en el año escolar indicado', 404);
        }

        const isAllowed = await AnalyticsRepository.teacherHasAssignment(
            teacher._id,
            enrollment.group_id,
            areaId,
            schoolYearId
        );

        if (!isAllowed) {
            throw new AppError('El docente no tiene permisos para ver este estudiante en esa área', 403);
        }

        const area = await AnalyticsRepository.findAreaById(areaId);
        if (!area) {
            throw new AppError('Área no encontrada', 404);
        }

        const periods = await AnalyticsRepository.findPeriodsBySchoolYear(schoolYearId);
        const periodIds = periods.map((period) => period._id);
        const results = await AnalyticsRepository.findPeriodAreaResults({
            student_id: studentId,
            area_id: areaId,
            period_id: { $in: periodIds },
        });

        const studentDocs = await AnalyticsRepository.findStudentsByIds([studentId]);
        const studentProfileMap = buildStudentProfileMap(studentDocs);
        const studentProfile = studentProfileMap.get(studentId.toString()) || {};

        const scoreByPeriod = new Map();
        for (const row of results) {
            scoreByPeriod.set(toIdString(row.period_id), row.final_score);
        }

        const periodRows = periods.map((period) => ({
            period_name: period.name,
            average: round2(scoreByPeriod.get(period._id.toString()) || 0),
        }));

        return {
            student: {
                _id: studentId,
                full_name: studentProfile.full_name || 'Sin nombre',
                email: studentProfile.email,
            },
            area: { _id: area._id, name: area.name },
            final_average: computeAverage(periodRows.map((row) => row.average)),
            periods: periodRows,
        };
    }

    async getAdminInstitutionOverview(schoolYearId, periodId = null) {
        await this.ensureSchoolYear(schoolYearId);

        const activeEnrollments = await AnalyticsRepository.findActiveEnrollmentsBySchoolYear(schoolYearId);
        const studentIds = [...new Set(activeEnrollments.map((row) => row.student_id.toString()))];

        if (!periodId) {
            const finals = await AnalyticsRepository.findFinalResultsByYear(schoolYearId);
            const generalAverage = computeAverage(finals.map((row) => row.final_score));
            const passed = finals.filter((row) => row.status === 'passed').length;
            const failed = finals.filter((row) => row.status === 'failed').length;
            const repeating = finals.filter((row) => row.status === 'repeating').length;

            return {
                summary: {
                    student_count: studentIds.length,
                    general_average: generalAverage,
                    passed,
                    failed,
                    repeating,
                },
            };
        }

        const results = await AnalyticsRepository.findPeriodAreaResults({
            period_id: periodId,
            student_id: { $in: studentIds },
        });

        const valuesByStudent = new Map();
        for (const id of studentIds) valuesByStudent.set(id, []);
        for (const row of results) {
            const id = toIdString(row.student_id);
            if (valuesByStudent.has(id)) {
                valuesByStudent.get(id).push(row.final_score);
            }
        }

        const studentAverages = Array.from(valuesByStudent.values()).map((values) => computeAverage(values));
        const passed = studentAverages.filter((value) => value >= PASS_SCORE).length;

        return {
            summary: {
                student_count: studentIds.length,
                general_average: computeAverage(studentAverages),
                passed,
                failed: studentIds.length - passed,
                repeating: 0,
            },
        };
    }

    async getAdminInstitutionTrend(schoolYearId) {
        await this.ensureSchoolYear(schoolYearId);
        const periods = await AnalyticsRepository.findPeriodsBySchoolYear(schoolYearId);
        const activeEnrollments = await AnalyticsRepository.findActiveEnrollmentsBySchoolYear(schoolYearId);
        const studentIds = [...new Set(activeEnrollments.map((row) => row.student_id.toString()))];

        const periodRows = [];

        for (const period of periods) {
            const results = await AnalyticsRepository.findPeriodAreaResults({
                period_id: period._id,
                student_id: { $in: studentIds },
            });

            const valuesByStudent = new Map();
            for (const id of studentIds) valuesByStudent.set(id, []);
            for (const row of results) {
                const id = toIdString(row.student_id);
                if (valuesByStudent.has(id)) {
                    valuesByStudent.get(id).push(row.final_score);
                }
            }

            const studentAverages = Array.from(valuesByStudent.values()).map((values) => computeAverage(values));
            const passed = studentAverages.filter((value) => value >= PASS_SCORE).length;

            periodRows.push({
                period_name: period.name,
                average: computeAverage(studentAverages),
                passed,
                failed: studentIds.length - passed,
            });
        }

        return { periods: periodRows };
    }

    async getAdminByGrade(schoolYearId, periodId = null) {
        await this.ensureSchoolYear(schoolYearId);

        const groups = await AnalyticsRepository.findGroupsBySchoolYear(schoolYearId);
        const gradeMap = new Map();

        for (const group of groups) {
            const gradeId = toIdString(group.grade_id);
            if (!gradeMap.has(gradeId)) {
                gradeMap.set(gradeId, {
                    grade_id: gradeId,
                    grade_name: group.grade_id?.name || 'Grado',
                    student_ids: new Set(),
                });
            }

            const enrollments = await AnalyticsRepository.findActiveEnrollmentsByGroupAndYear(group._id, schoolYearId);
            for (const enrollment of enrollments) {
                gradeMap.get(gradeId).student_ids.add(enrollment.student_id.toString());
            }
        }

        const grades = [];

        for (const item of gradeMap.values()) {
            const studentIds = Array.from(item.student_ids);
            let values = [];

            if (!periodId) {
                const finals = await Promise.all(studentIds.map((id) => AnalyticsRepository.findFinalResult(id, schoolYearId)));
                values = finals.filter(Boolean).map((row) => row.final_score);
            } else {
                const rows = await AnalyticsRepository.findPeriodAreaResults({
                    period_id: periodId,
                    student_id: { $in: studentIds },
                });

                const valuesByStudent = new Map();
                for (const id of studentIds) valuesByStudent.set(id, []);
                for (const row of rows) {
                    const id = toIdString(row.student_id);
                    valuesByStudent.get(id)?.push(row.final_score);
                }
                values = Array.from(valuesByStudent.values()).map((scores) => computeAverage(scores));
            }

            const passed = values.filter((value) => value >= PASS_SCORE).length;
            grades.push({
                grade_id: item.grade_id,
                grade_name: item.grade_name,
                average: computeAverage(values),
                passed,
                failed: values.length - passed,
            });
        }

        return { grades };
    }

    async getAdminByArea(schoolYearId, gradeId = null, periodId = null) {
        await this.ensureSchoolYear(schoolYearId);

        let studentIds = [];

        if (gradeId) {
            const groups = await AnalyticsRepository.findGroupsBySchoolYear(schoolYearId);
            const targetGroups = groups.filter((group) => toIdString(group.grade_id) === gradeId.toString());
            const ids = new Set();
            for (const group of targetGroups) {
                const enrollments = await AnalyticsRepository.findActiveEnrollmentsByGroupAndYear(group._id, schoolYearId);
                for (const enrollment of enrollments) ids.add(enrollment.student_id.toString());
            }
            studentIds = Array.from(ids);
        } else {
            const enrollments = await AnalyticsRepository.findActiveEnrollmentsBySchoolYear(schoolYearId);
            studentIds = [...new Set(enrollments.map((item) => item.student_id.toString()))];
        }

        const periods = await AnalyticsRepository.findPeriodsBySchoolYear(schoolYearId);
        const periodIds = periodId ? [periodId] : periods.map((period) => period._id);

        const rows = await AnalyticsRepository.findPeriodAreaResults({
            student_id: { $in: studentIds },
            period_id: { $in: periodIds },
        });

        const areaStudentMap = new Map();

        for (const row of rows) {
            const areaId = toIdString(row.area_id);
            const studentId = toIdString(row.student_id);
            const key = `${areaId}:${studentId}`;
            if (!areaStudentMap.has(key)) {
                areaStudentMap.set(key, {
                    area_id: areaId,
                    area_name: row.area_id?.name || 'Área',
                    values: [],
                });
            }
            areaStudentMap.get(key).values.push(row.final_score);
        }

        const areaAgg = new Map();

        for (const item of areaStudentMap.values()) {
            if (!areaAgg.has(item.area_id)) {
                areaAgg.set(item.area_id, {
                    area_id: item.area_id,
                    area_name: item.area_name,
                    values: [],
                });
            }
            areaAgg.get(item.area_id).values.push(computeAverage(item.values));
        }

        const areas = Array.from(areaAgg.values()).map((item) => {
            const avg = computeAverage(item.values);
            const passed = item.values.filter((value) => value >= PASS_SCORE).length;
            return {
                area_id: item.area_id,
                area_name: item.area_name,
                average: avg,
                passed,
                failed: item.values.length - passed,
            };
        });

        return { areas };
    }

    async getAdminGradeDetail(schoolYearId, gradeId, periodId = null) {
        await this.ensureSchoolYear(schoolYearId);

        const groups = await AnalyticsRepository.findGroupsBySchoolYear(schoolYearId);
        const gradeGroups = groups.filter((group) => toIdString(group.grade_id) === gradeId.toString());

        if (!gradeGroups.length) {
            throw new AppError('No se encontraron grupos para ese grado', 404);
        }

        const grade = {
            _id: gradeGroups[0].grade_id?._id,
            name: gradeGroups[0].grade_id?.name || 'Grado',
        };

        const groupMetrics = [];
        const allStudentIds = new Set();

        for (const group of gradeGroups) {
            const enrollments = await AnalyticsRepository.findActiveEnrollmentsByGroupAndYear(group._id, schoolYearId);
            const studentIds = enrollments.map((item) => item.student_id.toString());
            studentIds.forEach((id) => allStudentIds.add(id));

            let values = [];

            if (!periodId) {
                const finals = await Promise.all(studentIds.map((id) => AnalyticsRepository.findFinalResult(id, schoolYearId)));
                values = finals.filter(Boolean).map((row) => row.final_score);
            } else {
                const rows = await AnalyticsRepository.findPeriodAreaResults({
                    period_id: periodId,
                    student_id: { $in: studentIds },
                });
                const byStudent = new Map();
                for (const id of studentIds) byStudent.set(id, []);
                for (const row of rows) {
                    const id = toIdString(row.student_id);
                    byStudent.get(id)?.push(row.final_score);
                }
                values = Array.from(byStudent.values()).map((scores) => computeAverage(scores));
            }

            const passed = values.filter((value) => value >= PASS_SCORE).length;
            groupMetrics.push({
                group_id: group._id,
                group_name: group.name,
                average: computeAverage(values),
                passed,
                failed: values.length - passed,
            });
        }

        const areaData = await this.getAdminByArea(schoolYearId, gradeId, periodId);

        return {
            grade,
            groups: groupMetrics,
            areas: areaData.areas.map((area) => ({
                area_id: area.area_id,
                area_name: area.area_name,
                average: area.average,
            })),
        };
    }

    async getAdminDashboardSummary(schoolYearId) {
        const cacheKey = `admin-dashboard:${schoolYearId}`;
        return summaryCache.getOrSet(cacheKey, async () => {
            await this.ensureSchoolYear(schoolYearId);

            const [stats, pendingUsers, institutionOverview, institutionTrend, grades, areas] = await Promise.all([
                UserService.getStatistics(),
                UserService.getPendingUsers(),
                this.getAdminInstitutionOverview(schoolYearId),
                this.getAdminInstitutionTrend(schoolYearId),
                this.getAdminByGrade(schoolYearId),
                this.getAdminByArea(schoolYearId),
            ]);

            return {
                school_year_id: schoolYearId,
                stats,
                pending: {
                    count: pendingUsers.length,
                    users: pendingUsers.slice(0, 5),
                },
                institution_overview: institutionOverview?.summary || null,
                institution_trend: institutionTrend?.periods || [],
                institution_grades: grades?.grades || [],
                institution_areas: areas?.areas || [],
            };
        }, SUMMARY_CACHE_TTL_MS);
    }
}

export default new AnalyticsService();
