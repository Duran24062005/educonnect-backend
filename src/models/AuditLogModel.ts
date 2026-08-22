import mongoose from 'mongoose';

/**
 * AuditLog Model
 * Registro inmutable de acciones sensibles del piloto comercial.
 *
 * institution_id es opcional durante la transición al modelo multi-tenant del
 * PRD 016. No debe interpretarse como aislamiento institucional terminado.
 */
const auditLogSchema = new mongoose.Schema(
    {
        actor_user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El actor es requerido'],
        },
        actor_role: {
            type: String,
            required: [true, 'El rol del actor es requerido'],
            trim: true,
            maxlength: [30, 'Máximo 30 caracteres'],
        },
        action: {
            type: String,
            required: [true, 'La acción es requerida'],
            trim: true,
            maxlength: [100, 'Máximo 100 caracteres'],
        },
        entity_type: {
            type: String,
            required: [true, 'El tipo de entidad es requerido'],
            trim: true,
            maxlength: [100, 'Máximo 100 caracteres'],
        },
        entity_id: {
            type: String,
            required: [true, 'El identificador de entidad es requerido'],
            trim: true,
            maxlength: [100, 'Máximo 100 caracteres'],
        },
        institution_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Institution',
            default: null,
        },
        before: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        after: {
            type: mongoose.Schema.Types.Mixed,
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
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false },
    }
);

auditLogSchema.index({ institution_id: 1, created_at: -1 });
auditLogSchema.index({ actor_user_id: 1, created_at: -1 });
auditLogSchema.index({ entity_type: 1, entity_id: 1, created_at: -1 });
auditLogSchema.index({ action: 1, created_at: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
