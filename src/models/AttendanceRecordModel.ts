import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

const attendanceRecordSchema = new mongoose.Schema(
    {
        session_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AttendanceSession',
            required: [true, 'La sesión de asistencia es requerida'],
        },
        student_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: [true, 'El estudiante es requerido'],
        },
        status: {
            type: String,
            enum: ['pending', 'present', 'absent', 'late', 'excused'],
            default: 'pending',
        },
        note: {
            type: String,
            trim: true,
            maxlength: [500, 'Máximo 500 caracteres'],
            default: null,
        },
        justification: {
            type: String,
            trim: true,
            maxlength: [1000, 'Máximo 1000 caracteres'],
            default: null,
        },
        justified_at: {
            type: Date,
            default: null,
        },
        justified_by_user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

attendanceRecordSchema.index({ institution_id: 1, session_id: 1, student_id: 1 }, { unique: true });
attendanceRecordSchema.index({ institution_id: 1, student_id: 1, created_at: -1 });

tenantPlugin(attendanceRecordSchema);

export default mongoose.model('AttendanceRecord', attendanceRecordSchema);
