import type { Types } from 'mongoose';
import AuditLog from '../../models/AuditLogModel.js';

export interface AuditRequestContext {
    institutionId?: string | Types.ObjectId | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: unknown;
}

export interface AuditEvent extends AuditRequestContext {
    actorUserId: string | Types.ObjectId;
    actorRole: string;
    action: string;
    entityType: string;
    entityId: string | Types.ObjectId;
    before?: unknown;
    after?: unknown;
}

const SENSITIVE_KEYS = new Set([
    'password',
    'password_confirm',
    'hash_password',
    'token',
    'access_token',
    'refresh_token',
]);

const isRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && value !== null && !Array.isArray(value)
);

/**
 * Convert snapshots into JSON-safe data and remove credentials before they
 * reach the audit collection. The operation is intentionally deterministic so
 * audit entries can be inspected without depending on Mongoose documents.
 */
const sanitizeSnapshot = (value: unknown): unknown => {
    if (value === null || value === undefined) return value;
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(sanitizeSnapshot);
    if (typeof value === 'object' && '_bsontype' in value && String((value as { _bsontype?: unknown })._bsontype) === 'ObjectId') {
        return String(value);
    }

    if (typeof value === 'object' && 'toObject' in value && typeof (value as { toObject?: unknown }).toObject === 'function') {
        return sanitizeSnapshot((value as { toObject: () => unknown }).toObject());
    }

    if (isRecord(value)) {
        return Object.fromEntries(
            Object.entries(value)
                .filter(([key]) => !SENSITIVE_KEYS.has(key.toLowerCase()))
                .map(([key, nestedValue]) => [key, sanitizeSnapshot(nestedValue)])
        );
    }

    return value;
};

class AuditLogService {
    async record(event: AuditEvent) {
        return AuditLog.create({
            actor_user_id: event.actorUserId,
            actor_role: event.actorRole,
            action: event.action,
            entity_type: event.entityType,
            entity_id: String(event.entityId),
            institution_id: event.institutionId ?? null,
            before: sanitizeSnapshot(event.before ?? null),
            after: sanitizeSnapshot(event.after ?? null),
            ip_address: event.ipAddress ?? null,
            user_agent: event.userAgent ?? null,
            metadata: sanitizeSnapshot(event.metadata ?? null),
        });
    }

    async list({
        institutionId,
        action,
        entityType,
        entityId,
        actorUserId,
        page = 1,
        limit = 50,
    }: {
        institutionId: string;
        action?: string;
        entityType?: string;
        entityId?: string;
        actorUserId?: string;
        page?: number;
        limit?: number;
    }) {
        const filter: Record<string, unknown> = { institution_id: institutionId };
        if (action) filter.action = action;
        if (entityType) filter.entity_type = entityType;
        if (entityId) filter.entity_id = entityId;
        if (actorUserId) filter.actor_user_id = actorUserId;

        const safePage = Math.max(Number(page) || 1, 1);
        const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
        const [events, total] = await Promise.all([
            AuditLog.find(filter)
                .sort({ created_at: -1 })
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit),
            AuditLog.countDocuments(filter),
        ]);

        return {
            events,
            pagination: {
                current_page: safePage,
                limit: safeLimit,
                total,
                total_pages: Math.ceil(total / safeLimit),
            },
        };
    }
}

export { sanitizeSnapshot };
export default new AuditLogService();
