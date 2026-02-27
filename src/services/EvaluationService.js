import {
    gradeItemRepository,
    studentGradeRepository,
    periodAreaResultRepository,
    finalResultRepository,
    enrollmentRepository,
} from '../repositories/EvaluationRepository.js';
import { periodRepository, areaRepository } from '../repositories/AcademicRepository.js';
import { studentRepository } from '../repositories/PersonProfileRepository.js';
import { AppError } from '../utils/error.js';

/**
 * EvaluationService
 * Lógica de negocio para evaluaciones y calificaciones
 */
class EvaluationService {
    // ===========================
    // GRADE ITEMS (Ítems de evaluación)
    // ===========================

    async createGradeItem(data) {
        const { name, percentage, area_id, period_id } = data;

        if (!name || percentage === undefined || !area_id || !period_id) {
            throw new AppError('Nombre, porcentaje, área y periodo son requeridos', 400);
        }

        if (percentage < 0 || percentage > 100) {
            throw new AppError('El porcentaje debe estar entre 0 y 100', 400);
        }

        const period = await periodRepository.findById(period_id);
        if (!period) throw new AppError('Periodo no encontrado', 404);

        const area = await areaRepository.findById(area_id);
        if (!area) throw new AppError('Área no encontrada', 404);

        // Verificar que los porcentajes no superen 100%
        const currentTotal = await gradeItemRepository.sumPercentageByPeriodAndArea(period_id, area_id);
        if (currentTotal + percentage > 100.001) {
            throw new AppError(
                `Los porcentajes de esta área en este periodo ya suman ${currentTotal.toFixed(1)}%. No se puede agregar ${percentage}%`,
                400
            );
        }

        return await gradeItemRepository.create({ name, percentage, area_id, period_id });
    }

    async getGradeItemsByPeriodAndArea(period_id, area_id) {
        return await gradeItemRepository.findByPeriodAndArea(period_id, area_id);
    }

    async updateGradeItem(id, data) {
        const item = await gradeItemRepository.findById(id);
        if (!item) throw new AppError('Ítem de evaluación no encontrado', 404);

        if (data.percentage !== undefined) {
            const currentTotal = await gradeItemRepository.sumPercentageByPeriodAndArea(
                item.period_id._id || item.period_id,
                item.area_id._id || item.area_id,
                id
            );
            if (currentTotal + data.percentage > 100.001) {
                throw new AppError(
                    `Los porcentajes superarían el 100%. Total actual (sin este ítem): ${currentTotal.toFixed(1)}%`,
                    400
                );
            }
        }

        return await gradeItemRepository.update(id, data);
    }

    async deleteGradeItem(id) {
        const item = await gradeItemRepository.findById(id);
        if (!item) throw new AppError('Ítem de evaluación no encontrado', 404);
        await gradeItemRepository.delete(id);
        return { message: 'Ítem de evaluación eliminado' };
    }

    // ===========================
    // STUDENT GRADES (Calificaciones)
    // ===========================

    async registerScore(student_id, grade_item_id, score) {
        if (score === undefined || score === null) {
            throw new AppError('La calificación es requerida', 400);
        }

        if (score < 0 || score > 10) {
            throw new AppError('La calificación debe estar entre 0 y 10', 400);
        }

        const student = await studentRepository.findById(student_id);
        if (!student) throw new AppError('Estudiante no encontrado', 404);

        const item = await gradeItemRepository.findById(grade_item_id);
        if (!item) throw new AppError('Ítem de evaluación no encontrado', 404);

        return await studentGradeRepository.upsert(student_id, grade_item_id, score);
    }

    async getScoresByStudent(student_id) {
        return await studentGradeRepository.findByStudent(student_id);
    }

    async getScoresByGradeItem(grade_item_id) {
        return await studentGradeRepository.findByGradeItem(grade_item_id);
    }

    // ===========================
    // PERIOD AREA RESULTS (Resultados consolidados por periodo)
    // ===========================

