import {
    schoolYearRepository,
    periodRepository,
    gradeRepository,
    areaRepository,
    aulaRepository,
} from '../repositories/AcademicRepository.js';
import { groupRepository, studentRepository } from '../repositories/PersonProfileRepository.js';
import { enrollmentRepository, finalResultRepository } from '../repositories/EvaluationRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import PersonRepository from '../repositories/PersonRepository.js';
import { AppError } from '../utils/error.js';

/**
 * AcademicService
 * Lógica de negocio para entidades académicas estructurales
 */
class AcademicService {
    parseGradeNumber(grade) {
        const raw = `${grade?.level ?? ''} ${grade?.name ?? ''}`.trim();
        const match = raw.match(/\b([0-9]{1,2})\b/);
        if (!match) return null;
        const number = Number(match[1]);
        return Number.isInteger(number) && number >= 0 && number <= 11 ? number : null;
    }

    async findTargetGroup(gradeId, schoolYearId) {
        const groups = await groupRepository.findByGradeAndYear(gradeId, schoolYearId);
        if (!groups.length) return null;

        for (const group of groups) {
            const currentCount = await enrollmentRepository.countActiveByGroup(group._id);
            if (currentCount < group.max_capacity) {
                return group;
            }
        }

        return null;
    }

    // ===========================
    // SCHOOL YEARS
    // ===========================

    async createSchoolYear(data) {
        const { year, start_date, end_date, is_active = false } = data;

        if (!year || !start_date || !end_date) {
            throw new AppError('Año, fecha de inicio y fin son requeridos', 400);
        }

        if (year < 2000 || year > 2100) {
            throw new AppError('Año debe estar entre 2000 y 2100', 400);
        }

        if (new Date(start_date) >= new Date(end_date)) {
            throw new AppError('La fecha de inicio debe ser antes que la fecha de fin', 400);
        }

        if (await schoolYearRepository.yearExists(year)) {
            throw new AppError(`Ya existe un año escolar para ${year}`, 400);
        }

        return await schoolYearRepository.create({ year, start_date, end_date, is_active });
    }

    async getAllSchoolYears() {
        return await schoolYearRepository.findAll();
    }

    async getActiveSchoolYear() {
        const sy = await schoolYearRepository.findActive();
        if (!sy) throw new AppError('No hay un año escolar activo', 404);
        return sy;
    }

    async setActiveSchoolYear(id) {
        // Solo un año puede estar activo a la vez
        const all = await schoolYearRepository.findAll();
        for (const sy of all) {
            if (sy.is_active) {
                await schoolYearRepository.update(sy._id, { is_active: false });
            }
        }
        return await schoolYearRepository.update(id, { is_active: true });
    }

    async deleteSchoolYear(id) {
        const sy = await schoolYearRepository.findById(id);
        if (!sy) throw new AppError('Año escolar no encontrado', 404);
        if (sy.is_active) throw new AppError('No se puede eliminar el año escolar activo', 400);
        await schoolYearRepository.delete(id);
        return { message: 'Año escolar eliminado' };
    }

