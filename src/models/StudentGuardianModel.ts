import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

const studentGuardianSchema = new mongoose.Schema(
    {
        student_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: [true, 'El estudiante es requerido'],
        },
        guardian_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El acudiente es requerido'],
        },
        relationship: {
            type: String,
            enum: ['mother', 'father', 'guardian', 'other'],
            default: 'guardian',
        },
        is_authorized: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

studentGuardianSchema.index({ institution_id: 1, guardian_id: 1, is_authorized: 1 });
studentGuardianSchema.index({ institution_id: 1, student_id: 1, guardian_id: 1 }, { unique: true });

tenantPlugin(studentGuardianSchema);

export default mongoose.model('StudentGuardian', studentGuardianSchema);
