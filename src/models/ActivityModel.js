import mongoose from 'mongoose';
import { ACTIVITY_ALLOWED_EXTENSIONS, ACTIVITY_STATUS } from '../constants/activity.constants.js';

const rubricCriterionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'El nombre del criterio es requerido'],
            trim: true,
            minlength: [1, 'Mínimo 1 caracter'],
            maxlength: [150, 'Máximo 150 caracteres'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Máximo 500 caracteres'],
            default: null,
        },
        max_points: {
            type: Number,
            required: [true, 'El puntaje máximo del criterio es requerido'],
            min: [0.1, 'El puntaje debe ser mayor a 0'],
            max: [1000, 'Máximo 1000 puntos por criterio'],
        },
    },
    {
        _id: true,
        id: false,
    }
);

const activitySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'El título es requerido'],
            trim: true,
            minlength: [1, 'Mínimo 1 caracter'],
            maxlength: [180, 'Máximo 180 caracteres'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Máximo 1000 caracteres'],
            default: null,
        },
        context: {
            type: String,
            required: [true, 'El contexto es requerido'],
            trim: true,
            minlength: [1, 'Mínimo 1 caracter'],
            maxlength: [4000, 'Máximo 4000 caracteres'],
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
        period_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Period',
            required: [true, 'El periodo es requerido'],
        },
        school_year_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SchoolYear',
            required: [true, 'El año escolar es requerido'],
        },
        teacher_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Teacher',
            required: [true, 'El docente es requerido'],
        },
        open_at: {
            type: Date,
            required: [true, 'La fecha de apertura es requerida'],
        },
        due_at: {
            type: Date,
            required: [true, 'La fecha de cierre es requerida'],
        },
        allowed_extensions: {
            type: [String],
            required: [true, 'Los formatos permitidos son requeridos'],
            validate: {
                validator: (values) => Array.isArray(values) && values.length > 0,
                message: 'Debe haber al menos un formato permitido',
            },
            enum: ACTIVITY_ALLOWED_EXTENSIONS,
        },
        rubric_criteria: {
            type: [rubricCriterionSchema],
            required: [true, 'Las rúbricas evaluativas son requeridas'],
            validate: {
                validator: (values) => Array.isArray(values) && values.length > 0,
                message: 'Debe haber al menos un criterio de evaluación',
            },
        },
        status: {
            type: String,
            enum: Object.values(ACTIVITY_STATUS),
            default: ACTIVITY_STATUS.PUBLISHED,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

activitySchema.index({ teacher_id: 1, created_at: -1 });
activitySchema.index({ group_id: 1, area_id: 1, period_id: 1 });
activitySchema.index({ school_year_id: 1, group_id: 1, due_at: 1 });

export default mongoose.model('Activity', activitySchema);
