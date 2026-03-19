import { asyncHandler } from '../utils/error.js';
import StudentService from '../services/StudentService.js';

class StudentController {
    assignAula = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { aula_id } = req.body || {};

        const result = await StudentService.assignAula(String(id), String(aula_id || ''));

        res.status(200).json({
            status: 'success',
            message: 'Aula asignada exitosamente',
            data: result,
        });
    });
}

export default new StudentController();
