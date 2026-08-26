import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let app;
let appConfig;
let User;
let Person;
let Session;
let PasswordResetRequest;
let mongoServer;
let mockEmailService;

const createUser = async ({
    email = 'recovery@example.com',
    status = 'active',
    role = 'Student',
} = {}) => {
    const user = await User.create({
        email,
        hash_password: 'OldPassword123!',
    });

    const person = await Person.create({
        user_id: user._id,
        first_name: 'Recovery',
        last_name: 'User',
        role,
        status,
        born_date: '2012-01-01',
        document_type: 'CC',
        document_number: `REC-${String(user._id).slice(-8)}`,
    });

    await User.findByIdAndUpdate(user._id, { person_id: person._id });
    return user;
};

const requestCode = async (email: string) => {
    const response = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email });

    expect(response.statusCode).toBe(202);
    const resetEmail = mockEmailService.sentEmails.at(-1);
    expect(resetEmail.template_name).toBe('password_reset');
    return resetEmail.template_data.codigo;
};

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'password-recovery-test-secret';

    mongoServer = await MongoMemoryServer.create();
    process.env.DATABASE_URL = mongoServer.getUri('educonnect_password_recovery_test');

    mockEmailService = {
        sentEmails: [],
        async sendTemplateEmail(payload) {
            const result = { sent: true, mocked: true, ...payload };
            this.sentEmails.push(result);
            return result;
        },
    };
    globalThis.__EDUCONNECT_EMAIL_SERVICE__ = mockEmailService;

    ({ default: app } = await import('../src/app.js'));
    ({ default: appConfig } = await import('../src/config/config.js'));
    ({ default: User } = await import('../src/models/UserModel.js'));
    ({ default: Person } = await import('../src/models/PersonModel.js'));
    ({ default: Session } = await import('../src/models/SessionModel.js'));
    ({ default: PasswordResetRequest } = await import('../src/models/PasswordResetRequestModel.js'));

    await appConfig.connectDatabase();
});

beforeEach(async () => {
    mockEmailService.sentEmails = [];
    await Promise.all([
        User.deleteMany({}),
        Person.deleteMany({}),
        Session.deleteMany({}),
        PasswordResetRequest.deleteMany({}),
    ]);
});

afterAll(async () => {
    delete globalThis.__EDUCONNECT_EMAIL_SERVICE__;
    await appConfig.disconnectDatabase();
    await mongoServer.stop();
    await mongoose.connection.close();
});

describe('Password recovery', () => {
    test('sends a six-digit code and keeps unknown emails indistinguishable', async () => {
        await createUser();

        const code = await requestCode('recovery@example.com');
        expect(code).toMatch(/^\d{6}$/);

        const unknownResponse = await request(app)
            .post('/api/auth/request-password-reset')
            .send({ email: 'missing@example.com' });

        expect(unknownResponse.statusCode).toBe(202);
        expect(unknownResponse.body.message).toBe(
            'Si el correo está registrado, recibirás un código para recuperar tu contraseña.'
        );
        expect(mockEmailService.sentEmails).toHaveLength(1);
    });

    test('validates the code, changes the password and revokes previous sessions', async () => {
        await createUser();

        const oldLogin = await request(app).post('/api/auth/login').send({
            email: 'recovery@example.com',
            password: 'OldPassword123!',
        });
        expect(oldLogin.statusCode).toBe(200);

        const code = await requestCode('recovery@example.com');
        const verifyResponse = await request(app)
            .post('/api/auth/verify-password-reset-code')
            .send({ email: 'recovery@example.com', code });

        expect(verifyResponse.statusCode).toBe(200);
        const resetToken = verifyResponse.body.data.reset_token;

        const resetResponse = await request(app)
            .post('/api/auth/reset-password')
            .send({
                reset_token: resetToken,
                new_password: 'NewPassword123!',
                new_password_confirm: 'NewPassword123!',
            });

        expect(resetResponse.statusCode).toBe(200);

        const revokedResponse = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${oldLogin.body.data.token}`);
        expect(revokedResponse.statusCode).toBe(401);

        const newLogin = await request(app).post('/api/auth/login').send({
            email: 'recovery@example.com',
            password: 'NewPassword123!',
        });
        expect(newLogin.statusCode).toBe(200);
    });

    test('rejects an invalid code after five attempts and does not accept the valid code', async () => {
        await createUser();
        const code = await requestCode('recovery@example.com');
        const wrongCode = code === '000000' ? '999999' : '000000';

        for (let attempt = 0; attempt < 5; attempt += 1) {
            const response = await request(app)
                .post('/api/auth/verify-password-reset-code')
                .send({ email: 'recovery@example.com', code: wrongCode });
            expect(response.statusCode).toBe(400);
        }

        const validCodeResponse = await request(app)
            .post('/api/auth/verify-password-reset-code')
            .send({ email: 'recovery@example.com', code });
        expect(validCodeResponse.statusCode).toBe(400);
    });

    test('rejects expired and reused recovery challenges', async () => {
        await createUser();
        const code = await requestCode('recovery@example.com');
        await PasswordResetRequest.updateMany({}, { $set: { expires_at: new Date(Date.now() - 1) } });

        const expiredResponse = await request(app)
            .post('/api/auth/verify-password-reset-code')
            .send({ email: 'recovery@example.com', code });
        expect(expiredResponse.statusCode).toBe(400);

        const freshCode = await requestCode('recovery@example.com');
        const verified = await request(app)
            .post('/api/auth/verify-password-reset-code')
            .send({ email: 'recovery@example.com', code: freshCode });
        const resetToken = verified.body.data.reset_token;

        const resetPayload = {
            reset_token: resetToken,
            new_password: 'NewPassword123!',
            new_password_confirm: 'NewPassword123!',
        };
        expect((await request(app).post('/api/auth/reset-password').send(resetPayload)).statusCode).toBe(200);
        expect((await request(app).post('/api/auth/reset-password').send(resetPayload)).statusCode).toBe(400);
    });

    test('changes the password for a blocked account without bypassing login status checks', async () => {
        await createUser({ email: 'blocked@example.com', status: 'blocked' });
        const code = await requestCode('blocked@example.com');
        const verified = await request(app)
            .post('/api/auth/verify-password-reset-code')
            .send({ email: 'blocked@example.com', code });

        const resetResponse = await request(app)
            .post('/api/auth/reset-password')
            .send({
                reset_token: verified.body.data.reset_token,
                new_password: 'NewPassword123!',
                new_password_confirm: 'NewPassword123!',
            });
        expect(resetResponse.statusCode).toBe(200);

        const loginResponse = await request(app).post('/api/auth/login').send({
            email: 'blocked@example.com',
            password: 'NewPassword123!',
        });
        expect(loginResponse.statusCode).toBe(403);
    });
});
