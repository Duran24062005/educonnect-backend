import Institution from '../models/InstitutionModel.js';
import User from '../models/UserModel.js';
import AuditLogService from './AuditLogService.js';
import { AppError } from '../utils/error.js';

interface InstitutionInput {
    name: string;
    code: string;
    type: 'private' | 'public';
    max_students?: number;
    timezone?: string;
}

class InstitutionService {
    async create(userId: string, input: InstitutionInput) {
        const actor = await User.findById(userId).select('institution_id');
        if (!actor) throw new AppError('Usuario no encontrado', 404);

        if (actor.institution_id) {
            throw new AppError('El usuario ya pertenece a una institución', 409);
        }

        const institution = await Institution.create({
            name: input.name,
            code: input.code.trim().toUpperCase(),
            type: input.type,
            max_students: input.max_students ?? 800,
            timezone: input.timezone || 'America/Bogota',
            created_by_user_id: userId,
        });

        await User.findByIdAndUpdate(userId, { institution_id: institution._id });

        await AuditLogService.record({
            actorUserId: userId,
            actorRole: 'admin',
            action: 'institution.created',
            entityType: 'Institution',
            entityId: institution._id,
            before: null,
            after: institution,
            institutionId: institution._id,
        });

        return institution;
    }

    async getCurrent(userId: string) {
        const user = await User.findById(userId).populate('institution_id');
        if (!user) throw new AppError('Usuario no encontrado', 404);
        if (!user.institution_id) {
            throw new AppError('El usuario aún no pertenece a una institución', 404);
        }

        return user.institution_id;
    }

    async assignUser(actorUserId: string, targetUserId: string) {
        const actor = await User.findById(actorUserId).select('institution_id');
        if (!actor?.institution_id) {
            throw new AppError('Configura primero la institución del administrador', 409);
        }

        const target = await User.findById(targetUserId)
            .select('institution_id email')
            .setOptions({ skipTenant: true });
        if (!target) throw new AppError('Usuario objetivo no encontrado', 404);

        if (target.institution_id && String(target.institution_id) !== String(actor.institution_id)) {
            throw new AppError('El usuario ya pertenece a otra institución', 409);
        }

        if (target.institution_id) return target;

        const updated = await User.findByIdAndUpdate(
            targetUserId,
            { institution_id: actor.institution_id },
            { new: true, runValidators: true }
        ).setOptions({ skipTenant: true });

        await AuditLogService.record({
            actorUserId,
            actorRole: 'admin',
            action: 'institution.user_assigned',
            entityType: 'User',
            entityId: targetUserId,
            before: target,
            after: updated,
            institutionId: actor.institution_id,
        });

        return updated;
    }
}

export default new InstitutionService();
