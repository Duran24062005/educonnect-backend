import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let app;
let appConfig;
let generateToken;
let User;
let Person;
let Institution;
let Student;
let SchoolYear;
let Grade;
let Group;
let Enrollment;
let mongoServer;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'institution-structure-test-secret';
    mongoServer = await MongoMemoryServer.create();
    process.env.DATABASE_URL = mongoServer.getUri('educonnect_institution_structure_test');

    ({ default: app } = await import('../src/app.js'));
    ({ default: appConfig } = await import('../src/config/config.js'));
    ({ generateToken } = await import('../src/utils/jwt.js'));
    ({ default: User } = await import('../src/models/UserModel.js'));
    ({ default: Person } = await import('../src/models/PersonModel.js'));
    ({ default: Institution } = await import('../src/models/InstitutionModel.js'));
    ({ default: Student } = await import('../src/models/StudentModel.js'));
    ({ default: SchoolYear } = await import('../src/models/SchoolYearModel.js'));
    ({ default: Grade } = await import('../src/models/GradeModel.js'));
    ({ default: Group } = await import('../src/models/GroupModel.js'));
    ({ default: Enrollment } = await import('../src/models/EnrollmentModel.js'));
    await appConfig.connectDatabase();
});

afterAll(async () => {
    await appConfig.disconnectDatabase();
    await mongoServer.stop();
    await mongoose.connection.close();
});

beforeEach(async () => {
    for (const collection of Object.values(mongoose.connection.collections)) {
        await collection.deleteMany({});
    }
});

const createAdmin = async () => {
    const suffix = Date.now().toString();
    const user = await User.create({
        email: 'structure-admin-' + suffix + '@educonnect.local',
        hash_password: 'Password123!',
    });
    const person = await Person.create({
        user_id: user._id,
        first_name: 'Admin',
        last_name: 'Estructura',
        born_date: '1990-01-01',
        document_type: 'CC',
        document_number: 'STRUCT-' + suffix,
        role: 'Admin',
        status: 'active',
    });
    const institution = await Institution.create({
        name: 'Colegio Estructura',
        code: 'STRUCT-' + suffix,
        type: 'private',
        created_by_user_id: user._id,
    });
    await User.findByIdAndUpdate(user._id, { person_id: person._id, institution_id: institution._id });
    return generateToken(user._id, 'Admin');
};

const createAdminWithoutInstitution = async () => {
    const suffix = Date.now().toString();
    const user = await User.create({
        email: 'structure-unassigned-' + suffix + '@educonnect.local',
        hash_password: 'Password123!',
    });
    const person = await Person.create({
        user_id: user._id,
        first_name: 'Admin',
        last_name: 'Sin institución',
        born_date: '1990-01-01',
        document_type: 'CC',
        document_number: 'NOINST' + suffix,
        role: 'Admin',
        status: 'active',
    });
    await User.findByIdAndUpdate(user._id, { person_id: person._id });
    return generateToken(user._id, 'Admin');
};

