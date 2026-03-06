import AppError from '../utils/AppError.js';

export const validateRequest = (schemas = {}) => {
    const { body, params, query } = schemas;
    const assignParsed = (target, parsed) => {
        Object.keys(target).forEach((key) => delete target[key]);
        Object.assign(target, parsed);
    };

    return (req, _res, next) => {
        const issues = [];

        if (body) {
            const result = body.safeParse(req.body);
            if (!result.success) {
                issues.push(...result.error.issues.map((issue) => ({ ...issue, location: 'body' })));
            } else {
                assignParsed(req.body, result.data);
            }
        }

        if (params) {
            const result = params.safeParse(req.params);
            if (!result.success) {
                issues.push(...result.error.issues.map((issue) => ({ ...issue, location: 'params' })));
            } else {
                assignParsed(req.params, result.data);
            }
        }

        if (query) {
            const result = query.safeParse(req.query);
            if (!result.success) {
                issues.push(...result.error.issues.map((issue) => ({ ...issue, location: 'query' })));
            } else {
                assignParsed(req.query, result.data);
            }
        }

        if (issues.length > 0) {
            return next(new AppError('Invalid request input', 400, issues));
        }

        return next();
    };
};
