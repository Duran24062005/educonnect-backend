// @ts-nocheck
import Notification from '../models/NotificationModel.js';

const createdByPopulate = {
    path: 'created_by_user_id',
    populate: {
        path: 'person_id',
    },
};

class NotificationRepository {
    async create(data) {
        return await new Notification(data).save();
    }

    async createMany(items = []) {
        if (!Array.isArray(items) || items.length === 0) return [];
        return await Notification.insertMany(items, { ordered: false });
    }

    async findByRecipient(recipient_user_id, options = {}) {
        const filter = { recipient_user_id };
        if (options.read === true) filter.read_at = { $ne: null };
        if (options.read === false) filter.read_at = null;

        const query = Notification.find(filter)
            .populate(createdByPopulate)
            .sort({ created_at: -1 });

        if (options.limit) {
            query.limit(options.limit);
        }

        return await query;
    }

    async countUnreadByRecipient(recipient_user_id) {
        return await Notification.countDocuments({
            recipient_user_id,
            read_at: null,
        });
    }

    async markAsRead(id, recipient_user_id) {
        return await Notification.findOneAndUpdate(
            { _id: id, recipient_user_id },
            { read_at: new Date() },
            { new: true }
        ).populate(createdByPopulate);
    }

    async markAllAsRead(recipient_user_id) {
        const result = await Notification.updateMany(
            { recipient_user_id, read_at: null },
            { read_at: new Date() }
        );
        return result.modifiedCount || 0;
    }
}

export const notificationRepository = new NotificationRepository();
