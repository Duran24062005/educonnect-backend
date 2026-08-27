import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

const scheduleChangeRequestSchema = new mongoose.Schema(
    {
        request_type: { type: String, enum: ['occurrence', 'permanent'], required: true },
        status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending', index: true },
        requester_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
        schedule_id: { type: mongoose.Schema.Types.ObjectId, ref: 'WeeklySchedule', required: true },
        slot_id: { type: String, required: true, trim: true },
        class_session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSession', default: null },
        occurrence_date: { type: Date, default: null },
        proposed: {
            weekday: { type: Number, min: 1, max: 7, default: null },
            date: { type: Date, default: null },
            start_time: { type: String, default: null },
            end_time: { type: String, default: null },
            aula_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Aula', default: null },
        },
        reason: { type: String, required: true, trim: true, maxlength: 1000 },
        review_comment: { type: String, trim: true, maxlength: 1000, default: null },
        reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        reviewed_at: { type: Date, default: null },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

scheduleChangeRequestSchema.index({ institution_id: 1, status: 1, created_at: -1 });
scheduleChangeRequestSchema.index({ requester_user_id: 1, created_at: -1 });
scheduleChangeRequestSchema.index({ schedule_id: 1, slot_id: 1, status: 1 });
tenantPlugin(scheduleChangeRequestSchema);

export default mongoose.model('ScheduleChangeRequest', scheduleChangeRequestSchema);
