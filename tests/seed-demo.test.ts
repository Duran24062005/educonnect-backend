import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Enrollment from '../src/models/EnrollmentModel.js';
import Group from '../src/models/GroupModel.js';

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

        expect(Object.keys(firstRun.counts)).toHaveLength(32);
        expect(Object.values(firstRun.counts).every((count) => count > 0)).toBe(true);
        expect(firstRun.counts.Grade).toBe(6);
        expect(firstRun.counts.Group).toBe(12);
        expect(firstRun.counts.Student).toBe(60);
        expect(firstRun.counts.Enrollment).toBe(60);
        expect(firstRun.counts.StudentGuardian).toBe(2);
        expect(firstRun.counts.ClassSession).toBe(2);
        expect(firstRun.counts.ScheduleEntry).toBe(2);
        expect(firstRun.counts.LessonPlan).toBe(1);
        expect(firstRun.counts.AttendanceRecord).toBe(2);

        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) throw new Error('DATABASE_URL no fue configurada por el test');
        await mongoose.connect(databaseUrl);
        try {
            const seededGroups = await Group.find({ institution_id: firstRun.institutionId }).select('_id name').lean();
            expect(seededGroups.map((group) => group.name).sort()).toEqual([
                '10A', '10B', '11A', '11B', '6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B',
            ]);
            for (const group of seededGroups) {
                await expect(
                    Enrollment.countDocuments({ institution_id: firstRun.institutionId, group_id: group._id, status: 'active' }),
                ).resolves.toBe(5);
            }
        } finally {
            await mongoose.disconnect();
        }

        const secondRun = await runSeed();

        expect(secondRun.counts).toEqual(firstRun.counts);
        expect(Object.values(secondRun.stats).every(({ created }) => created === 0)).toBe(true);
        expect(Object.values(secondRun.stats).some(({ updated }) => updated > 0)).toBe(true);

        const resetRun = await runSeed({ reset: true });

        expect(resetRun.counts).toEqual(firstRun.counts);
        expect(Object.values(resetRun.stats).some(({ created }) => created > 0)).toBe(true);
    }, 30000);
});
