import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

/**
 * Enrollment Model
 * Registra la inscripción de un estudiante en un grupo para un año escolar
 */
const enrollmentSchema = new mongoose.Schema(
    {
        student_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: [true, 'El estudiante es requerido'],
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
        campus_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Campus',
            default: null,
        },
        shift_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SchoolShift',
            default: null,
        },
        status: {
            type: String,
            enum: ['active', 'transferred', 'retired'],
            required: [true, 'El estado es requerido'],
            default: 'active',
        },
        previous_enrollment_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Enrollment',
            default: null,
        },
        closed_at: {
            type: Date,
            default: null,
        },
        transfer_reason: {
            type: String,
            trim: true,
            maxlength: [300, 'Máximo 300 caracteres'],
            default: null,
        },
        observations: {
            type: String,
            trim: true,
            maxlength: [500, 'Máximo 500 caracteres'],
            default: null,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// Índices
enrollmentSchema.index({ student_id: 1 });
enrollmentSchema.index({ group_id: 1 });
enrollmentSchema.index({ school_year_id: 1 });
// Solo una matrícula activa por estudiante y año escolar.
enrollmentSchema.index(
    { student_id: 1, school_year_id: 1 },
    { partialFilterExpression: { status: 'active' } }
);
enrollmentSchema.index({ group_id: 1, status: 1 });

tenantPlugin(enrollmentSchema);
enrollmentSchema.index(
    { institution_id: 1, student_id: 1, school_year_id: 1 },
    { unique: true, partialFilterExpression: { status: 'active' } }
);

export default mongoose.model('Enrollment', enrollmentSchema);
