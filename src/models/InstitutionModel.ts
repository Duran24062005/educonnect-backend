import mongoose from 'mongoose';

/**
 * Institution Model
 * Contexto institucional mínimo para iniciar el piloto en sandbox.
 * La propagación obligatoria a todos los dominios académicos pertenece al
 * siguiente corte del PRD 016.
 */
const institutionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'El nombre de la institución es requerido'],
            trim: true,
            minlength: [3, 'Mínimo 3 caracteres'],
            maxlength: [200, 'Máximo 200 caracteres'],
        },
        code: {
            type: String,
            required: [true, 'El código de la institución es requerido'],
            unique: true,
            uppercase: true,
            trim: true,
            match: [/^[A-Z0-9-]+$/, 'El código solo puede contener letras, números y guiones'],
            minlength: [3, 'Mínimo 3 caracteres'],
            maxlength: [40, 'Máximo 40 caracteres'],
        },
        type: {
            type: String,
            enum: ['private', 'public'],
            required: [true, 'El tipo de institución es requerido'],
        },
        status: {
            type: String,
            enum: ['sandbox', 'active', 'suspended', 'archived'],
            default: 'sandbox',
            index: true,
        },
        max_students: {
            type: Number,
            min: [1, 'Debe existir al menos un estudiante'],
            max: [800, 'El piloto comercial admite máximo 800 estudiantes'],
            default: 800,
        },
        timezone: {
            type: String,
            default: 'America/Bogota',
            trim: true,
        },
        created_by_user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El creador es requerido'],
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

institutionSchema.index({ status: 1, created_at: -1 });

export default mongoose.model('Institution', institutionSchema);
