import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

/**
 * Grade Model
 * Representa los grados académicos de la institución (ej: 10°, 11°)
 */
const gradeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'El nombre es requerido'],
            trim: true,
            minlength: [1, 'Mínimo 1 caracter'],
            maxlength: [100, 'Máximo 100 caracteres'],
        },
        level: {
            type: String,
            trim: true,
            maxlength: [50, 'Máximo 50 caracteres'],
            default: null,
        },
        description: {
            type: String,
            trim: true,
            maxlength: [300, 'Máximo 300 caracteres'],
            default: null,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

gradeSchema.index({ name: 1 });
gradeSchema.index({ level: 1, name: 1 });

tenantPlugin(gradeSchema);

export default mongoose.model('Grade', gradeSchema);
