import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let app;
let appConfig;
let User;
let Person;
let mongoServer;

const ADMIN = {
    email: 'admin.test@educonnect.local',
    password: 'Admin12345!',
    first_name: 'Admin',
    last_name: 'Tester',
    document_number: 'ADM-9001',
};

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key';

    mongoServer = await MongoMemoryServer.create();
    process.env.DATABASE_URL = mongoServer.getUri('educonnect_test');

    ({ default: app } = await import('../src/app.js'));
    ({ default: appConfig } = await import('../src/config/config.js'));
    ({ default: User } = await import('../src/models/UserModel.js'));
    ({ default: Person } = await import('../src/models/PersonModel.js'));

    await appConfig.connectDatabase();
});

afterAll(async () => {
    await appConfig.disconnectDatabase();
    await mongoServer.stop();
    await mongoose.connection.close();
});

describe('EduConnect API', () => {
    test('returns health status', async () => {
        const response = await request(app).get('/health');
        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('ok');
    });

    test('auth: register + login flow works', async () => {
        const registerRes = await request(app).post('/api/auth/register').send({
            email: ADMIN.email,
            password: ADMIN.password,
            password_confirm: ADMIN.password,
        });

        expect(registerRes.statusCode).toBe(201);
        expect(registerRes.body.data.token).toBeDefined();

        const completeProfileRes = await request(app)
            .post('/api/auth/complete-profile')
            .set('Authorization', `Bearer ${registerRes.body.data.token}`)
            .send({
                first_name: ADMIN.first_name,
                last_name: ADMIN.last_name,
                born_date: '1995-01-01',
                document_type: 'CC',
                document_number: ADMIN.document_number,
                requested_role: 'Student',
            });

        expect(completeProfileRes.statusCode).toBe(200);

        const person = await Person.findOne({ document_number: ADMIN.document_number });
        await Person.findByIdAndUpdate(person._id, { role: 'Admin', status: 'active' });

        const loginRes = await request(app).post('/api/auth/login').send({
            email: ADMIN.email,
            password: ADMIN.password,
        });

        expect(loginRes.statusCode).toBe(200);
        expect(loginRes.body.data.token).toBeDefined();
    });

    test('create student and list students', async () => {
        const adminLogin = await request(app).post('/api/auth/login').send({
            email: ADMIN.email,
            password: ADMIN.password,
        });
        const adminToken = adminLogin.body.data.token;

        const registerStudent = await request(app).post('/api/auth/register').send({
            email: 'student.test@educonnect.local',
            password: 'Student123!',
            password_confirm: 'Student123!',
        });

        const studentToken = registerStudent.body.data.token;

        const completeStudent = await request(app)
            .post('/api/auth/complete-profile')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
                first_name: 'Student',
                last_name: 'Test',
                born_date: '2012-03-10',
                document_type: 'CC',
                document_number: 'STU-3001',
                requested_role: 'Student',
            });

        expect(completeStudent.statusCode).toBe(200);

        const studentUser = await User.findOne({ email: 'student.test@educonnect.local' }).populate('person_id');

        const approveRes = await request(app)
            .post(`/api/users/${studentUser._id}/approve`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ role: 'student' });

        expect(approveRes.statusCode).toBe(200);

        const listRes = await request(app)
            .get('/api/users/role/student?page=1&limit=10')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(listRes.statusCode).toBe(200);
        expect(Array.isArray(listRes.body.data.users)).toBe(true);
        expect(listRes.body.data.users.length).toBeGreaterThan(0);
    });

    test('returns error for invalid object id in params', async () => {
        const adminLogin = await request(app).post('/api/auth/login').send({
            email: ADMIN.email,
            password: ADMIN.password,
        });

        const response = await request(app)
            .get('/api/users/not-a-valid-id')
            .set('Authorization', `Bearer ${adminLogin.body.data.token}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Invalid request input');
    });
});
