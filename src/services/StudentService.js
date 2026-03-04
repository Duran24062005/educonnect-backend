import { studentRepository } from '../repositories/PersonProfileRepository.js';
import { aulaRepository } from '../repositories/AcademicRepository.js';
import { AppError } from '../utils/error.js';

class StudentService {
    async assignAula(studentId, aulaId) {
        if (!aulaId) {
            throw new AppError('El campo aula_id es requerido', 400);
        }

        const student = await studentRepository.findById(studentId);
        if (!student) {
            throw new AppError('Estudiante no encontrado', 404);
        }

        const aula = await aulaRepository.findById(aulaId);
        if (!aula) {
            throw new AppError('Aula no encontrada', 404);
        }

        const currentAulaId = student.aula_id?._id?.toString() || student.aula_id?.toString() || null;
        if (currentAulaId !== aulaId.toString()) {
            const assignedCount = await studentRepository.countByAula(aulaId);
            if (assignedCount >= aula.max_capacity) {
                throw new AppError(
                    'El aula ha alcanzado su capacidad máxima. Debes crear un nuevo grupo/aula disponible',
                    400
                );
            }
        }

        return await studentRepository.update(studentId, { aula_id: aulaId });
    }
}

export default new StudentService();
