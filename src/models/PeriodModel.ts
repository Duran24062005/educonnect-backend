import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

/**
 * Period Model
 * Representa los periodos evaluativos dentro de un año escolar
 */
const periodSchema = new mongoose.Schema(
    {
        school_year_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SchoolYear',
            required: [true, 'El año escolar es requerido'],
        },
        name: {
            type: String,
            required: [true, 'El nombre es requerido'],
            trim: true,
            minlength: [1, 'Mínimo 1 caracter'],
            maxlength: [100, 'Máximo 100 caracteres'],
        },
        weight: {
            type: Number,
            required: [true, 'El peso es requerido'],
            min: [0, 'Mínimo 0'],
            max: [1, 'Máximo 1 (representación decimal del porcentaje)'],
        },
        start_date: {
            type: Date,
            required: [true, 'La fecha de inicio es requerida'],
        },
        end_date: {
            type: Date,
            required: [true, 'La fecha de fin es requerida'],
        },
        status: {
            type: String,
            enum: ['open', 'closed'],
            default: 'open',
        },
        closed_at: {
            type: Date,
            default: null,
        },
        closed_by_user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// Índices
periodSchema.index({ school_year_id: 1 });
periodSchema.index({ school_year_id: 1, start_date: 1 });
periodSchema.index({ school_year_id: 1, status: 1 });

tenantPlugin(periodSchema);

export default mongoose.model('Period', periodSchema);