describe('Institution structure', () => {
    it('returns a clear conflict when the admin has no institution context', async () => {
        const token = await createAdminWithoutInstitution();
        const previousRequirement = appConfig.tenant.requireInstitutionContext;
        appConfig.tenant.requireInstitutionContext = true;

        try {
            const campuses = await request(app)
                .get('/api/institutions/current/campuses')
                .set('Authorization', 'Bearer ' + token);
            const shifts = await request(app)
                .get('/api/institutions/current/shifts')
                .set('Authorization', 'Bearer ' + token);

            expect(campuses.status).toBe(409);
            expect(shifts.status).toBe(409);
            expect(campuses.body.message).toContain('institución');
            expect(shifts.body.message).toContain('institución');
        } finally {
            appConfig.tenant.requireInstitutionContext = previousRequirement;
        }
    });

    it('creates, lists, updates and deactivates campuses', async () => {
        const token = await createAdmin();
        const created = await request(app)
            .post('/api/institutions/current/campuses')
            .set('Authorization', 'Bearer ' + token)
            .send({ name: 'Sede Norte', code: 'norte', address: 'Calle 1' });

        expect(created.status).toBe(201);
        expect(created.body.data.code).toBe('NORTE');

        const updated = await request(app)
            .patch('/api/institutions/current/campuses/' + created.body.data._id)
            .set('Authorization', 'Bearer ' + token)
            .send({ address: 'Calle 2' });
        expect(updated.status).toBe(200);
        expect(updated.body.data.address).toBe('Calle 2');

        const listed = await request(app)
            .get('/api/institutions/current/campuses')
            .set('Authorization', 'Bearer ' + token);
        expect(listed.status).toBe(200);
        expect(listed.body.data).toHaveLength(1);

        const deleted = await request(app)
            .delete('/api/institutions/current/campuses/' + created.body.data._id)
            .set('Authorization', 'Bearer ' + token);
        expect(deleted.status).toBe(200);
        expect(deleted.body.data.status).toBe('inactive');
    });

    it('validates shift time ranges and updates a valid shift', async () => {
        const token = await createAdmin();
        const invalid = await request(app)
            .post('/api/institutions/current/shifts')
            .set('Authorization', 'Bearer ' + token)
            .send({ name: 'Jornada inválida', code: 'BAD', start_time: '12:00', end_time: '07:00' });
        expect(invalid.status).toBe(400);

        const created = await request(app)
            .post('/api/institutions/current/shifts')
            .set('Authorization', 'Bearer ' + token)
            .send({ name: 'Jornada mañana', code: 'AM', shift_type: 'morning', start_time: '07:00', end_time: '12:00' });
        expect(created.status).toBe(201);
        expect(created.body.data.shift_type).toBe('morning');

        const updated = await request(app)
            .patch('/api/institutions/current/shifts/' + created.body.data._id)
            .set('Authorization', 'Bearer ' + token)
            .send({ shift_type: 'hybrid', end_time: '13:00' });
        expect(updated.status).toBe(200);
        expect(updated.body.data.end_time).toBe('13:00');
        expect(updated.body.data.shift_type).toBe('hybrid');
    });

    it('persists optional campus and shift references on an enrollment', async () => {
        const token = await createAdmin();
        const campus = await request(app)
            .post('/api/institutions/current/campuses')
            .set('Authorization', 'Bearer ' + token)
            .send({ name: 'Sede Centro', code: 'CENTRO' });
        const shift = await request(app)
            .post('/api/institutions/current/shifts')
            .set('Authorization', 'Bearer ' + token)
            .send({ name: 'Jornada tarde', code: 'PM', start_time: '13:00', end_time: '18:00' });

        const studentUser = await User.create({ email: 'student-structure@educonnect.local', hash_password: 'Password123!' });
        const studentPerson = await Person.create({
            user_id: studentUser._id,
            first_name: 'Estudiante',
            last_name: 'Estructura',
            born_date: '2012-01-01',
            document_type: 'RC',
            document_number: 'STUDENT-STRUCTURE',
            role: 'Student',
            status: 'active',
        });
        await User.findByIdAndUpdate(studentUser._id, { person_id: studentPerson._id });
        const student = await Student.create({ user_id: studentUser._id });
        const schoolYear = await SchoolYear.create({ year: 2026, start_date: '2026-01-01', end_date: '2026-12-31', is_active: true });
        const grade = await Grade.create({ name: 'Primero', level: '1' });
        const group = await Group.create({ name: '1A', grade_id: grade._id, school_year_id: schoolYear._id, max_capacity: 20 });

        const enrolled = await request(app)
            .post('/api/groups/enrollments')
            .set('Authorization', 'Bearer ' + token)
            .send({
                student_id: student._id.toString(),
                group_id: group._id.toString(),
                school_year_id: schoolYear._id.toString(),
                campus_id: campus.body.data._id,
                shift_id: shift.body.data._id,
            });

        expect(enrolled.status).toBe(201);
        const stored = await Enrollment.findOne({ student_id: student._id });
        expect(stored.campus_id.toString()).toBe(campus.body.data._id);
        expect(stored.shift_id.toString()).toBe(shift.body.data._id);

        const report = await request(app)
            .get('/api/groups/reports/enrollments.csv')
            .set('Authorization', 'Bearer ' + token)
            .query({ school_year_id: schoolYear._id.toString() });
        expect(report.status).toBe(200);
        expect(report.headers['content-type']).toContain('text/csv');
        expect(report.text).toContain('school_year,group,grade,student,email,campus,shift,status');
        expect(report.text).toContain('Sede Centro');
        expect(report.text).toContain('Jornada tarde');
    });
});
