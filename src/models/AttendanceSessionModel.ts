import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

const attendanceSessionSchema = new mongoose.Schema(
    {
        school_year_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SchoolYear',
            required: [true, 'El año escolar es requerido'],
        },
        period_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Period',
            default: null,
        },
        group_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group',
            required: [true, 'El grupo es requerido'],
        },
        area_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Area',
            default: null,
        },
        teacher_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Teacher',
            default: null,
        },
        date: {
            type: Date,
            required: [true, 'La fecha de asistencia es requerida'],
        },
        topic: {
            type: String,
            trim: true,
            maxlength: [300, 'Máximo 300 caracteres'],
            default: null,
        },
        status: {
            type: String,
            enum: ['open', 'closed'],
            default: 'open',
        },
        created_by_user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El usuario creador es requerido'],
        },
        closed_at: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

attendanceSessionSchema.index({ institution_id: 1, group_id: 1, date: -1 });
attendanceSessionSchema.index({ institution_id: 1, school_year_id: 1, date: -1 });

tenantPlugin(attendanceSessionSchema);

export default mongoose.model('AttendanceSession', attendanceSessionSchema);
