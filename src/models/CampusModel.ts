import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

const campusSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
        code: { type: String, required: true, uppercase: true, trim: true, minlength: 2, maxlength: 30 },
        address: { type: String, trim: true, maxlength: 250, default: null },
        status: { type: String, enum: ['active', 'inactive'], default: 'active' },
        created_by_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

campusSchema.index({ institution_id: 1, code: 1 }, { unique: true });
tenantPlugin(campusSchema);

export default mongoose.model('Campus', campusSchema);
