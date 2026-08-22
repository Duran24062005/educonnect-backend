import Institution from '../models/InstitutionModel.js';
import User from '../models/UserModel.js';
import AuditLogService from './AuditLogService.js';
import { AppError } from '../utils/error.js';
import Campus from '../models/CampusModel.js';
import SchoolShift from '../models/SchoolShiftModel.js';

interface InstitutionInput {
    name: string;
    code: string;
    type: 'private' | 'public';
    max_students?: number;
    timezone?: string;
}

interface CampusInput { name: string; code: string; address?: string | null; status?: 'active' | 'inactive'; }
interface ShiftInput { name: string; code: string; start_time: string; end_time: string; status?: 'active' | 'inactive'; }

class InstitutionService {
    async getInstitutionId(userId: string) {
        const user = await User.findById(userId).select('institution_id');
        if (!user?.institution_id) throw new AppError('Configura primero la institución del administrador', 409);
        return user.institution_id;
    }

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

    async listCampuses(userId: string) {
        const institutionId = await this.getInstitutionId(userId);
        return Campus.find({ institution_id: institutionId }).sort({ name: 1 });
    }

    async createCampus(userId: string, input: CampusInput) {
        const institutionId = await this.getInstitutionId(userId);
        return Campus.create({ ...input, code: input.code.trim().toUpperCase(), institution_id: institutionId, created_by_user_id: userId });
    }

    async updateCampus(userId: string, id: string, input: Partial<CampusInput>) {
        const institutionId = await this.getInstitutionId(userId);
        const campus = await Campus.findOneAndUpdate({ _id: id, institution_id: institutionId }, { ...input, ...(input.code ? { code: input.code.trim().toUpperCase() } : {}) }, { new: true, runValidators: true });
        if (!campus) throw new AppError('Sede no encontrada', 404);
        return campus;
    }

    async deleteCampus(userId: string, id: string) {
        const institutionId = await this.getInstitutionId(userId);
        const campus = await Campus.findOneAndUpdate({ _id: id, institution_id: institutionId }, { status: 'inactive' }, { new: true });
        if (!campus) throw new AppError('Sede no encontrada', 404);
        return campus;
    }

    async listShifts(userId: string) {
        const institutionId = await this.getInstitutionId(userId);
        return SchoolShift.find({ institution_id: institutionId }).sort({ start_time: 1, name: 1 });
    }

    async createShift(userId: string, input: ShiftInput) {
        const institutionId = await this.getInstitutionId(userId);
        if (input.start_time >= input.end_time) throw new AppError('La hora inicial debe ser anterior a la final', 400);
        return SchoolShift.create({ ...input, code: input.code.trim().toUpperCase(), institution_id: institutionId, created_by_user_id: userId });
    }

    async updateShift(userId: string, id: string, input: Partial<ShiftInput>) {
        const institutionId = await this.getInstitutionId(userId);
        if (input.start_time && input.end_time && input.start_time >= input.end_time) throw new AppError('La hora inicial debe ser anterior a la final', 400);
        const shift = await SchoolShift.findOneAndUpdate({ _id: id, institution_id: institutionId }, { ...input, ...(input.code ? { code: input.code.trim().toUpperCase() } : {}) }, { new: true, runValidators: true });
        if (!shift) throw new AppError('Jornada no encontrada', 404);
        return shift;
    }

    async deleteShift(userId: string, id: string) {
        const institutionId = await this.getInstitutionId(userId);
        const shift = await SchoolShift.findOneAndUpdate({ _id: id, institution_id: institutionId }, { status: 'inactive' }, { new: true });
        if (!shift) throw new AppError('Jornada no encontrada', 404);
        return shift;
    }
}

export default new InstitutionService();