    /**
     * Calcular y guardar el resultado de un estudiante en un área por periodo
     * Se calcula automáticamente desde las calificaciones de los ítems
     */
    async calculateAndSavePeriodResult(student_id, area_id, period_id) {
        const items = await gradeItemRepository.findByPeriodAndArea(period_id, area_id);
        if (items.length === 0) {
            throw new AppError('No hay ítems de evaluación para este periodo y área', 404);
        }

        let weightedScore = 0;
        let totalPercentage = 0;

        for (const item of items) {
            const scoreDoc = await studentGradeRepository.findByStudentAndItem(student_id, item._id);
            if (scoreDoc) {
                weightedScore += (scoreDoc.score * item.percentage) / 100;
                totalPercentage += item.percentage;
            }
        }

        if (totalPercentage === 0) {
            throw new AppError('El estudiante no tiene calificaciones en este periodo y área', 400);
        }

        // Escalar al porcentaje evaluado
        const final_score = totalPercentage < 100
            ? (weightedScore / totalPercentage) * 100
            : weightedScore;

        return await periodAreaResultRepository.upsert(student_id, area_id, period_id, parseFloat(final_score.toFixed(2)));
    }

    async getPeriodResultsByStudent(student_id) {
        return await periodAreaResultRepository.findByStudent(student_id);
    }

    // ===========================
    // FINAL RESULTS (Resultado del año)
    // ===========================

    /**
     * Calcular el resultado final del año para un estudiante
     * Promedia todos sus resultados por periodo (ponderados por el peso del periodo)
     */
    async calculateAndSaveFinalResult(student_id, school_year_id) {
        const { periodRepository: pr } = await import('../repositories/AcademicRepository.js');
        const periods = await pr.findBySchoolYear(school_year_id);

        if (periods.length === 0) {
            throw new AppError('No hay periodos para este año escolar', 404);
        }

        const periodResults = await periodAreaResultRepository.findByStudent(student_id);
        if (periodResults.length === 0) {
            throw new AppError('El estudiante no tiene resultados de periodo registrados', 400);
        }

        let weightedTotal = 0;
        let totalWeight = 0;

        for (const period of periods) {
            const periodStudentResults = periodResults.filter(
                r => r.period_id._id?.toString() === period._id.toString() ||
                     r.period_id.toString() === period._id.toString()
            );

            if (periodStudentResults.length > 0) {
                const avgPeriod = periodStudentResults.reduce((sum, r) => sum + r.final_score, 0) / periodStudentResults.length;
                weightedTotal += avgPeriod * period.weight;
                totalWeight += period.weight;
            }
        }

        if (totalWeight === 0) {
            throw new AppError('No se puede calcular el promedio: sin datos suficientes', 400);
        }

        const final_score = parseFloat((weightedTotal / totalWeight).toFixed(2));
        // En Colombia, aprobado >= 3.0 en escala de 5, adaptamos: >= 6 en escala de 10
        const status = final_score >= 6 ? 'passed' : 'failed';

        return await finalResultRepository.upsert(student_id, school_year_id, final_score, status);
    }

    async getFinalResultsByYear(school_year_id, status = null) {
        return await finalResultRepository.findByYear(school_year_id, status);
    }

    async getStudentFinalResult(student_id, school_year_id) {
        const result = await finalResultRepository.findByStudentAndYear(student_id, school_year_id);
        if (!result) throw new AppError('Resultado final no encontrado', 404);
        return result;
    }

    // ===========================
    // ESTADÍSTICAS
    // ===========================

    async getYearStats(school_year_id) {
        const passed = await finalResultRepository.countByYearAndStatus(school_year_id, 'passed');
        const failed = await finalResultRepository.countByYearAndStatus(school_year_id, 'failed');
        const repeating = await finalResultRepository.countByYearAndStatus(school_year_id, 'repeating');

        return {
            school_year_id,
            passed,
            failed,
            repeating,
            total: passed + failed + repeating,
        };
    }
}

export default new EvaluationService();