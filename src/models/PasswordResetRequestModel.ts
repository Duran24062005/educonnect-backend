import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

/**
 * Password reset challenge.
 *
 * The code is never stored in plain text. Requests are short-lived and become
 * invalid as soon as they are replaced, verified and consumed, or expired.
 */
const passwordResetRequestSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El usuario es requerido'],
            index: true,
        },
        code_hash: {
            type: String,
            required: [true, 'El hash del código es requerido'],
            select: false,
        },
        expires_at: {
            type: Date,
            required: [true, 'La expiración es requerida'],
        },
        attempts: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
            max: 5,
        },
        verified_at: {
            type: Date,
            default: null,
        },
        used_at: {
            type: Date,
            default: null,
        },
        invalidated_at: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// MongoDB removes expired challenges automatically.
passwordResetRequestSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
passwordResetRequestSchema.index({ user_id: 1, created_at: -1 });

tenantPlugin(passwordResetRequestSchema);

export default mongoose.model('PasswordResetRequest', passwordResetRequestSchema);
