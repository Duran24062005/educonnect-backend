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
        school_days: {
            type: [Number],
            default: [1, 2, 3, 4, 5],
            validate: {
                validator: (days: number[]) => days.length > 0 && new Set(days).size === days.length && days.every((day) => Number.isInteger(day) && day >= 1 && day <= 7),
                message: 'Los días lectivos deben ser únicos y estar entre 1 y 7',
            },
        },
        created_by_user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El creador es requerido'],
        },
        primary_admin_user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        // En colegios públicos, el primer administrador también representa al rector.
        // Se mantiene separado del rol técnico de User/Person para no mezclar permisos
        // de plataforma con cargos propios de la institución.
        rector_user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

institutionSchema.index({ status: 1, created_at: -1 });
institutionSchema.index({ primary_admin_user_id: 1 }, { unique: true, sparse: true });
institutionSchema.index({ rector_user_id: 1 }, { unique: true, sparse: true });

export default mongoose.model('Institution', institutionSchema);
