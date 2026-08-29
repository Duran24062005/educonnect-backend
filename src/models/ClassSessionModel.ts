import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

const classSessionSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['class_session'],
            default: 'class_session',
        },
        school_year_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SchoolYear',
            required: [true, 'El año escolar es requerido'],
        },
        group_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group',
            required: [true, 'El grupo es requerido'],
        },
        area_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Area',
            required: [true, 'El área es requerida'],
        },
        teacher_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Teacher',
            required: [true, 'El docente es requerido'],
        },
        aula_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Aula',
            required: [true, 'El aula es requerida'],
        },
        start_at: {
            type: Date,
            required: [true, 'La hora de inicio es requerida'],
        },
        end_at: {
            type: Date,
            required: [true, 'La hora final es requerida'],
        },
        topic: {
            type: String,
            required: false,
            trim: true,
            maxlength: [500, 'Máximo 500 caracteres'],
            default: '',
        },
        schedule_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WeeklySchedule',
            default: null,
        },
        schedule_entry_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ScheduleEntry',
            default: null,
        },
        schedule_slot_id: {
            type: String,
            trim: true,
            default: null,
        },
        schedule_window_id: {
            type: String,
            trim: true,
            default: null,
        },
        occurrence_date: {
            type: Date,
            default: null,
        },
        source: {
            type: String,
            enum: ['legacy', 'schedule', 'exception'],
            default: 'legacy',
        },
        is_manual_override: {
            type: Boolean,
            default: false,
        },
        exception_reason: {
            type: String,
            trim: true,
            maxlength: [1000, 'Máximo 1000 caracteres'],
            default: null,
        },
        status: {
            type: String,
            enum: ['scheduled', 'completed', 'cancelled'],
            default: 'scheduled',
            index: true,
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El creador es requerido'],
        },
        updated_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El editor es requerido'],
        },
        cancelled_at: {
            type: Date,
            default: null,
        },
        cancelled_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

classSessionSchema.index({ school_year_id: 1, start_at: 1 });
classSessionSchema.index({ group_id: 1, start_at: 1 });
classSessionSchema.index({ teacher_id: 1, start_at: 1 });
classSessionSchema.index({ aula_id: 1, start_at: 1 });
classSessionSchema.index({ institution_id: 1, school_year_id: 1, start_at: 1 });
classSessionSchema.index({ schedule_id: 1, schedule_slot_id: 1, occurrence_date: 1 }, { sparse: true });
classSessionSchema.index({ schedule_id: 1, schedule_window_id: 1, occurrence_date: 1 }, { sparse: true });
// Solo las sesiones materializadas desde una entrada de horario participan en
// la unicidad. Las sesiones legacy/manuales guardan estos campos como null.
classSessionSchema.index(
    { institution_id: 1, schedule_entry_id: 1, occurrence_date: 1 },
    {
        unique: true,
        partialFilterExpression: {
            schedule_entry_id: { $type: 'objectId' },
            occurrence_date: { $type: 'date' },
        },
    }
);

tenantPlugin(classSessionSchema);

export default mongoose.model('ClassSession', classSessionSchema);
