import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { runWithTenantScope } from '../src/tenant/tenant-context.js';

let Grade: typeof import('../src/models/GradeModel.js').default;
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri('educonnect_tenant_test'));
    ({ default: Grade } = await import('../src/models/GradeModel.js'));
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

test('tenant plugin writes and reads only the active institution context', async () => {
    const institutionA = new mongoose.Types.ObjectId();
    const institutionB = new mongoose.Types.ObjectId();

    const legacyA = await Grade.create({ name: 'Grado A', institution_id: institutionA });
    const legacyB = await Grade.create({ name: 'Grado B', institution_id: institutionB });

    const result = await runWithTenantScope(
        { institutionId: institutionA.toString(), enforce: true },
        async () => {
            const created = await Grade.create({ name: 'Grado creado en A' });
            const visible = await Grade.find();
            const hidden = await Grade.findById(legacyB._id);

            return { created, visible, hidden };
        }
    );

    expect(result.created.institution_id?.toString()).toBe(institutionA.toString());
    expect(result.visible).toHaveLength(2);
    expect(result.visible.every((grade) => grade.institution_id?.toString() === institutionA.toString())).toBe(true);
    expect(result.hidden).toBeNull();
});
