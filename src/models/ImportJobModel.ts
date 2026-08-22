import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

const importJobSchema = new mongoose.Schema(
    {
        entity: {
            type: String,
            enum: ['students', 'guardians', 'teachers', 'grades', 'areas', 'groups', 'enrollments'],
            required: true,
        },
        file_name: { type: String, required: true, trim: true, maxlength: 255 },
        status: { type: String, enum: ['preview', 'confirmed', 'failed'], default: 'preview' },
        headers: [{ type: String }],
        records: [
            {
                row_number: { type: Number, required: true },
                data: { type: mongoose.Schema.Types.Mixed, required: true },
            },
        ],
        validation_errors: [
            {
                row_number: Number,
                field: String,
                message: String,
            },
        ],
        summary: {
            total: { type: Number, default: 0 },
            valid: { type: Number, default: 0 },
            invalid: { type: Number, default: 0 },
            created: { type: Number, default: 0 },
            updated: { type: Number, default: 0 },
        },
        created_by_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        confirmed_at: { type: Date, default: null },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

importJobSchema.index({ created_by_user_id: 1, created_at: -1 });
importJobSchema.index({ status: 1, created_at: -1 });
tenantPlugin(importJobSchema);

export default mongoose.model('ImportJob', importJobSchema);
