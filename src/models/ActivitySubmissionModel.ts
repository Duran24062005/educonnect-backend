import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';
import { ACTIVITY_SUBMISSION_STATUS, ACTIVITY_SUBMISSION_TYPE } from '../constants/activity.constants.js';

const rubricScoreSchema = new mongoose.Schema(
    {
        criterion_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'El criterio es requerido'],
        },
        title: {
            type: String,
            required: [true, 'El nombre del criterio es requerido'],
            trim: true,
            maxlength: [150, 'Máximo 150 caracteres'],
        },
        max_points: {
            type: Number,
            required: [true, 'El puntaje máximo es requerido'],
            min: [0.1, 'El puntaje debe ser mayor a 0'],
        },
        earned_points: {
            type: Number,
            required: [true, 'El puntaje obtenido es requerido'],
            min: [0, 'El puntaje obtenido no puede ser negativo'],
        },
        feedback: {
            type: String,
            trim: true,
            maxlength: [500, 'Máximo 500 caracteres'],
            default: null,
        },
    },
    {
        _id: false,
        id: false,
    }
);

const activitySubmissionSchema = new mongoose.Schema(
    {
        activity_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Activity',
            required: [true, 'La actividad es requerida'],
        },
        student_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: [true, 'El estudiante es requerido'],
        },
        submission_type: {
            type: String,
            enum: Object.values(ACTIVITY_SUBMISSION_TYPE),
            required: [true, 'El tipo de entrega es requerido'],
        },
        link_url: {
            type: String,
            trim: true,
            maxlength: [1000, 'Máximo 1000 caracteres'],
            default: null,
        },
        file_url: {
            type: String,
            trim: true,
            maxlength: [2000, 'Máximo 2000 caracteres'],
            default: null,
        },
        file_name: {
            type: String,
            trim: true,
            maxlength: [200, 'Máximo 200 caracteres'],
            default: null,
        },
        file_extension: {
            type: String,
            trim: true,
            maxlength: [15, 'Máximo 15 caracteres'],
            default: null,
        },
        original_name: {
            type: String,
            trim: true,
            maxlength: [255, 'Máximo 255 caracteres'],
            default: null,
        },
        mime_type: {
            type: String,
            trim: true,
            maxlength: [150, 'Máximo 150 caracteres'],
            default: null,
        },
        size_bytes: {
            type: Number,
            default: 0,
            min: [0, 'El tamaño no puede ser negativo'],
        },
        storage_provider: {
            type: String,
            trim: true,
            maxlength: [50, 'Máximo 50 caracteres'],
            default: null,
        },
        storage_bucket: {
            type: String,
            trim: true,
            maxlength: [150, 'Máximo 150 caracteres'],
            default: null,
        },
        storage_key: {
            type: String,
            trim: true,
            maxlength: [1024, 'Máximo 1024 caracteres'],
            default: null,
        },
        storage_signed_url: {
            type: String,
            trim: true,
            maxlength: [2000, 'Máximo 2000 caracteres'],
            default: null,
        },
        storage_signed_url_expires_at: {
            type: Date,
            default: null,
        },
        submitted_at: {
            type: Date,
            required: [true, 'La fecha de entrega es requerida'],
            default: Date.now,
        },
        status: {
            type: String,
            enum: Object.values(ACTIVITY_SUBMISSION_STATUS),
            default: ACTIVITY_SUBMISSION_STATUS.SUBMITTED,
        },
        rubric_scores: {
            type: [rubricScoreSchema],
            default: [],
        },
        earned_points: {
            type: Number,
            default: 0,
            min: [0, 'El puntaje obtenido no puede ser negativo'],
        },
        max_points: {
            type: Number,
            default: 0,
            min: [0, 'El puntaje máximo no puede ser negativo'],
        },
        score_10: {
            type: Number,
            default: null,
            min: [0, 'La nota mínima es 0'],
            max: [10, 'La nota máxima es 10'],
        },
        teacher_feedback: {
            type: String,
            trim: true,
            maxlength: [2000, 'Máximo 2000 caracteres'],
            default: null,
        },
        graded_at: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

activitySubmissionSchema.index({ activity_id: 1 });
activitySubmissionSchema.index({ student_id: 1, submitted_at: -1 });
activitySubmissionSchema.index({ activity_id: 1, student_id: 1 });

tenantPlugin(activitySubmissionSchema);
activitySubmissionSchema.index({ institution_id: 1, activity_id: 1, student_id: 1 }, { unique: true });

export default mongoose.model('ActivitySubmission', activitySubmissionSchema);
