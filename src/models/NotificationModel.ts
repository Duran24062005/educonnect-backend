import mongoose from 'mongoose';
import { tenantPlugin } from '../tenant/tenant-plugin.js';

const notificationSchema = new mongoose.Schema(
    {
        recipient_user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['activity_created', 'activity_submitted', 'admin_announcement', 'teacher_announcement'],
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 180,
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },
        audience_role: {
            type: String,
            enum: ['admin', 'teacher', 'student'],
            required: true,
            index: true,
        },
        read_at: {
            type: Date,
            default: null,
            index: true,
        },
        created_by_user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        created_by_role: {
            type: String,
            enum: ['admin', 'teacher', 'student'],
            default: null,
        },
        source_type: {
            type: String,
            enum: ['activity', 'announcement'],
            default: null,
        },
        source_id: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

notificationSchema.index({ recipient_user_id: 1, created_at: -1 });
notificationSchema.index({ recipient_user_id: 1, read_at: 1, created_at: -1 });

tenantPlugin(notificationSchema);

export default mongoose.model('Notification', notificationSchema);
