import mongoose from 'mongoose';

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
teacherSchema.index({ user_id: 1 }, { unique: true });
teacherSchema.index({ area: 1 });

export default mongoose.model('Teacher', teacherSchema);