    async promoteStudents(data) {
        const { from_school_year_id, to_school_year_id } = data || {};

        if (!from_school_year_id || !to_school_year_id) {
            throw new AppError('Año escolar origen y destino son requeridos', 400);
        }

        if (from_school_year_id === to_school_year_id) {
            throw new AppError('El año escolar origen y destino deben ser distintos', 400);
        }

        const sourceYear = await schoolYearRepository.findById(from_school_year_id);
        if (!sourceYear) throw new AppError('Año escolar origen no encontrado', 404);

        const targetYear = await schoolYearRepository.findById(to_school_year_id);
        if (!targetYear) throw new AppError('Año escolar destino no encontrado', 404);

        const activeEnrollments = await enrollmentRepository.findBySchoolYear(from_school_year_id, 'active');
        if (!activeEnrollments.length) {
            throw new AppError('No hay matrículas activas en el año escolar origen', 400);
        }

        const grades = await gradeRepository.findAll();
        const gradeByNumber = new Map();
        for (const grade of grades) {
            const num = this.parseGradeNumber(grade);
            if (num !== null) gradeByNumber.set(num, grade);
        }

        const actions = [];
        const errors = [];

        for (const enrollment of activeEnrollments) {
            const studentId = enrollment.student_id?._id || enrollment.student_id;
            const groupId = enrollment.group_id?._id || enrollment.group_id;

            const finalResult = await finalResultRepository.findByStudentAndYear(studentId, from_school_year_id);
            if (!finalResult) {
                errors.push({
                    student_id: studentId,
                    issue: 'Falta resultado final del año origen',
                });
                continue;
            }

            const group = await groupRepository.findById(groupId);
            if (!group?.grade_id) {
                errors.push({
                    student_id: studentId,
                    issue: 'No se pudo determinar el grado actual del estudiante',
                });
                continue;
            }

            const gradeNumber = this.parseGradeNumber(group.grade_id);
            if (gradeNumber === null) {
                errors.push({
                    student_id: studentId,
                    issue: `El grado actual no es válido para promoción automática (${group.grade_id?.name || 'sin nombre'})`,
                });
                continue;
            }

            if (finalResult.status === 'repeating') {
                actions.push({
                    type: 'manual_review',
                    enrollment_id: enrollment._id,
                    student_id: studentId,
                    reason: 'Estado repeating requiere decisión manual del admin',
                });
                continue;
            }

            let targetGradeNumber = gradeNumber;
            if (finalResult.status === 'passed') {
                targetGradeNumber = gradeNumber + 1;
            } else if (finalResult.status !== 'failed') {
                errors.push({
                    student_id: studentId,
                    issue: `Estado final no soportado: ${finalResult.status}`,
                });
                continue;
            }

            if (targetGradeNumber > 11 && finalResult.status === 'passed') {
                actions.push({
                    type: 'graduate',
                    enrollment_id: enrollment._id,
                    student_id: studentId,
                });
                continue;
            }

            const targetGrade = gradeByNumber.get(targetGradeNumber);
            if (!targetGrade) {
                errors.push({
                    student_id: studentId,
                    issue: `No existe configuración de grado ${targetGradeNumber} en el sistema`,
                });
                continue;
            }

            const targetGroup = await this.findTargetGroup(targetGrade._id, to_school_year_id);
            if (!targetGroup) {
                errors.push({
                    student_id: studentId,
                    issue: `No hay cupo en grupos del grado ${targetGradeNumber} para el año destino`,
                });
                continue;
            }

            actions.push({
                type: 'promote',
                enrollment_id: enrollment._id,
                student_id: studentId,
                target_group_id: targetGroup._id,
                target_grade_number: targetGradeNumber,
                final_status: finalResult.status,
            });
        }

        if (errors.length) {
            const preview = errors
                .slice(0, 5)
                .map(e => `${e.student_id}: ${e.issue}`)
                .join(' | ');
            throw new AppError(
                `No se pudo ejecutar la promoción masiva por inconsistencias (${errors.length}). ${preview}`,
                400
            );
        }

        let promoted = 0;
        let repeated = 0;
        let graduated = 0;
        let manual_review = 0;

        for (const action of actions) {
            if (action.type === 'manual_review') {
                manual_review += 1;
                continue;
            }

            const enrollment = await enrollmentRepository.findById(action.enrollment_id);
            if (!enrollment) continue;

            if (action.type === 'graduate') {
                const student = await studentRepository.findById(action.student_id);
                if (!student) continue;

                const user = await UserRepository.findById(student.user_id?._id || student.user_id);
                if (!user?.person_id?._id) {
                    throw new AppError('No se encontró person_id para actualizar estado de egresado', 400);
                }

                await PersonRepository.update(user.person_id._id, { status: 'egresado' });
                await enrollmentRepository.update(enrollment._id, { status: 'retired', closed_at: new Date() });
                await studentRepository.update(action.student_id, { group_id: null, aula_id: null });
                graduated += 1;
                continue;
            }

            await enrollmentRepository.update(enrollment._id, { status: 'retired', closed_at: new Date() });
            await enrollmentRepository.create({
                student_id: action.student_id,
                school_year_id: to_school_year_id,
                group_id: action.target_group_id,
                status: 'active',
                previous_enrollment_id: enrollment._id,
                transfer_reason: action.final_status === 'failed'
                    ? 'Repite grado en nuevo año escolar'
                    : 'Promoción automática anual',
            });
            await studentRepository.update(action.student_id, { group_id: action.target_group_id });

            if (action.final_status === 'failed') repeated += 1;
            else promoted += 1;
        }

        return {
            from_school_year_id,
            to_school_year_id,
            summary: {
                promoted,
                repeated,
                graduated,
                manual_review,
                processed: actions.length,
            },
            manual_cases: actions
                .filter(a => a.type === 'manual_review')
                .map(a => ({ student_id: a.student_id, reason: a.reason })),
        };
    }

