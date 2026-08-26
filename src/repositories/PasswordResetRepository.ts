// @ts-nocheck
import PasswordResetRequest from '../models/PasswordResetRequestModel.js';

const activeFilter = (userId, now = new Date()) => ({
    ...(userId ? { user_id: userId } : {}),
    expires_at: { $gt: now },
    used_at: null,
    invalidated_at: null,
});

class PasswordResetRepository {
    async invalidateActive(userId) {
        return PasswordResetRequest.updateMany(
            activeFilter(userId),
            { $set: { invalidated_at: new Date() } }
        );
    }

    async create(data) {
        return PasswordResetRequest.create(data);
    }

    async findLatestActive(userId, now = new Date()) {
        return PasswordResetRequest.findOne({
            ...activeFilter(userId, now),
            verified_at: null,
            attempts: { $lt: 5 },
        })
            .select('+code_hash')
            .sort({ created_at: -1 });
    }

    async incrementAttempts(id, now = new Date()) {
        return PasswordResetRequest.findOneAndUpdate(
            {
                _id: id,
                ...activeFilter(undefined, now),
                verified_at: null,
                attempts: { $lt: 5 },
            },
            { $inc: { attempts: 1 } },
            { new: true }
        );
    }

    async markVerified(id, now = new Date()) {
        return PasswordResetRequest.findOneAndUpdate(
            {
                _id: id,
                ...activeFilter(undefined, now),
                verified_at: null,
                attempts: { $lt: 5 },
            },
            { $set: { verified_at: now } },
            { new: true }
        );
    }

    async consumeVerified(id, userId, now = new Date()) {
        const result = await PasswordResetRequest.updateOne(
            {
                _id: id,
                user_id: userId,
                ...activeFilter(undefined, now),
                verified_at: { $ne: null },
            },
            { $set: { used_at: now } }
        );

        return result.modifiedCount > 0;
    }
}

export default new PasswordResetRepository();
