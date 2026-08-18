import request from 'supertest';
import mongoose from 'mongoose';
import type { Model } from 'mongoose';
import type { Express } from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { StorageService } from '../src/services/storage/StorageService.js';

declare global {
    var __EDUCONNECT_EMAIL_SERVICE__: MockEmailService | undefined;
}

interface MockEmailService {
    sentEmails: Array<Record<string, unknown>>;
    sendTemplateEmail(payload: Record<string, unknown>): Promise<Record<string, unknown>>;
}

interface RegisteredUser {
    _id: mongoose.Types.ObjectId;
    email: string;
    person_id: {
        _id: mongoose.Types.ObjectId;
        role?: string;
        status?: string;
    };
}

let app: Express;
let appConfig: typeof import('../src/config/config.js').default;
let User: Model<any>;
let Person: Model<any>;
let Teacher: Model<any>;
let Student: Model<any>;
let Group: Model<any>;
let GroupTeacher: Model<any>;
let Area: Model<any>;
let Period: Model<any>;
let GradeItem: Model<any>;
let Grade: Model<any>;
let SchoolYear: Model<any>;
let Enrollment: Model<any>;
let mongoServer: MongoMemoryServer;
let mockStorageService: StorageService;
let mockEmailService: MockEmailService;

const registerUser = async ({
    email,
    password,
    role,
    document_number,
}: {
    email: string;
    password: string;
    role: string;
    document_number: string;
}): Promise<RegisteredUser> => {
    const registerRes = await request(app).post('/api/auth/register').send({
        email,
        password,
        password_confirm: password,
    });
    expect(registerRes.statusCode).toBe(201);

    const completeRes = await request(app)
        .post('/api/auth/complete-profile')
        .set('Authorization', `Bearer ${registerRes.body.data.token}`)
        .send({
            first_name: 'Primer',
            last_name: 'Apellido',
            born_date: '2012-01-01',
            document_type: 'CC',
            document_number,
            requested_role: role,
        });
    expect(completeRes.statusCode).toBe(200);

    const user = await User.findOne({ email }).populate('person_id');
    return user as RegisteredUser;
};

const activateAndLogin = async (email: string, password: string): Promise<string> => {
    const user = await User.findOne({ email }).populate('person_id');
    await Person.findByIdAndUpdate(user.person_id._id, { status: 'active' });
    const loginRes = await request(app).post('/api/auth/login').send({ email, password });
    expect(loginRes.statusCode).toBe(200);
    return loginRes.body.data.token;
};

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_S3_BUCKET = 'educonnect-test-bucket';
    process.env.AWS_SIGNED_URL_TTL_SECONDS = '900';

    mongoServer = await MongoMemoryServer.create();
    process.env.DATABASE_URL = mongoServer.getUri('educonnect_security_test');

    mockStorageService = {
        async uploadProfilePhoto() { throw new Error('Not implemented in security-scope test'); },
        async uploadActivitySubmission() { throw new Error('Not implemented in security-scope test'); },
        async deleteObject() {},
        async buildSignedUrl() {
            return { url: 'https://signed.example/refresh', expiresAt: new Date(Date.now() + 15 * 60 * 1000) };
        },
        isSignedUrlStale(expiresAt) {
            if (!expiresAt) return true;
            return new Date(expiresAt).getTime() <= (Date.now() + 60_000);
        },
    };
    globalThis.__EDUCONNECT_STORAGE_SERVICE__ = mockStorageService;
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
    ({ default: Teacher } = await import('../src/models/TeacherModel.js'));
    ({ default: Student } = await import('../src/models/StudentModel.js'));
    ({ default: Group } = await import('../src/models/GroupModel.js'));
    ({ default: GroupTeacher } = await import('../src/models/GroupTeacherModel.js'));
    ({ default: Area } = await import('../src/models/AreaModel.js'));
    ({ default: Period } = await import('../src/models/PeriodModel.js'));
    ({ default: GradeItem } = await import('../src/models/GradeItemModel.js'));
    ({ default: Grade } = await import('../src/models/GradeModel.js'));
    ({ default: SchoolYear } = await import('../src/models/SchoolYearModel.js'));
    ({ default: Enrollment } = await import('../src/models/EnrollmentModel.js'));

    await appConfig.connectDatabase();
});