    // ===========================
    // PERIODS
    // ===========================

    async createPeriod(data) {
        const { school_year_id, name, weight, start_date, end_date } = data;

        if (!school_year_id || !name || weight === undefined || !start_date || !end_date) {
            throw new AppError('Todos los campos del periodo son requeridos', 400);
        }

        if (weight < 0 || weight > 1) {
            throw new AppError('El peso debe ser un valor entre 0 y 1 (decimal)', 400);
        }

        if (new Date(start_date) >= new Date(end_date)) {
            throw new AppError('La fecha de inicio debe ser antes que la de fin', 400);
        }

        // Verificar que los pesos de todos los periodos del año no superen 1.0
        const existing = await periodRepository.findBySchoolYear(school_year_id);
        const totalWeight = existing.reduce((sum, p) => sum + p.weight, 0);
        if (totalWeight + weight > 1.0001) {
            throw new AppError(
                `El peso total de los periodos no puede superar 1. Peso actual: ${totalWeight.toFixed(2)}, intentando agregar: ${weight}`,
                400
            );
        }

        return await periodRepository.create({ school_year_id, name, weight, start_date, end_date });
    }

    async getPeriodsBySchoolYear(school_year_id) {
        return await periodRepository.findBySchoolYear(school_year_id);
    }

    async deletePeriod(id) {
        const p = await periodRepository.findById(id);
        if (!p) throw new AppError('Periodo no encontrado', 404);
        await periodRepository.delete(id);
        return { message: 'Periodo eliminado' };
    }

    // ===========================
    // GRADES
    // ===========================

    async createGrade(data) {
        const { name, level, description } = data;
        if (!name) throw new AppError('El nombre del grado es requerido', 400);
        return await gradeRepository.create({ name, level, description });
    }

    async getAllGrades() {
        return await gradeRepository.findAll();
    }

    async updateGrade(id, data) {
        const grade = await gradeRepository.findById(id);
        if (!grade) throw new AppError('Grado no encontrado', 404);
        return await gradeRepository.update(id, data);
    }

    async deleteGrade(id) {
        const grade = await gradeRepository.findById(id);
        if (!grade) throw new AppError('Grado no encontrado', 404);
        await gradeRepository.delete(id);
        return { message: 'Grado eliminado' };
    }

    // ===========================
    // AREAS
    // ===========================

    async createArea(data) {
        const { name, description } = data;
        if (!name) throw new AppError('El nombre del área es requerido', 400);
        return await areaRepository.create({ name, description });
    }

    async getAllAreas() {
        return await areaRepository.findAll();
    }

    async updateArea(id, data) {
        const area = await areaRepository.findById(id);
        if (!area) throw new AppError('Área no encontrada', 404);
        return await areaRepository.update(id, data);
    }

    async deleteArea(id) {
        const area = await areaRepository.findById(id);
        if (!area) throw new AppError('Área no encontrada', 404);
        await areaRepository.delete(id);
        return { message: 'Área eliminada' };
    }

    // ===========================
    // AULAS
    // ===========================

    async createAula(data) {
        const { name, max_capacity } = data;
        if (!name || !max_capacity) throw new AppError('Nombre y capacidad son requeridos', 400);
        if (max_capacity < 1) throw new AppError('La capacidad debe ser mayor a 0', 400);
        return await aulaRepository.create({ name, max_capacity });
    }

    async getAllAulas() {
        return await aulaRepository.findAll();
    }

    async updateAula(id, data) {
        const aula = await aulaRepository.findById(id);
        if (!aula) throw new AppError('Aula no encontrada', 404);
        return await aulaRepository.update(id, data);
    }

    async deleteAula(id) {
        const aula = await aulaRepository.findById(id);
        if (!aula) throw new AppError('Aula no encontrada', 404);
        await aulaRepository.delete(id);
        return { message: 'Aula eliminada' };
    }
}

export default new AcademicService();
