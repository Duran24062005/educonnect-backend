import mongoose, { type Schema } from 'mongoose';
import AppError from '../utils/AppError.js';
import { getTenantScope } from './tenant-context.js';

const institutionPath = {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    default: null,
    index: true,
};

const sameInstitution = (left: unknown, right: string): boolean => String(left) === String(right);

/**
 * Applies the current institution to tenant-owned documents and queries.
 * It is inactive until TENANT_DATA_ISOLATION=true, which allows the legacy
 * dataset to be migrated deliberately instead of being hidden by accident.
 */
export const tenantPlugin = (schema: Schema): void => {
    if (!schema.path('institution_id')) {
        schema.add({ institution_id: institutionPath });
    }

    schema.pre('save', function (next) {
        const scope = getTenantScope();
        if (!scope?.enforce) return next();

        const document = this as unknown as Record<string, unknown>;
        if (document.institution_id && !sameInstitution(document.institution_id, scope.institutionId)) {
            return next(new AppError('El documento pertenece a otra institución', 403));
        }

        document.institution_id = scope.institutionId;
        return next();
    });

    schema.pre(
        ['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'],
        function (next) {
            const scope = getTenantScope();
            const query = this as unknown as {
                getFilter: () => Record<string, unknown>;
                setQuery: (filter: Record<string, unknown>) => void;
                getOptions: () => Record<string, unknown>;
                getUpdate?: () => Record<string, unknown> | undefined;
                setUpdate?: (update: Record<string, unknown>) => void;
            };

            if (!scope?.enforce || query.getOptions().skipTenant) return next();

            const filter = query.getFilter();
            if (filter.institution_id && !sameInstitution(filter.institution_id, scope.institutionId)) {
                return next(new AppError('La consulta pertenece a otra institución', 403));
            }

            query.setQuery({ ...filter, institution_id: scope.institutionId });

            if (query.getOptions().upsert && query.getUpdate && query.setUpdate) {
                const update = query.getUpdate() || {};
                update.$setOnInsert = {
                    ...(update.$setOnInsert as Record<string, unknown> || {}),
                    institution_id: scope.institutionId,
                };
                query.setUpdate(update);
            }

            return next();
        }
    );

    schema.pre('aggregate', function (next) {
        const scope = getTenantScope();
        const aggregate = this as unknown as {
            options?: Record<string, unknown>;
            pipeline: () => Array<Record<string, unknown>>;
        };

        if (scope?.enforce && !aggregate.options?.skipTenant) {
            aggregate.pipeline().unshift({ $match: { institution_id: scope.institutionId } });
        }

        next();
    });
};
