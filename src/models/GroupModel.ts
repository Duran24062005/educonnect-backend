import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

/**
 * Group Model
 * Representa un grupo de estudiantes de un grado en un año escolar específico
 */
const groupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'El nombre es requerido'],
            trim: true,
            minlength: [1, 'Mínimo 1 caracter'],
            maxlength: [50, 'Máximo 50 caracteres'],
        },
        grade_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Grade',
            required: [true, 'El grado es requerido'],
        },
        school_year_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SchoolYear',
            required: [true, 'El año escolar es requerido'],
        },
        max_capacity: {
            type: Number,
            required: [true, 'La capacidad máxima es requerida'],
            min: [1, 'Mínimo 1 estudiante'],
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// Índices
groupSchema.index({ school_year_id: 1 });
groupSchema.index({ grade_id: 1 });
groupSchema.index({ school_year_id: 1, grade_id: 1 });
groupSchema.index({ school_year_id: 1, grade_id: 1, name: 1 });

tenantPlugin(groupSchema);
groupSchema.index({ institution_id: 1, school_year_id: 1, grade_id: 1, name: 1 }, { unique: true });

export default mongoose.model('Group', groupSchema);
