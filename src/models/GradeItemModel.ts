import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

/**
 * GradeItem Model
 * Define los ítems de evaluación dentro de un área y periodo
 */
const gradeItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'El nombre es requerido'],
            trim: true,
            minlength: [1, 'Mínimo 1 caracter'],
            maxlength: [150, 'Máximo 150 caracteres'],
        },
        percentage: {
            type: Number,
            required: [true, 'El porcentaje es requerido'],
            min: [0, 'Mínimo 0%'],
            max: [100, 'Máximo 100%'],
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
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// Índices
gradeItemSchema.index({ area_id: 1, period_id: 1 });
gradeItemSchema.index({ period_id: 1 });

tenantPlugin(gradeItemSchema);

export default mongoose.model('GradeItem', gradeItemSchema);
