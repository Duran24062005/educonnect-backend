import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

/**
 * GroupTeacher Model
 * Asigna profesores a grupos por área específica
 */
const groupTeacherSchema = new mongoose.Schema(
    {
        teacher_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Teacher',
            required: [true, 'El profesor es requerido'],
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
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// Índices
groupTeacherSchema.index({ teacher_id: 1 });
groupTeacherSchema.index({ group_id: 1 });
groupTeacherSchema.index({ group_id: 1, area_id: 1 });
// Un profesor no puede estar asignado dos veces al mismo grupo y área
groupTeacherSchema.index({ teacher_id: 1, group_id: 1, area_id: 1 });

tenantPlugin(groupTeacherSchema);
groupTeacherSchema.index({ institution_id: 1, teacher_id: 1, group_id: 1, area_id: 1 }, { unique: true });

export default mongoose.model('GroupTeacher', groupTeacherSchema);
