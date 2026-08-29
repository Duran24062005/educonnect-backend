import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let app: any;
let appConfig: any;
let User: any;
let Person: any;
let Institution: any;
let mongoServer: any;
let emailAdapter: any;

const createActor = async (role: 'SuperAdmin' | 'Admin', suffix: string) => {
    const user = await User.create({ email: `${role.toLowerCase()}-${suffix}@educonnect.local`, hash_password: 'Password123!' });
    const person = await Person.create({
        user_id: user._id,
        first_name: role === 'SuperAdmin' ? 'Operador' : 'Admin',
        last_name: 'Pruebas',
        role,
        status: 'active',
        document_type: 'CC',
        document_number: `${role}-${suffix}`,
    });
    await User.findByIdAndUpdate(user._id, { person_id: person._id });
    const { generateToken } = await import('../src/utils/jwt.js');
    return generateToken(user._id.toString(), role);
};

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'platform-test-secret';
    mongoServer = await MongoMemoryServer.create();
    process.env.DATABASE_URL = mongoServer.getUri('educonnect_platform_test');
    emailAdapter = { sentEmails: [], async sendTemplateEmail(payload: any) { this.sentEmails.push(payload); return { sent: true, mocked: true, ...payload }; } };
    globalThis.__EDUCONNECT_EMAIL_SERVICE__ = emailAdapter;

    ({ default: app } = await import('../src/app.js'));
    ({ default: appConfig } = await import('../src/config/config.js'));
    ({ default: User } = await import('../src/models/UserModel.js'));
    ({ default: Person } = await import('../src/models/PersonModel.js'));
    ({ default: Institution } = await import('../src/models/InstitutionModel.js'));
    await appConfig.connectDatabase();
});

afterAll(async () => {
    delete globalThis.__EDUCONNECT_EMAIL_SERVICE__;
    await appConfig.disconnectDatabase();
    await mongoServer.stop();
    await mongoose.connection.close();
});

beforeEach(async () => {
    for (const collection of Object.values(mongoose.connection.collections)) await collection.deleteMany({});
    emailAdapter.sentEmails = [];
});

