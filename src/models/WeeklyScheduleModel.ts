import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const availabilityWindowSchema = new mongoose.Schema(
    {
        window_id: { type: String, required: true, trim: true },
        group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
        start_time: { type: String, required: true, match: timePattern },
        end_time: { type: String, required: true, match: timePattern },
    },
    { _id: false }
);

const scheduleSlotSchema = new mongoose.Schema(
    {
        slot_id: { type: String, required: true, trim: true },
        group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
        area_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Area', required: true },
        teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
        aula_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Aula', required: true },
        weekday: { type: Number, required: true, min: 1, max: 7 },
        start_time: { type: String, required: true, match: timePattern },
        end_time: { type: String, required: true, match: timePattern },
    },
    { _id: false }
);

const weeklyScheduleSchema = new mongoose.Schema(
    {
        school_year_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolYear', required: true },
        version: { type: Number, required: true, min: 1 },
        status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
        school_days: { type: [Number], required: true, default: [1, 2, 3, 4, 5] },
        // Availability policy for the current school year. The legacy slots
        // field is retained so historical schedules can still be read.
        availability_windows: { type: [availabilityWindowSchema], default: [] },
        slots: { type: [scheduleSlotSchema], default: [] },
        created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        published_at: { type: Date, default: null },
        published_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

weeklyScheduleSchema.index({ institution_id: 1, school_year_id: 1, version: 1 }, { unique: true });
weeklyScheduleSchema.index({ institution_id: 1, school_year_id: 1, status: 1 });
tenantPlugin(weeklyScheduleSchema);

export default mongoose.model('WeeklySchedule', weeklyScheduleSchema);
