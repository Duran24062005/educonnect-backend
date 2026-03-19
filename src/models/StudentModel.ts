import mongoose from 'mongoose';

/**
 * Student Model
 * Perfil especializado para los estudiantes de la institución
 */
const studentSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El usuario es requerido'],
            unique: true,
        },
        aula_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Aula',
            default: null,
        },
        group_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group',
            default: null,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// Índices
studentSchema.index({ group_id: 1 });
studentSchema.index({ aula_id: 1 });

export default mongoose.model('Student', studentSchema);
