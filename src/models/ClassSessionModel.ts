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
            required: [true, 'El tema de la sesión es requerido'],
            trim: true,
            minlength: [1, 'Mínimo 1 caracter'],
            maxlength: [500, 'Máximo 500 caracteres'],
        },
        status: {
            type: String,
            enum: ['scheduled', 'cancelled'],
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

tenantPlugin(classSessionSchema);

export default mongoose.model('ClassSession', classSessionSchema);
