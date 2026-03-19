import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodSchema } from 'zod';
import AppError from '../utils/AppError.js';

type RequestSchemas = {
    body?: ZodSchema;
    params?: ZodSchema;
    query?: ZodSchema;
};

const assignParsed = (target: Record<string, unknown>, parsed: Record<string, unknown>): void => {
    Object.keys(target).forEach((key) => delete target[key]);
    Object.assign(target, parsed);
};

export const validateRequest = (schemas: RequestSchemas = {}): RequestHandler => {
    const { body, params, query } = schemas;

    return (req: Request, _res: Response, next: NextFunction) => {
        const issues: Array<Record<string, unknown>> = [];

        if (body) {
            const result = body.safeParse(req.body);
            if (!result.success) {
                issues.push(...result.error.issues.map((issue) => ({ ...issue, location: 'body' })));
            } else {
                assignParsed(req.body as Record<string, unknown>, result.data as Record<string, unknown>);
            }
        }

        if (params) {
            const result = params.safeParse(req.params);
            if (!result.success) {
                issues.push(...result.error.issues.map((issue) => ({ ...issue, location: 'params' })));
            } else {
                assignParsed(req.params as Record<string, unknown>, result.data as Record<string, unknown>);
            }
        }

        if (query) {
            const result = query.safeParse(req.query);
            if (!result.success) {
                issues.push(...result.error.issues.map((issue) => ({ ...issue, location: 'query' })));
            } else {
                assignParsed(req.query as Record<string, unknown>, result.data as Record<string, unknown>);
            }
        }

        if (issues.length > 0) {
            return next(new AppError('Invalid request input', 400, issues));
        }

        return next();
    };
};
