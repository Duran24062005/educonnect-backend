import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;
let runSeed: (options?: { reset?: boolean }) => Promise<{
    institutionId: string;
    counts: Record<string, number>;
    stats: Record<string, { created: number; updated: number }>;
}>;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'seed-demo-test-secret';
    process.env.SEED_NAMESPACE = 'integration';
    process.env.SEED_INSTITUTION_CODE = 'EDU-INTEGRATION';
    process.env.SEED_PASSWORD = 'SeedTest123!';
    process.env.SEED_RESET_CONFIRM = 'EDUCONNECT-RESET';

    mongoServer = await MongoMemoryServer.create();
    process.env.DATABASE_URL = mongoServer.getUri('educonnect_seed_demo_test');
    ({ runSeed } = await import('../scripts/seed-demo.js'));
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe('seed-demo', () => {
    it('covers every persistent model and remains idempotent', async () => {
        const firstRun = await runSeed();

        expect(Object.keys(firstRun.counts)).toHaveLength(30);
        expect(Object.values(firstRun.counts).every((count) => count > 0)).toBe(true);
        expect(firstRun.counts.Student).toBe(2);
        expect(firstRun.counts.StudentGuardian).toBe(2);
        expect(firstRun.counts.ClassSession).toBe(2);
        expect(firstRun.counts.AttendanceRecord).toBe(2);

        const secondRun = await runSeed();

        expect(secondRun.counts).toEqual(firstRun.counts);
        expect(Object.values(secondRun.stats).every(({ created }) => created === 0)).toBe(true);
        expect(Object.values(secondRun.stats).some(({ updated }) => updated > 0)).toBe(true);

        const resetRun = await runSeed({ reset: true });

        expect(resetRun.counts).toEqual(firstRun.counts);
        expect(Object.values(resetRun.stats).some(({ created }) => created > 0)).toBe(true);
    });
});
