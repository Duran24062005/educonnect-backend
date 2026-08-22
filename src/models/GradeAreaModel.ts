import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

/**
 * GradeArea Model
 * Tabla de relación: vincula grados con áreas y define horas semanales
 */
const gradeAreaSchema = new mongoose.Schema(
    {
        grade_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Grade',
            required: [true, 'El grado es requerido'],
        },
        area_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Area',
            required: [true, 'El área es requerida'],
        },
        weekly_hours: {
            type: Number,
            required: [true, 'Las horas semanales son requeridas'],
            min: [1, 'Mínimo 1 hora semanal'],
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// Índices - combinación única
gradeAreaSchema.index({ grade_id: 1, area_id: 1 });
gradeAreaSchema.index({ area_id: 1 });

tenantPlugin(gradeAreaSchema);
gradeAreaSchema.index({ institution_id: 1, grade_id: 1, area_id: 1 }, { unique: true });

export default mongoose.model('GradeArea', gradeAreaSchema);
