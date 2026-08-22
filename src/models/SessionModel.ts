import mongoose from 'mongoose';

/**
 * Session Model
 * Permite revocar sesiones JWT antes de su expiración natural.
 *
 * Los tokens emitidos antes de esta migración pueden no tener jti y se
 * mantienen como legado temporal en el middleware de autenticación.
 */
const sessionSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El usuario es requerido'],
            index: true,
        },
        institution_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Institution',
            default: null,
        },
        jti: {
            type: String,
            required: [true, 'El identificador de sesión es requerido'],
            unique: true,
        },
        role: {
            type: String,
            trim: true,
            maxlength: [30, 'Máximo 30 caracteres'],
            default: null,
        },
        expires_at: {
            type: Date,
            required: [true, 'La expiración es requerida'],
        },
        revoked_at: {
            type: Date,
            default: null,
            index: true,
        },
        revoked_reason: {
            type: String,
            trim: true,
            maxlength: [200, 'Máximo 200 caracteres'],
            default: null,
        },
        last_seen_at: {
            type: Date,
            default: null,
        },
        ip_address: {
            type: String,
            trim: true,
            maxlength: [100, 'Máximo 100 caracteres'],
            default: null,
        },
        user_agent: {
            type: String,
            trim: true,
            maxlength: [1000, 'Máximo 1000 caracteres'],
            default: null,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// El registro deja de ser útil después de su expiración, sin borrar sesiones
// activas ni alterar la comprobación explícita de revoked_at.
sessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ user_id: 1, revoked_at: 1, created_at: -1 });

export default mongoose.model('Session', sessionSchema);
