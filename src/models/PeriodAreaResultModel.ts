import mongoose from 'mongoose';

/**
 * PeriodAreaResult Model
 * Consolida el resultado final de un estudiante en un área para un periodo específico
 */
const periodAreaResultSchema = new mongoose.Schema(
    {
        student_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: [true, 'El estudiante es requerido'],
        },
        area_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Area',
            required: [true, 'El área es requerida'],
        },
        period_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Period',
            required: [true, 'El periodo es requerido'],
        },
        final_score: {
            type: Number,
            required: [true, 'La nota final es requerida'],
            min: [0, 'Mínimo 0'],
            max: [10, 'Máximo 10'],
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// Índices
periodAreaResultSchema.index({ student_id: 1 });
// Resultado único por combinación estudiante + área + periodo
periodAreaResultSchema.index({ student_id: 1, area_id: 1, period_id: 1 }, { unique: true });
periodAreaResultSchema.index({ period_id: 1, area_id: 1 });

export default mongoose.model('PeriodAreaResult', periodAreaResultSchema);