import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

const lessonPlanSchema = new mongoose.Schema(
    {
        session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSession', required: true },
        teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
        topic: { type: String, trim: true, maxlength: 500, default: '' },
        learning_objective: { type: String, trim: true, maxlength: 2000, default: '' },
        description: { type: String, trim: true, maxlength: 5000, default: '' },
        teacher_notes: { type: String, trim: true, maxlength: 5000, default: '' },
        homework: { type: String, trim: true, maxlength: 2000, default: '' },
        status: { type: String, enum: ['draft', 'completed'], default: 'draft', index: true },
        created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

lessonPlanSchema.index({ institution_id: 1, session_id: 1 }, { unique: true });
lessonPlanSchema.index({ institution_id: 1, teacher_id: 1, status: 1, updated_at: -1 });

tenantPlugin(lessonPlanSchema);

export default mongoose.model('LessonPlan', lessonPlanSchema);
