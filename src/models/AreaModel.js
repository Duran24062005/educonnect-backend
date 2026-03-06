import mongoose from 'mongoose';

/**
 * Area Model
 * Representa las áreas de conocimiento o asignaturas del currículo
 */
const areaSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'El nombre es requerido'],
            trim: true,
            minlength: [1, 'Mínimo 1 caracter'],
            maxlength: [100, 'Máximo 100 caracteres'],
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

areaSchema.index({ name: 1 });

export default mongoose.model('Area', areaSchema);
