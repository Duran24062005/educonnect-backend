import { apiModules } from '../src/modules/index.js';

describe('modular monolith composition', () => {
    it('registers every public API domain exactly once', () => {
        const names = apiModules.map((apiModule) => apiModule.name);
        const basePaths = apiModules.map((apiModule) => apiModule.basePath);

        expect(names).toEqual([
            'auth',
            'users',
            'students',
            'guardians',
            'academic',
            'groups',
            'evaluations',
            'analytics',
            'activities',
            'materials',
            'platform',
            'notifications',
            'institutions',
            'audit',
            'calendar',
            'attendance',
            'imports',
            'teachingAssignments',
            'lessonPlans',
        ]);
        expect(new Set(names).size).toBe(names.length);
        expect(new Set(basePaths).size).toBe(basePaths.length);
        expect(basePaths.every((basePath) => basePath.startsWith('/api/'))).toBe(true);
        expect(apiModules.every((apiModule) => typeof apiModule.router === 'function')).toBe(true);
    });
});
