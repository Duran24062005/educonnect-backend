import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

const scheduleExceptionSchema = new mongoose.Schema(
    {
        school_year_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolYear', required: true },
        schedule_entry_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ScheduleEntry', default: null },
        occurrence_date: { type: Date, required: true },
        type: { type: String, enum: ['cancel', 'override', 'additional'], required: true },
        start_at: { type: Date, default: null },
        end_at: { type: Date, default: null },
        aula_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Aula', default: null },
        group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
        area_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Area', default: null },
        teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
        reason: { type: String, required: true, trim: true, maxlength: 1000 },
        status: { type: String, enum: ['active', 'cancelled'], default: 'active', index: true },
        created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

scheduleExceptionSchema.index({ institution_id: 1, school_year_id: 1, occurrence_date: 1, status: 1 });
scheduleExceptionSchema.index({ institution_id: 1, schedule_entry_id: 1, occurrence_date: 1 }, { unique: true, sparse: true });

tenantPlugin(scheduleExceptionSchema);

export default mongoose.model('ScheduleException', scheduleExceptionSchema);
