import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

/**
 * Aula Model
 * Representa los espacios físicos o virtuales donde se imparten las clases
 */
const aulaSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'El nombre es requerido'],
            trim: true,
            minlength: [1, 'Mínimo 1 caracter'],
            maxlength: [50, 'Máximo 50 caracteres'],
        },
        max_capacity: {
            type: Number,
            required: [true, 'La capacidad máxima es requerida'],
            min: [1, 'Mínimo 1 persona'],
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

tenantPlugin(aulaSchema);

export default mongoose.model('Aula', aulaSchema);
