import type { HydratedDocument, Types } from 'mongoose';

declare global {
    namespace Express {
        interface Request {
            user?: HydratedDocument<Record<string, unknown>>;
            userId?: string;
            userRole?: string;
            personId?: Types.ObjectId;
        }
    }
}

export {};
