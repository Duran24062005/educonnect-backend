// @ts-nocheck
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import Institution from '../../models/InstitutionModel.js';
import User from '../../models/UserModel.js';
import Person from '../../models/PersonModel.js';
import AuthService from '../auth/AuthService.js';
import AuditLogService from '../audit/AuditLogService.js';
import AppError from '../../utils/AppError.js';

const VALID_STATUSES = ['sandbox', 'active', 'suspended'] as const;

const normalizeEmail = (email: string) => String(email || '').trim().toLowerCase();
const normalizeCode = (code: string) => String(code || '').trim().toUpperCase();
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const serializePerson = (person: any) => person ? {
    _id: person._id,
    first_name: person.first_name,
    last_name: person.last_name,
    document_type: person.document_type,
    document_number: person.document_number,
    phone: person.phone || null,
    role: person.role,
    status: person.status,
} : null;

const serializeAdmin = (user: any) => user ? {
    user_id: user._id?.toString?.() || user._id,
    email: user.email,
    person: serializePerson(user.person_id),
} : null;

const serializeInstitution = (institution: any) => ({
    _id: institution._id,
    name: institution.name,
    code: institution.code,
    type: institution.type,
    status: institution.status,
    max_students: institution.max_students,
    timezone: institution.timezone,
    primary_admin_user_id: institution.primary_admin_user_id?._id?.toString?.() || institution.primary_admin_user_id?.toString?.() || null,
    rector_user_id: institution.rector_user_id?._id?.toString?.() || institution.rector_user_id?.toString?.() || null,
    primary_admin: serializeAdmin(institution.primary_admin_user_id),
    rector: serializeAdmin(institution.rector_user_id),
    created_at: institution.created_at,
    updated_at: institution.updated_at,
});

const duplicateMessage = (error: any) => {
    const key = String(error?.keyPattern ? Object.keys(error.keyPattern)[0] : '');
    if (key === 'code') return 'El código de la institución ya está registrado';
    if (key === 'email') return 'El correo del administrador ya está registrado';
    if (key === 'document_number') return 'El número de documento ya está registrado';
    return 'Ya existe un registro con uno de los datos enviados';
};

const isDuplicateError = (error: any) => error?.code === 11000;
const isTransactionUnsupported = (error: any) => /transaction numbers|replica set|mongos/i.test(String(error?.message || ''));

class PlatformService {
    async populateInstitution(query: any) {
        return query
            .populate({ path: 'primary_admin_user_id', populate: { path: 'person_id' } })
            .populate({ path: 'rector_user_id', populate: { path: 'person_id' } });
    }

