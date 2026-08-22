import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

/**
 * StudentGrade Model
 * Registra la calificación de un estudiante en un ítem de evaluación específico
 */
const studentGradeSchema = new mongoose.Schema(
    {
        student_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: [true, 'El estudiante es requerido'],
        },
        grade_item_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GradeItem',
            required: [true, 'El ítem de evaluación es requerido'],
        },
        score: {
            type: Number,
            required: [true, 'La calificación es requerida'],
            min: [0, 'Mínimo 0'],
            max: [100, 'Máximo 100; la escala institucional se valida por año escolar'],
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// Índices
studentGradeSchema.index({ student_id: 1 });
studentGradeSchema.index({ grade_item_id: 1 });
// Un estudiante solo puede tener una calificación por ítem
studentGradeSchema.index({ student_id: 1, grade_item_id: 1 });

tenantPlugin(studentGradeSchema);
studentGradeSchema.index({ institution_id: 1, student_id: 1, grade_item_id: 1 }, { unique: true });

export default mongoose.model('StudentGrade', studentGradeSchema);
