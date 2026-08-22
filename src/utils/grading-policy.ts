import AppError from './AppError.js';

export interface GradingLevel {
    code: string;
    label: string;
    min_score: number;
    max_score: number;
}

export interface GradingPolicy {
    min_score: number;
    max_score: number;
    passing_score: number;
    performance_levels: GradingLevel[];
}

export const DEFAULT_GRADING_POLICY = {
    min_score: 0,
    max_score: 10,
    passing_score: 6,
    performance_levels: [
        { code: 'SUPERIOR', label: 'Superior', min_score: 9, max_score: 10 },
        { code: 'ALTO', label: 'Alto', min_score: 8, max_score: 8.99 },
        { code: 'BASICO', label: 'Básico', min_score: 6, max_score: 7.99 },
        { code: 'BAJO', label: 'Bajo', min_score: 0, max_score: 5.99 },
    ],
};

const buildDefaultLevels = (minScore: number, maxScore: number, passingScore: number) => {
    const range = maxScore - minScore;
    const basicStart = Math.max(minScore, Math.min(passingScore, maxScore));
    const highStart = minScore + range * 0.6;
    const superiorStart = minScore + range * 0.8;
    return [
        { code: 'SUPERIOR', label: 'Superior', min_score: superiorStart, max_score: maxScore },
        { code: 'ALTO', label: 'Alto', min_score: Math.min(highStart, superiorStart), max_score: Math.max(minScore, superiorStart - Number.EPSILON) },
        { code: 'BASICO', label: 'Básico', min_score: basicStart, max_score: Math.max(basicStart, highStart - Number.EPSILON) },
        { code: 'BAJO', label: 'Bajo', min_score: minScore, max_score: Math.max(minScore, basicStart - Number.EPSILON) },
    ];
};

export const normalizeGradingPolicy = (policy: any = {}): GradingPolicy => {
    const minScore = Number.isFinite(Number(policy.min_score)) ? Number(policy.min_score) : DEFAULT_GRADING_POLICY.min_score;
    const maxScore = Number.isFinite(Number(policy.max_score)) ? Number(policy.max_score) : DEFAULT_GRADING_POLICY.max_score;
    const passingScore = Number.isFinite(Number(policy.passing_score)) ? Number(policy.passing_score) : DEFAULT_GRADING_POLICY.passing_score;
    const levels = Array.isArray(policy.performance_levels) && policy.performance_levels.length
        ? policy.performance_levels.map((level: any) => ({
            code: String(level.code || '').trim().toUpperCase(),
            label: String(level.label || level.code || '').trim(),
            min_score: Number(level.min_score),
            max_score: Number(level.max_score),
        }))
        : (minScore === 0 && maxScore === 10 && passingScore === 6
            ? DEFAULT_GRADING_POLICY.performance_levels
            : buildDefaultLevels(minScore, maxScore, passingScore));

    return { min_score: minScore, max_score: maxScore, passing_score: passingScore, performance_levels: levels };
};

export const assertValidGradingPolicy = (rawPolicy: any = {}): ReturnType<typeof normalizeGradingPolicy> => {
    const policy = normalizeGradingPolicy(rawPolicy);
    if (!Number.isFinite(policy.min_score) || !Number.isFinite(policy.max_score) || policy.min_score >= policy.max_score) {
        throw new AppError('La escala SIEE requiere un mínimo menor que el máximo', 400);
    }
    if (policy.min_score < 0 || policy.max_score > 100) {
        throw new AppError('La escala SIEE debe estar entre 0 y 100', 400);
    }
    if (policy.passing_score < policy.min_score || policy.passing_score > policy.max_score) {
        throw new AppError('El umbral de aprobación debe estar dentro de la escala SIEE', 400);
    }
    if (!policy.performance_levels.length || policy.performance_levels.some((level: GradingLevel) => (
        !level.code || !level.label || level.min_score < policy.min_score || level.max_score > policy.max_score || level.min_score > level.max_score
    ))) {
        throw new AppError('Los niveles de desempeño no coinciden con la escala SIEE', 400);
    }
    return policy;
};

export const getPerformanceLevel = (score: number, rawPolicy: any = {}) => {
    const policy = normalizeGradingPolicy(rawPolicy);
    const value = Number(score);
    const level = [...policy.performance_levels]
        .sort((left, right) => right.min_score - left.min_score)
        .find((candidate) => value >= candidate.min_score && value <= candidate.max_score);
    return level?.code || 'BAJO';
};

export const createPerformanceLevels = (rawPolicy: any = {}) => normalizeGradingPolicy(rawPolicy).performance_levels.reduce((result: Record<string, number>, level: GradingLevel) => {
    result[level.code] = 0;
    return result;
}, {});

export const countPerformanceLevels = (items: any[], getScore: (item: any) => number, rawPolicy: any = {}) => {
    const result = createPerformanceLevels(rawPolicy);
    for (const item of items) {
        const level = getPerformanceLevel(getScore(item), rawPolicy);
        result[level] = (result[level] || 0) + 1;
    }
    return result;
};
