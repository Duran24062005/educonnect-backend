import { randomUUID } from 'node:crypto';
import type { Types } from 'mongoose';
import appConfig from '../config/config.js';
import Session from '../models/SessionModel.js';
import { generateSessionToken } from '../utils/jwt.js';

interface CreateSessionInput {
    userId: string | Types.ObjectId;
    institutionId?: string | Types.ObjectId | null;
    role?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
}

interface SessionToken {
    token: string;
    jti: string;
}

const parseJwtDurationSeconds = (value: string): number => {
    const normalized = String(value || '').trim().toLowerCase();
    const match = normalized.match(/^(\d+(?:\.\d+)?)(s|m|h|d|w)?$/);
    if (!match) return 7 * 24 * 60 * 60;

    const amount = Number(match[1]);
    const unitMultipliers: Record<string, number> = {
        s: 1,
        m: 60,
        h: 60 * 60,
        d: 24 * 60 * 60,
        w: 7 * 24 * 60 * 60,
    };

    return Math.max(Math.ceil(amount * (unitMultipliers[match[2] || 's'] || 1)), 1);
};

class SessionService {
    getExpirationDate(now = new Date()): Date {
        return new Date(now.getTime() + parseJwtDurationSeconds(appConfig.jwt.expire) * 1000);
    }

    async create(input: CreateSessionInput): Promise<SessionToken> {
        const jti = randomUUID();
        const { token } = generateSessionToken(String(input.userId), input.role || null, jti);

        await Session.create({
            user_id: input.userId,
            institution_id: input.institutionId || null,
            jti,
            role: input.role || null,
            expires_at: this.getExpirationDate(),
            ip_address: input.ipAddress || null,
            user_agent: input.userAgent || null,
        });

        return { token, jti };
    }

    async isActive(userId: string, jti: string): Promise<boolean> {
        const session = await Session.findOne({
            user_id: userId,
            jti,
            revoked_at: null,
            expires_at: { $gt: new Date() },
        }).select('_id');

        return Boolean(session);
    }

    async touch(jti: string): Promise<void> {
        await Session.updateOne(
            { jti, revoked_at: null, expires_at: { $gt: new Date() } },
            { $set: { last_seen_at: new Date() } }
        );
    }

    async revoke(jti: string, userId: string, reason = 'logout'): Promise<boolean> {
        const result = await Session.updateOne(
            { jti, user_id: userId, revoked_at: null },
            { $set: { revoked_at: new Date(), revoked_reason: reason } }
        );

        return result.modifiedCount > 0;
    }

    async revokeAll(userId: string, reason = 'security_change'): Promise<number> {
        const result = await Session.updateMany(
            { user_id: userId, revoked_at: null },
            { $set: { revoked_at: new Date(), revoked_reason: reason } }
        );

        return result.modifiedCount;
    }

    async listForUser(userId: string) {
        return Session.find({ user_id: userId })
            .select('-__v')
            .sort({ created_at: -1 });
    }
}

export { parseJwtDurationSeconds };
export default new SessionService();
