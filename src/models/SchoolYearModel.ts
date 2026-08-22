import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

/**
 * SchoolYear Model
 * Representa el año o ciclo académico de la institución
 */
const schoolYearSchema = new mongoose.Schema(
    {
        year: {
            type: Number,
            required: [true, 'El año es requerido'],
            min: [2000, 'Año mínimo: 2000'],
            max: [2100, 'Año máximo: 2100'],
        },
        start_date: {
            type: Date,
            required: [true, 'La fecha de inicio es requerida'],
        },
        end_date: {
            type: Date,
            required: [true, 'La fecha de fin es requerida'],
        },
        is_active: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// Índices
schoolYearSchema.index({ is_active: 1 });

tenantPlugin(schoolYearSchema);
schoolYearSchema.index({ institution_id: 1, year: 1 }, { unique: true });

export default mongoose.model('SchoolYear', schoolYearSchema);
