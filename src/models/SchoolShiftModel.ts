import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

const schoolShiftSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
        code: { type: String, required: true, uppercase: true, trim: true, minlength: 2, maxlength: 30 },
        start_time: { type: String, required: true, match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inicial inválida'] },
        end_time: { type: String, required: true, match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora final inválida'] },
        status: { type: String, enum: ['active', 'inactive'], default: 'active' },
        created_by_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

schoolShiftSchema.index({ institution_id: 1, code: 1 }, { unique: true });
tenantPlugin(schoolShiftSchema);

export default mongoose.model('SchoolShift', schoolShiftSchema);
