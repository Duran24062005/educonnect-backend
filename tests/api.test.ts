import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let app;
let appConfig;
let User;
let Person;
let mongoServer;
let storageSequence = 0;
let mockStorageService;

const ADMIN = {
    email: 'admin.test@educonnect.local',
    password: 'Admin12345!',
    first_name: 'Admin',
    last_name: 'Tester',
    document_number: 'ADM-9001',
};

const seedListedUser = async (index: number) => {
    const user = await User.create({
        email: `listed.user.${index}@educonnect.local`,
        hash_password: `Password${index}!`,
    });

    const person = await Person.create({
        user_id: user._id,
        first_name: `Listed${index}`,
        last_name: 'User',
        role: 'Student',
        status: 'active',
        born_date: '2012-01-01',
        document_type: 'CC',
        document_number: `LIST-${index}`,
    });

    await User.findByIdAndUpdate(user._id, { person_id: person._id });
    return user;
};

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_S3_BUCKET = 'educonnect-test-bucket';
    process.env.AWS_SIGNED_URL_TTL_SECONDS = '900';

    mongoServer = await MongoMemoryServer.create();
    process.env.DATABASE_URL = mongoServer.getUri('educonnect_test');

    mockStorageService = {
        uploads: [],
        deletions: [],
        async uploadProfilePhoto({ userId, originalName }) {
            const key = `profiles/${userId}/${Date.now()}-${originalName}`;
            const signedUrl = `https://signed.example/${encodeURIComponent(key)}?v=${++storageSequence}`;
            const result = {
                provider: 'aws-s3',
                bucket: process.env.AWS_S3_BUCKET,
                key,
                signedUrl,
                signedUrlExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
            };
            this.uploads.push(result);
            return result;
        },
        async uploadActivitySubmission() {
            throw new Error('Not implemented in api.test');
        },
        async deleteObject(input) {
            this.deletions.push(input);
        },
        async buildSignedUrl({ bucket, key }) {
            return {
                url: `https://signed.example/${encodeURIComponent(key)}?refresh=${++storageSequence}`,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            };
        },
        isSignedUrlStale(expiresAt) {
            if (!expiresAt) return true;
            return new Date(expiresAt).getTime() <= (Date.now() + 60_000);
        },
    };
    globalThis.__EDUCONNECT_STORAGE_SERVICE__ = mockStorageService;

    ({ default: app } = await import('../src/app.js'));
    ({ default: appConfig } = await import('../src/config/config.js'));
    ({ default: User } = await import('../src/models/UserModel.js'));
    ({ default: Person } = await import('../src/models/PersonModel.js'));

    await appConfig.connectDatabase();
});

afterAll(async () => {
    delete globalThis.__EDUCONNECT_STORAGE_SERVICE__;
    await appConfig.disconnectDatabase();
    await mongoServer.stop();
    await mongoose.connection.close();
});

describe('EduConnect API', () => {
    beforeEach(() => {
        mockStorageService.uploads = [];
        mockStorageService.deletions = [];
    });

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

    test('respects page and limit when listing users for admin', async () => {
        const adminLogin = await request(app).post('/api/auth/login').send({
            email: ADMIN.email,
            password: ADMIN.password,
        });

        const adminToken = adminLogin.body.data.token;

        await Promise.all([
            seedListedUser(1),
            seedListedUser(2),
            seedListedUser(3),
            seedListedUser(4),
        ]);

        const firstPageRes = await request(app)
            .get('/api/users?page=1&limit=2')
            .set('Authorization', `Bearer ${adminToken}`);

        const secondPageRes = await request(app)
            .get('/api/users?page=2&limit=2')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(firstPageRes.statusCode).toBe(200);
        expect(secondPageRes.statusCode).toBe(200);

        expect(firstPageRes.body.data.pagination.current_page).toBe(1);
        expect(firstPageRes.body.data.pagination.limit).toBe(2);
        expect(secondPageRes.body.data.pagination.current_page).toBe(2);
        expect(secondPageRes.body.data.pagination.limit).toBe(2);

        expect(Array.isArray(firstPageRes.body.data.users)).toBe(true);
        expect(Array.isArray(secondPageRes.body.data.users)).toBe(true);
        expect(firstPageRes.body.data.users).toHaveLength(2);
        expect(secondPageRes.body.data.users).toHaveLength(2);
        expect(secondPageRes.body.data.users[0]?._id).not.toBe(firstPageRes.body.data.users[0]?._id);
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

    test('uploads profile photo to S3 and refreshes stale signed url on /auth/me', async () => {
        const registerRes = await request(app).post('/api/auth/register').send({
            email: 'photo.test@educonnect.local',
            password: 'Student123!',
            password_confirm: 'Student123!',
        });

        const completeProfileRes = await request(app)
            .post('/api/auth/complete-profile')
            .set('Authorization', `Bearer ${registerRes.body.data.token}`)
            .send({
                first_name: 'Photo',
                last_name: 'Tester',
                born_date: '2012-03-10',
                document_type: 'CC',
                document_number: 'PHOTO-3001',
                requested_role: 'Student',
            });

        const user = await User.findOne({ email: 'photo.test@educonnect.local' }).populate('person_id');
        await Person.findByIdAndUpdate(user.person_id._id, { status: 'active' });

        const loginRes = await request(app).post('/api/auth/login').send({
            email: 'photo.test@educonnect.local',
            password: 'Student123!',
        });

        const uploadRes = await request(app)
            .patch(`/api/users/${user._id}/profile-photo`)
            .set('Authorization', `Bearer ${loginRes.body.data.token}`)
            .attach('profile_photo', Buffer.from('fake-image'), 'avatar.png');

        expect(uploadRes.statusCode).toBe(200);
        expect(uploadRes.body.data.profile_photo_url).toContain('https://signed.example/');
        expect(mockStorageService.uploads).toHaveLength(1);

        await Person.findByIdAndUpdate(user.person_id._id, {
            storage_signed_url: 'https://signed.example/expired-avatar',
            storage_signed_url_expires_at: new Date(Date.now() - 5 * 60 * 1000),
            profile_photo_url: 'https://signed.example/expired-avatar',
            status: 'active',
        });

        const reloginRes = await request(app).post('/api/auth/login').send({
            email: 'photo.test@educonnect.local',
            password: 'Student123!',
        });

        const meRes = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${reloginRes.body.data.token}`);

        expect(meRes.statusCode).toBe(200);
        expect(meRes.body.data.person.profile_photo_url).toContain('?refresh=');

        const refreshedPerson = await Person.findById(user.person_id._id);
        expect(refreshedPerson.profile_photo_url).toContain('?refresh=');
        expect(refreshedPerson.storage_key).toContain('profiles/');
    });
});
