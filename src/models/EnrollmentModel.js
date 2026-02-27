import mongoose from 'mongoose';

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
        status: {
            type: String,
            enum: ['active', 'transferred', 'retired'],
            required: [true, 'El estado es requerido'],
            default: 'active',
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
// Un estudiante solo puede estar inscrito una vez por año escolar
enrollmentSchema.index({ student_id: 1, school_year_id: 1 }, { unique: true });
enrollmentSchema.index({ group_id: 1, status: 1 });

export default mongoose.model('Enrollment', enrollmentSchema);