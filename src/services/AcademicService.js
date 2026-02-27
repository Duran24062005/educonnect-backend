import {
    schoolYearRepository,
    periodRepository,
    gradeRepository,
    areaRepository,
    aulaRepository,
} from '../repositories/AcademicRepository.js';
import { AppError } from '../utils/error.js';

/**
 * AcademicService
 * Lógica de negocio para entidades académicas estructurales
 */
class AcademicService {
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