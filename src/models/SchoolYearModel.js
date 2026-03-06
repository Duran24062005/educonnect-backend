import mongoose from 'mongoose';

/**
 * SchoolYear Model
 * Representa el año o ciclo académico de la institución
 */
const schoolYearSchema = new mongoose.Schema(
    {
        year: {
            type: Number,
            required: [true, 'El año es requerido'],
            unique: true,
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

export default mongoose.model('SchoolYear', schoolYearSchema);