    async list(filters: any = {}, page = 1, limit = 10) {
        const safePage = Math.max(Number(page) || 1, 1);
        const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
        const filter: any = {};

        if (filters.status) filter.status = filters.status;
        if (filters.type) filter.type = filters.type;
        if (filters.search) {
            const expression = new RegExp(escapeRegex(String(filters.search).trim()), 'i');
            filter.$or = [{ name: expression }, { code: expression }];
        }

        const [institutions, total] = await Promise.all([
            this.populateInstitution(
                Institution.find(filter).sort({ created_at: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit)
            ),
            Institution.countDocuments(filter),
        ]);

        return {
            institutions: institutions.map(serializeInstitution),
            pagination: {
                current_page: safePage,
                limit: safeLimit,
                total,
                total_pages: Math.ceil(total / safeLimit),
            },
        };
    }

    async getById(id: string) {
        if (!mongoose.isValidObjectId(id)) throw new AppError('Institución no encontrada', 404);
        const institution = await this.populateInstitution(Institution.findById(id));
        if (!institution) throw new AppError('Institución no encontrada', 404);
        return serializeInstitution(institution);
    }

    async assertUniqueInput(input: any, excludeInstitutionId?: string) {
        const code = normalizeCode(input.institution.code);
        const institutionFilter: any = { code };
        if (excludeInstitutionId) institutionFilter._id = { $ne: excludeInstitutionId };

        if (await Institution.exists(institutionFilter)) {
            throw new AppError('El código de la institución ya está registrado', 409);
        }

        const email = normalizeEmail(input.primary_admin?.email || input.email);
        if (email && await User.findOne({ email }).setOptions({ skipTenant: true })) {
            throw new AppError('El correo del administrador ya está registrado', 409);
        }

        const documentNumber = String(input.primary_admin?.document_number || '').trim();
        if (documentNumber && await Person.findOne({ document_number: documentNumber }).setOptions({ skipTenant: true })) {
            throw new AppError('El número de documento ya está registrado', 409);
        }

        return { code, email, documentNumber };
    }

    async assertUniqueAdminInput(adminInput: any) {
        const email = normalizeEmail(adminInput.email);
        if (await User.findOne({ email }).setOptions({ skipTenant: true })) {
            throw new AppError('El correo del administrador ya está registrado', 409);
        }

        const documentNumber = String(adminInput.document_number || '').trim();
        if (await Person.findOne({ document_number: documentNumber }).setOptions({ skipTenant: true })) {
            throw new AppError('El número de documento ya está registrado', 409);
        }
    }

    async createAdminRecords(institutionId: any, adminInput: any, session?: any, createdIds: any = {}) {
        const options = session ? { session } : undefined;
        const tempPassword = randomBytes(32).toString('base64url');
        const [user] = await User.create([{
            email: normalizeEmail(adminInput.email),
            hash_password: tempPassword,
            institution_id: institutionId,
        }], options);
        createdIds.userId = user._id;

        const [person] = await Person.create([{
            user_id: user._id,
            first_name: adminInput.first_name.trim(),
            last_name: adminInput.last_name.trim(),
            phone: adminInput.phone?.trim() || null,
            role: 'Admin',
            status: 'active',
            document_type: adminInput.document_type,
            document_number: adminInput.document_number.trim(),
            institution_id: institutionId,
        }], options);
        createdIds.personId = person._id;

        await User.updateOne(
            { _id: user._id },
            { $set: { person_id: person._id, institution_id: institutionId } },
            options
        );

        return { user, person };
    }

    async createRecords(input: any, actorUserId: string, session?: any, createdIds: any = {}) {
        const options = session ? { session } : undefined;
        const institutionInput = input.institution;
        const adminInput = input.primary_admin;

        const [institution] = await Institution.create([{
            name: institutionInput.name.trim(),
            code: normalizeCode(institutionInput.code),
            type: institutionInput.type,
            status: 'sandbox',
            max_students: institutionInput.max_students ?? 800,
            timezone: institutionInput.timezone || 'America/Bogota',
            created_by_user_id: actorUserId,
        }], options);
        createdIds.institutionId = institution._id;

        const { user, person } = await this.createAdminRecords(institution._id, adminInput, session, createdIds);

        await Institution.updateOne(
            { _id: institution._id },
            {
                $set: {
                    primary_admin_user_id: user._id,
                    ...(institutionInput.type === 'public' ? { rector_user_id: user._id } : {}),
                },
            },
            options
        );

        return { institution, user, person };
    }

    async create(actorUserId: string, input: any, requestContext: any = {}) {
        await this.assertUniqueInput(input);
        let records;
        let session;

        try {
            session = await mongoose.startSession();
            await session.withTransaction(async () => {
                records = await this.createRecords(input, actorUserId, session);
            });
        } catch (error) {
            if (!isTransactionUnsupported(error)) {
                if (isDuplicateError(error)) throw new AppError(duplicateMessage(error), 409);
                throw error;
            }

            const createdIds: any = {};
            try {
                records = await this.createRecords(input, actorUserId, undefined, createdIds);
            } catch (fallbackError) {
                if (createdIds.personId) await Person.deleteOne({ _id: createdIds.personId }).setOptions({ skipTenant: true });
                if (createdIds.userId) await User.deleteOne({ _id: createdIds.userId }).setOptions({ skipTenant: true });
                if (createdIds.institutionId) await Institution.deleteOne({ _id: createdIds.institutionId });
                if (isDuplicateError(fallbackError)) throw new AppError(duplicateMessage(fallbackError), 409);
                throw fallbackError;
            }
        } finally {
            if (session) await session.endSession();
        }

        const invitation = await AuthService.issueInstitutionAdminInvitation(records.user._id);
        await AuditLogService.record({
            actorUserId,
            actorRole: 'superadmin',
            action: 'platform.institution.created',
            entityType: 'Institution',
            entityId: records.institution._id,
            institutionId: records.institution._id,
            before: null,
            after: {
                name: records.institution.name,
                code: records.institution.code,
                type: records.institution.type,
                status: records.institution.status,
                primary_admin_user_id: records.user._id,
                rector_user_id: records.institution.type === 'public' ? records.user._id : null,
            },
            ...requestContext,
        });

        return {
            institution: await this.getById(records.institution._id.toString()),
            invitation,
        };
    }

    async assignPrimaryAdmin(id: string, adminInput: any, actorUserId: string, requestContext: any = {}) {
        if (!mongoose.isValidObjectId(id)) throw new AppError('Institución no encontrada', 404);
        const current = await Institution.findById(id);
        if (!current) throw new AppError('Institución no encontrada', 404);
        if (current.primary_admin_user_id) {
            throw new AppError('La institución ya tiene un administrador principal', 409);
        }
        await this.assertUniqueAdminInput(adminInput);

        let records;
        let session;
        const attachAdmin = async (institution: any, user: any, options?: any) => {
            const update: any = { primary_admin_user_id: user._id };
            if (institution.type === 'public' && !institution.rector_user_id) {
                update.rector_user_id = user._id;
            }
            const updated = await Institution.findOneAndUpdate(
                { _id: institution._id, primary_admin_user_id: null },
                { $set: update },
                { new: true, ...options }
            );
            if (!updated) throw new AppError('La institución ya tiene un administrador principal', 409);
            return updated;
        };

        try {
            session = await mongoose.startSession();
            await session.withTransaction(async () => {
                const transactionInstitution = await Institution.findById(id).session(session);
                if (!transactionInstitution) throw new AppError('Institución no encontrada', 404);
                if (transactionInstitution.primary_admin_user_id) {
                    throw new AppError('La institución ya tiene un administrador principal', 409);
                }
                records = await this.createAdminRecords(transactionInstitution._id, adminInput, session);
                await attachAdmin(transactionInstitution, records.user, { session });
            });
        } catch (error) {
            if (!isTransactionUnsupported(error)) {
                if (isDuplicateError(error)) throw new AppError(duplicateMessage(error), 409);
                throw error;
            }

            const createdIds: any = {};
            try {
                const latest = await Institution.findById(id);
                if (!latest) throw new AppError('Institución no encontrada', 404);
                if (latest.primary_admin_user_id) {
                    throw new AppError('La institución ya tiene un administrador principal', 409);
                }
                records = await this.createAdminRecords(latest._id, adminInput, undefined, createdIds);
                await attachAdmin(latest, records.user);
            } catch (fallbackError) {
                if (createdIds.personId) await Person.deleteOne({ _id: createdIds.personId }).setOptions({ skipTenant: true });
                if (createdIds.userId) await User.deleteOne({ _id: createdIds.userId }).setOptions({ skipTenant: true });
                if (isDuplicateError(fallbackError)) throw new AppError(duplicateMessage(fallbackError), 409);
                throw fallbackError;
            }
        } finally {
            if (session) await session.endSession();
        }

        const invitation = await AuthService.issueInstitutionAdminInvitation(records.user._id);
        await AuditLogService.record({
            actorUserId,
            actorRole: 'superadmin',
            action: 'platform.institution.primary_admin_assigned',
            entityType: 'Institution',
            entityId: id,
            institutionId: id,
            before: { primary_admin_user_id: null },
            after: {
                primary_admin_user_id: records.user._id,
                rector_user_id: current.type === 'public' && !current.rector_user_id ? records.user._id : current.rector_user_id,
            },
            ...requestContext,
        });

        return {
            institution: await this.getById(id),
            invitation,
        };
    }

    async update(id: string, input: any, actorUserId: string, requestContext: any = {}) {
        const current = await Institution.findById(id);
        if (!current) throw new AppError('Institución no encontrada', 404);
        if (Object.prototype.hasOwnProperty.call(input, 'type')) {
            throw new AppError('El tipo de institución no se puede modificar', 400);
        }

        if (input.code) await this.assertUniqueInput({ institution: { code: input.code }, primary_admin: {} }, id);
        const update = {
            ...(input.name !== undefined ? { name: input.name.trim() } : {}),
            ...(input.code !== undefined ? { code: normalizeCode(input.code) } : {}),
            ...(input.max_students !== undefined ? { max_students: input.max_students } : {}),
            ...(input.timezone !== undefined ? { timezone: input.timezone.trim() } : {}),
        };
        const updated = await Institution.findByIdAndUpdate(id, update, { new: true, runValidators: true });

        await AuditLogService.record({
            actorUserId,
            actorRole: 'superadmin',
            action: 'platform.institution.updated',
            entityType: 'Institution',
            entityId: id,
            institutionId: id,
            before: current,
            after: updated,
            ...requestContext,
        });

        return this.getById(id);
    }

    async changeStatus(id: string, status: string, actorUserId: string, requestContext: any = {}) {
        if (!VALID_STATUSES.includes(status as any)) throw new AppError('Estado de institución inválido', 400);
        const current = await Institution.findById(id);
        if (!current) throw new AppError('Institución no encontrada', 404);

        const allowed = current.status === 'sandbox' && status === 'active'
            || current.status === 'active' && status === 'suspended'
            || current.status === 'suspended' && status === 'active';
        if (!allowed) throw new AppError(`No se puede cambiar de ${current.status} a ${status}`, 409);

        const updated = await Institution.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
        await AuditLogService.record({
            actorUserId,
            actorRole: 'superadmin',
            action: 'platform.institution.status_changed',
            entityType: 'Institution',
            entityId: id,
            institutionId: id,
            before: { status: current.status },
            after: { status },
            ...requestContext,
        });

        return this.getById(id);
    }

    async resendInvitation(id: string, actorUserId: string, requestContext: any = {}) {
        const institution = await Institution.findById(id).select('primary_admin_user_id');
        if (!institution?.primary_admin_user_id) throw new AppError('La institución no tiene administrador principal', 409);
        const invitation = await AuthService.issueInstitutionAdminInvitation(institution.primary_admin_user_id);

        await AuditLogService.record({
            actorUserId,
            actorRole: 'superadmin',
            action: 'platform.institution.primary_admin_invitation_resent',
            entityType: 'User',
            entityId: institution.primary_admin_user_id,
            institutionId: id,
            before: null,
            after: { invitation_sent: invitation.sent },
            ...requestContext,
        });

        return invitation;
    }
}

export default new PlatformService();
