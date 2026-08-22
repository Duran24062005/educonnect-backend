import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

/**
 * FinalResult Model
 * Almacena el resultado final del año escolar de un estudiante
 */
const finalResultSchema = new mongoose.Schema(
    {
        student_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: [true, 'El estudiante es requerido'],
        },
        school_year_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SchoolYear',
            required: [true, 'El año escolar es requerido'],
        },
        final_score: {
            type: Number,
            required: [true, 'La nota final es requerida'],
            min: [0, 'Mínimo 0'],
            max: [100, 'Máximo 100; la escala institucional se valida por año escolar'],
        },
        status: {
            type: String,
            enum: ['passed', 'failed', 'repeating'],
            required: [true, 'El estado es requerido'],
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// Índices
// Un resultado final único por estudiante y año escolar
finalResultSchema.index({ student_id: 1, school_year_id: 1 });
finalResultSchema.index({ school_year_id: 1, status: 1 });

tenantPlugin(finalResultSchema);
finalResultSchema.index({ institution_id: 1, student_id: 1, school_year_id: 1 }, { unique: true });

export default mongoose.model('FinalResult', finalResultSchema);
