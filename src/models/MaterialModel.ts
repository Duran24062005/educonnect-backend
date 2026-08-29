import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

const materialSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, minlength: 1, maxlength: 180 },
        description: { type: String, trim: true, maxlength: 1000, default: null },
        session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSession', required: true },
        teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
        material_type: { type: String, enum: ['file', 'link'], required: true },
        link_url: { type: String, trim: true, default: null },
        file_url: { type: String, default: null },
        original_name: { type: String, trim: true, maxlength: 500, default: null },
        mime_type: { type: String, trim: true, maxlength: 200, default: null },
        size_bytes: { type: Number, min: 0, default: 0 },
        storage_provider: { type: String, default: null },
        storage_bucket: { type: String, default: null },
        storage_key: { type: String, default: null },
        storage_signed_url: { type: String, default: null },
        storage_signed_url_expires_at: { type: Date, default: null },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

materialSchema.index({ session_id: 1, created_at: -1 });
materialSchema.index({ teacher_id: 1, created_at: -1 });
materialSchema.index({ institution_id: 1, session_id: 1, created_at: -1 });

tenantPlugin(materialSchema);

export default mongoose.model('Material', materialSchema);