afterAll(async () => {
    delete globalThis.__EDUCONNECT_STORAGE_SERVICE__;
    delete globalThis.__EDUCONNECT_EMAIL_SERVICE__;
    await appConfig.disconnectDatabase();
    await mongoServer.stop();
    await mongoose.connection.close();
});

describe('Seguridad — scope de acceso (H1, H2, H3, H13)', () => {
    let adminToken: string;
    let teacherToken: string;
    let teacher2Token: string;
    let studentAToken: string;
    let studentBToken: string;
    let studentA: RegisteredUser;
    let studentB: RegisteredUser;
    let studentAStudentId: mongoose.Types.ObjectId;
    let teacherId: mongoose.Types.ObjectId;
    let groupId: mongoose.Types.ObjectId;
    let areaId: mongoose.Types.ObjectId;
    let periodId: mongoose.Types.ObjectId;
    let gradeItemId: mongoose.Types.ObjectId;
    let schoolYearId: mongoose.Types.ObjectId;

    beforeAll(async () => {
        // ---- Admin ----
        const admin = await registerUser({
            email: 'scope.admin@educonnect.local',
            password: 'Admin12345!',
            role: 'Student',
            document_number: 'SCO-ADM-01',
        });
        await Person.findByIdAndUpdate(admin.person_id._id, { role: 'Admin', status: 'active' });
        const adminLogin = await request(app).post('/api/auth/login').send({
            email: 'scope.admin@educonnect.local',
            password: 'Admin12345!',
        });
        adminToken = adminLogin.body.data.token;

        // ---- Docente asignado ----
        const teacher = await registerUser({
            email: 'scope.teacher1@educonnect.local',
            password: 'Teacher123!',
            role: 'Teacher',
            document_number: 'SCO-TCH-01',
        });
        teacherToken = await activateAndLogin('scope.teacher1@educonnect.local', 'Teacher123!');
        teacherId = (await Teacher.findOne({ user_id: teacher._id }))._id;

        // ---- Docente sin asignación ----
        await registerUser({
            email: 'scope.teacher2@educonnect.local',
            password: 'Teacher123!',
            role: 'Teacher',
            document_number: 'SCO-TCH-02',
        });
        teacher2Token = await activateAndLogin('scope.teacher2@educonnect.local', 'Teacher123!');

        // ---- Estudiantes A y B ----
        studentA = await registerUser({
            email: 'scope.student.a@educonnect.local',
            password: 'Student123!',
            role: 'Student',
            document_number: 'SCO-STU-A1',
        });
        studentAToken = await activateAndLogin('scope.student.a@educonnect.local', 'Student123!');
        studentAStudentId = (await Student.findOne({ user_id: studentA._id }))._id;

        studentB = await registerUser({
            email: 'scope.student.b@educonnect.local',
            password: 'Student123!',
            role: 'Student',
            document_number: 'SCO-STU-B1',
        });
        studentBToken = await activateAndLogin('scope.student.b@educonnect.local', 'Student123!');

        // ---- Contexto académico ----
        const schoolYear = await SchoolYear.create({
            year: 2099,
            start_date: new Date('2099-01-01'),
            end_date: new Date('2099-12-31'),
            is_active: true,
        });
        schoolYearId = schoolYear._id;

        const grade = await Grade.create({ name: 'Grado Scope' });
        const area = await Area.create({ name: 'Área Scope' });
        areaId = area._id;

        const period = await Period.create({
            school_year_id: schoolYear._id,
            name: 'P1',
            weight: 0.25,
            start_date: new Date('2099-01-01'),
            end_date: new Date('2099-03-31'),
        });
        periodId = period._id;

        const group = await Group.create({
            name: 'G-SCOPE',
            grade_id: grade._id,
            school_year_id: schoolYear._id,
            max_capacity: 40,
        });
        groupId = group._id;

        const gradeItem = await GradeItem.create({
            name: 'Parcial Scope',
            percentage: 100,
            area_id: area._id,
            period_id: period._id,
        });
        gradeItemId = gradeItem._id;

        await Enrollment.create({
            student_id: studentAStudentId,
            school_year_id: schoolYear._id,
            group_id: group._id,
            status: 'active',
        });

        // Docente 1 asignado al grupo en el área; docente 2 sin asignación
        await GroupTeacher.create({
            teacher_id: teacherId,
            group_id: group._id,
            area_id: area._id,
        });
    });

    beforeEach(() => {
        mockEmailService.sentEmails = [];
    });

    test('H1: un estudiante no puede ver el perfil (PII) de otro usuario', async () => {
        const forbidden = await request(app)
            .get(`/api/users/${studentA._id}`)
            .set('Authorization', `Bearer ${studentBToken}`);
        expect(forbidden.statusCode).toBe(403);

        const own = await request(app)
            .get(`/api/users/${studentA._id}`)
            .set('Authorization', `Bearer ${studentAToken}`);
        expect(own.statusCode).toBe(200);

        const adminView = await request(app)
            .get(`/api/users/${studentB._id}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(adminView.statusCode).toBe(200);
    });

    test('H2: las notas de un estudiante solo las ve él, su docente asignado o el admin', async () => {
        await mongoose.connection.collection('studentgrades').insertOne({
            student_id: studentAStudentId,
            grade_item_id: gradeItemId,
            score: 8.5,
        });

        const ownScores = await request(app)
            .get(`/api/evaluations/scores/student/${studentAStudentId}`)
            .set('Authorization', `Bearer ${studentAToken}`);
        expect(ownScores.statusCode).toBe(200);

        const otherStudent = await request(app)
            .get(`/api/evaluations/scores/student/${studentAStudentId}`)
            .set('Authorization', `Bearer ${studentBToken}`);
        expect(otherStudent.statusCode).toBe(403);

        const teacherAssigned = await request(app)
            .get(`/api/evaluations/scores/student/${studentAStudentId}`)
            .set('Authorization', `Bearer ${teacherToken}`);
        expect(teacherAssigned.statusCode).toBe(200);

        const teacherNotAssigned = await request(app)
            .get(`/api/evaluations/scores/student/${studentAStudentId}`)
            .set('Authorization', `Bearer ${teacher2Token}`);
        expect(teacherNotAssigned.statusCode).toBe(403);

        const otherPeriodResults = await request(app)
            .get(`/api/evaluations/period-results/student/${studentAStudentId}`)
            .set('Authorization', `Bearer ${studentBToken}`);
        expect(otherPeriodResults.statusCode).toBe(403);
    });

    test('H3: un docente solo puede calificar dentro de su asignación (grupo + área)', async () => {
        const forbidden = await request(app)
            .post('/api/evaluations/scores')
            .set('Authorization', `Bearer ${teacher2Token}`)
            .send({ student_id: studentAStudentId, grade_item_id: gradeItemId, score: 7 });
        expect(forbidden.statusCode).toBe(403);

        const allowed = await request(app)
            .post('/api/evaluations/scores')
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({ student_id: studentAStudentId, grade_item_id: gradeItemId, score: 8 });
        expect(allowed.statusCode).toBe(200);

        const forbiddenItem = await request(app)
            .post('/api/evaluations/grade-items')
            .set('Authorization', `Bearer ${teacher2Token}`)
            .send({ name: 'Ítem ajeno', percentage: 10, area_id: areaId, period_id: periodId });
        expect(forbiddenItem.statusCode).toBe(403);
    });

    test('H13: un docente sin asignación no accede a estudiantes ni detalle de un grupo ajeno', async () => {
        const forbiddenStudents = await request(app)
            .get(`/api/groups/${groupId}/students`)
            .set('Authorization', `Bearer ${teacher2Token}`);
        expect(forbiddenStudents.statusCode).toBe(403);

        const allowedStudents = await request(app)
            .get(`/api/groups/${groupId}/students`)
            .set('Authorization', `Bearer ${teacherToken}`);
        expect(allowedStudents.statusCode).toBe(200);

        const forbiddenGroup = await request(app)
            .get(`/api/groups/${groupId}`)
            .set('Authorization', `Bearer ${teacher2Token}`);
        expect(forbiddenGroup.statusCode).toBe(403);

        const forbiddenTeacherGroups = await request(app)
            .get(`/api/groups/teachers/${teacherId}/groups`)
            .set('Authorization', `Bearer ${studentBToken}`);
        expect(forbiddenTeacherGroups.statusCode).toBe(403);
    });
});
