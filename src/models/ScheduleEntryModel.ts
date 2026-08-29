import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const scheduleEntrySchema = new mongoose.Schema(
    {
        schedule_id: { type: mongoose.Schema.Types.ObjectId, ref: 'WeeklySchedule', required: true },
        teaching_assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TeachingAssignment', required: true },
        // Denormalized snapshot fields make calendar filtering efficient. They
        // are written and validated together with the referenced assignment.
        school_year_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolYear', required: true },
        group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
        area_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Area', required: true },
        teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
        campus_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', default: null },
        aula_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Aula', required: true },
        entry_key: { type: String, required: true, trim: true, maxlength: 120 },
        weekday: { type: Number, required: true, min: 1, max: 7 },
        start_time: { type: String, required: true, match: timePattern },
        end_time: { type: String, required: true, match: timePattern },
        status: { type: String, enum: ['active', 'archived'], default: 'active', index: true },
        legacy_slot_id: { type: String, trim: true, default: null },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

scheduleEntrySchema.index({ institution_id: 1, schedule_id: 1, entry_key: 1 }, { unique: true });
scheduleEntrySchema.index({ institution_id: 1, school_year_id: 1, weekday: 1, start_time: 1 });
scheduleEntrySchema.index({ institution_id: 1, teacher_id: 1, weekday: 1, start_time: 1 });
scheduleEntrySchema.index({ institution_id: 1, group_id: 1, weekday: 1, start_time: 1 });
scheduleEntrySchema.index({ institution_id: 1, aula_id: 1, weekday: 1, start_time: 1 });

tenantPlugin(scheduleEntrySchema);

export default mongoose.model('ScheduleEntry', scheduleEntrySchema);
