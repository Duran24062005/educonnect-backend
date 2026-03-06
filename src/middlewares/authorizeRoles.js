import AppError from '../utils/AppError.js';

const normalizeRole = (role) => {
    const value = String(role || '').trim().toLowerCase();
    if (value === 'guardian') return 'parent';
    return value;
};

export const authorizeRoles = (...allowedRoles) => {
    const normalizedAllowedRoles = allowedRoles.map(normalizeRole).filter(Boolean);

    return (req, _res, next) => {
        const currentRole = normalizeRole(req.userRole);

        if (!currentRole) {
            return next(new AppError('Role not found for current user', 403));
        }

        if (!normalizedAllowedRoles.includes(currentRole)) {
            return next(new AppError(`Forbidden: required roles [${normalizedAllowedRoles.join(', ')}]`, 403));
        }

        return next();
    };
};
