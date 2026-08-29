import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

/**
 * Canonical academic assignment. The collection remains `groupteachers` so
 * existing GroupTeacher documents and integrations can be migrated safely.
 */
const teachingAssignmentSchema = new mongoose.Schema(
    {
        school_year_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolYear', default: null },
        teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
        group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
        area_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Area', required: true },
        status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'groupteachers' }
);

teachingAssignmentSchema.index({ institution_id: 1, teacher_id: 1, group_id: 1, area_id: 1 }, { unique: true });
teachingAssignmentSchema.index({ institution_id: 1, school_year_id: 1, status: 1 });
teachingAssignmentSchema.index({ institution_id: 1, group_id: 1, area_id: 1, status: 1 });

tenantPlugin(teachingAssignmentSchema);

export default mongoose.model('TeachingAssignment', teachingAssignmentSchema);