describe('Platform institution onboarding', () => {
    test('creates a public institution, active admin and unique rector', async () => {
        const token = await createActor('SuperAdmin', 'create');
        const response = await request(app)
            .post('/api/platform/institutions')
            .set('Authorization', `Bearer ${token}`)
            .send({
                institution: { name: 'Colegio Público Norte', code: 'CP-NORTE', type: 'public' },
                primary_admin: { first_name: 'Rectora', last_name: 'Norte', email: 'rectora.norte@educonnect.local', document_type: 'CC', document_number: '123456789', phone: '3000000000' },
            });

        expect(response.status).toBe(201);
        expect(response.body.data.institution.status).toBe('sandbox');
        expect(response.body.data.institution.primary_admin.email).toBe('rectora.norte@educonnect.local');
        expect(response.body.data.institution.rector_user_id).toBe(response.body.data.institution.primary_admin_user_id);
        expect(response.body.data.invitation).toEqual({ sent: true, skipped: false });
        expect(emailAdapter.sentEmails).toHaveLength(1);
        expect(emailAdapter.sentEmails[0].template_name).toBe('reset_password.html');

        const storedAdmin = await User.findOne({ email: 'rectora.norte@educonnect.local' }).populate('person_id');
        const storedInstitution = await Institution.findOne({ code: 'CP-NORTE' });
        expect(storedAdmin.institution_id.toString()).toBe(storedInstitution._id.toString());
        expect(storedAdmin.person_id.role).toBe('Admin');
        expect(storedAdmin.person_id.status).toBe('active');
    });

    test('creates a private institution without a rector and lists it globally', async () => {
        const token = await createActor('SuperAdmin', 'private');
        const createResponse = await request(app)
            .post('/api/platform/institutions')
            .set('Authorization', `Bearer ${token}`)
            .send({
                institution: { name: 'Colegio Privado Centro', code: 'CP-CENTRO', type: 'private' },
                primary_admin: { first_name: 'Admin', last_name: 'Centro', email: 'admin.centro@educonnect.local', document_type: 'CC', document_number: '987654321' },
            });
        expect(createResponse.status).toBe(201);
        expect(createResponse.body.data.institution.rector_user_id).toBeNull();

        const listResponse = await request(app).get('/api/platform/institutions?search=centro').set('Authorization', `Bearer ${token}`);
        expect(listResponse.status).toBe(200);
        expect(listResponse.body.data.institutions).toHaveLength(1);
        expect(listResponse.body.data.institutions[0].code).toBe('CP-CENTRO');
    });

    test('rejects duplicate institution or administrator identity data', async () => {
        const token = await createActor('SuperAdmin', 'dup');
        const payload = {
            institution: { name: 'Colegio Duplicado', code: 'DUPLICADO', type: 'public' },
            primary_admin: { first_name: 'Admin', last_name: 'Uno', email: 'duplicate@educonnect.local', document_type: 'CC', document_number: 'DUP-001' },
        };
        expect((await request(app).post('/api/platform/institutions').set('Authorization', `Bearer ${token}`).send(payload)).status).toBe(201);
        const duplicateCode = await request(app).post('/api/platform/institutions').set('Authorization', `Bearer ${token}`).send({ ...payload, primary_admin: { ...payload.primary_admin, email: 'other@educonnect.local', document_number: 'DUP-002' } });
        expect(duplicateCode.status).toBe(409);
        const duplicateEmail = await request(app).post('/api/platform/institutions').set('Authorization', `Bearer ${token}`).send({ institution: { ...payload.institution, code: 'OTRO-CODIGO' }, primary_admin: { ...payload.primary_admin, document_number: 'DUP-003' } });
        expect(duplicateEmail.status).toBe(409);
    });

    test('edits, activates, suspends and reactivates an institution', async () => {
        const token = await createActor('SuperAdmin', 'lifecycle');
        const created = await request(app).post('/api/platform/institutions').set('Authorization', `Bearer ${token}`).send({
            institution: { name: 'Colegio Ciclo', code: 'CICLO', type: 'public' },
            primary_admin: { first_name: 'Admin', last_name: 'Ciclo', email: 'ciclo@educonnect.local', document_type: 'CC', document_number: 'CICLO-001' },
        });
        const id = created.body.data.institution._id;
        const edited = await request(app).patch(`/api/platform/institutions/${id}`).set('Authorization', `Bearer ${token}`).send({ name: 'Colegio Ciclo Editado' });
        expect(edited.status).toBe(200);
        expect(edited.body.data.name).toBe('Colegio Ciclo Editado');
        expect((await request(app).patch(`/api/platform/institutions/${id}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'active' })).status).toBe(200);
        expect((await request(app).patch(`/api/platform/institutions/${id}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'suspended' })).status).toBe(200);
        expect((await request(app).patch(`/api/platform/institutions/${id}/status`).set('Authorization', `Bearer ${token}`).send({ status: 'active' })).body.data.status).toBe('active');
        expect((await request(app).post(`/api/platform/institutions/${id}/primary-admin/invitation`).set('Authorization', `Bearer ${token}`)).status).toBe(200);
    });

    test('assigns the first administrator to an institution without one', async () => {
        const token = await createActor('SuperAdmin', 'assign');
        const operator = await User.findOne({ email: 'superadmin-assign@educonnect.local' });
        const institution = await Institution.create({
            name: 'Institución Legacy',
            code: 'LEGACY',
            type: 'public',
            status: 'sandbox',
            created_by_user_id: operator._id,
        });

        const response = await request(app)
            .post(`/api/platform/institutions/${institution._id}/primary-admin`)
            .set('Authorization', `Bearer ${token}`)
            .send({ first_name: 'Admin', last_name: 'Legacy', email: 'admin.legacy@educonnect.local', document_type: 'CC', document_number: 'LEGACY-001' });

        expect(response.status).toBe(201);
        expect(response.body.data.institution.primary_admin.email).toBe('admin.legacy@educonnect.local');
        expect(response.body.data.institution.rector_user_id).toBe(response.body.data.institution.primary_admin_user_id);
        expect(response.body.data.invitation).toEqual({ sent: true, skipped: false });

        const assigned = await User.findOne({ email: 'admin.legacy@educonnect.local' }).populate('person_id');
        expect(assigned.person_id.role).toBe('Admin');
        expect(assigned.person_id.status).toBe('active');
        expect(assigned.person_id.institution_id.toString()).toBe(institution._id.toString());
        expect(emailAdapter.sentEmails).toHaveLength(1);
    });

    test('only SuperAdmin can access platform routes', async () => {
        const adminToken = await createActor('Admin', 'forbidden');
        const response = await request(app).get('/api/platform/institutions').set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).toBe(403);
    });
});
