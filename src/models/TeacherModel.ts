import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

/**
 * Teacher Model
 * Perfil especializado para los docentes del sistema
 */
const teacherSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El usuario es requerido'],
            unique: true,
        },
        area: {
            type: String,
            trim: true,
            maxlength: [100, 'Máximo 100 caracteres'],
            default: null,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// Índices
teacherSchema.index({ area: 1 });

tenantPlugin(teacherSchema);

export default mongoose.model('Teacher', teacherSchema);
