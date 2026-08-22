import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let app;
let appConfig;
let generateToken;
let User;
let Person;
let Student;
let StudentGuardian;
let SchoolYear;
let Period;
let Area;
let PeriodAreaResult;
let Grade;
let Group;
let Enrollment;
let mongoServer;
let sequence = 0;

const nextValue = (prefix) => `${prefix}-${String(sequence += 1).padStart(4, '0')}`;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key';

    mongoServer = await MongoMemoryServer.create();
    process.env.DATABASE_URL = mongoServer.getUri('educonnect_guardian_test');

    ({ default: app } = await import('../src/app.js'));
    ({ default: appConfig } = await import('../src/config/config.js'));
    ({ generateToken } = await import('../src/utils/jwt.js'));
    ({ default: User } = await import('../src/models/UserModel.js'));
    ({ default: Person } = await import('../src/models/PersonModel.js'));
    ({ default: Student } = await import('../src/models/StudentModel.js'));
    ({ default: StudentGuardian } = await import('../src/models/StudentGuardianModel.js'));
    ({ default: SchoolYear } = await import('../src/models/SchoolYearModel.js'));
    ({ default: Period } = await import('../src/models/PeriodModel.js'));
    ({ default: Area } = await import('../src/models/AreaModel.js'));
    ({ default: PeriodAreaResult } = await import('../src/models/PeriodAreaResultModel.js'));
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
    sequence = 0;
    for (const collection of Object.values(mongoose.connection.collections)) {
        await collection.deleteMany({});
    }
});

const createActor = async ({ role, firstName, lastName }) => {
    const user = await User.create({
        email: `${role.toLowerCase()}.${nextValue('user')}@educonnect.local`,
        hash_password: 'Password123!',
    });
    const person = await Person.create({
        user_id: user._id,
        first_name: firstName,
        last_name: lastName,
        born_date: role === 'Student' ? '2012-01-01' : '1990-01-01',
        document_type: 'CC',
        document_number: nextValue('DOC'),
        role,
        status: 'active',
    });
    await User.findByIdAndUpdate(user._id, { person_id: person._id });

    const profile = role === 'Student' ? await Student.create({ user_id: user._id }) : null;
    return { user, person, profile, token: generateToken(user._id, role) };
};

const createFixture = async () => {
    const guardian = await createActor({ role: 'Parent', firstName: 'María', lastName: 'Acudiente' });
    const firstStudent = await createActor({ role: 'Student', firstName: 'Laura', lastName: 'López' });
    const secondStudent = await createActor({ role: 'Student', firstName: 'Mateo', lastName: 'Ruiz' });
    const unrelatedStudent = await createActor({ role: 'Student', firstName: 'Sara', lastName: 'Gómez' });
    const schoolYear = await SchoolYear.create({
        year: 2026,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        is_active: true,
    });
    const period = await Period.create({
        school_year_id: schoolYear._id,
        name: 'Periodo 1',
        weight: 1,
        start_date: '2026-01-10',
        end_date: '2026-03-30',
    });
    const area = await Area.create({ name: 'Matemáticas' });
    const grade = await Grade.create({ name: '6°', level: '6' });
    const group = await Group.create({
        name: '6A',
        grade_id: grade._id,
        school_year_id: schoolYear._id,
        max_capacity: 30,
    });

    await Enrollment.create([
        { student_id: firstStudent.profile._id, school_year_id: schoolYear._id, group_id: group._id, status: 'active' },
        { student_id: secondStudent.profile._id, school_year_id: schoolYear._id, group_id: group._id, status: 'active' },
    ]);

    await StudentGuardian.create([
        { student_id: firstStudent.profile._id, guardian_id: guardian.user._id, relationship: 'mother' },
        { student_id: secondStudent.profile._id, guardian_id: guardian.user._id, relationship: 'mother' },
    ]);
    await PeriodAreaResult.create([
        { student_id: firstStudent.profile._id, area_id: area._id, period_id: period._id, final_score: 8 },
        { student_id: secondStudent.profile._id, area_id: area._id, period_id: period._id, final_score: 5 },
    ]);

    return { guardian, firstStudent, secondStudent, unrelatedStudent, schoolYear };
};

describe('Guardian portal', () => {
    it('returns every authorized student and excludes unrelated students', async () => {
        const fixture = await createFixture();

        const response = await request(app)
            .get('/api/guardians/me/students')
            .set('Authorization', `Bearer ${fixture.guardian.token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.students).toHaveLength(2);
        expect(response.body.data.students.map((student) => student._id)).toEqual(
            expect.arrayContaining([
                fixture.firstStudent.profile._id.toString(),
                fixture.secondStudent.profile._id.toString(),
            ])
        );
        expect(response.body.data.students.map((student) => student._id)).not.toContain(
            fixture.unrelatedStudent.profile._id.toString()
        );
    });

    it('returns academic data grouped independently for every authorized student', async () => {
        const fixture = await createFixture();

        const response = await request(app)
            .get('/api/guardians/me/dashboard')
            .set('Authorization', `Bearer ${fixture.guardian.token}`)
            .query({ school_year_id: fixture.schoolYear._id.toString() });

        expect(response.status).toBe(200);
        expect(response.body.data.students).toHaveLength(2);
        expect(response.body.data.students.map((student) => student.student._id)).toEqual(
            expect.arrayContaining([
                fixture.firstStudent.profile._id.toString(),
                fixture.secondStudent.profile._id.toString(),
            ])
        );

        const first = response.body.data.students.find(
            (student) => student.student._id === fixture.firstStudent.profile._id.toString()
        );
        const second = response.body.data.students.find(
            (student) => student.student._id === fixture.secondStudent.profile._id.toString()
        );

        expect(first.overview.summary.general_average).toBe(8);
        expect(second.overview.summary.general_average).toBe(5);
    });

    it('allows a linked student bulletin and rejects an unrelated student id', async () => {
        const fixture = await createFixture();

        const allowed = await request(app)
            .get('/api/guardians/me/bulletin')
            .set('Authorization', `Bearer ${fixture.guardian.token}`)
            .query({
                school_year_id: fixture.schoolYear._id.toString(),
                period_id: (await Period.findOne({ school_year_id: fixture.schoolYear._id }))._id.toString(),
                student_id: fixture.firstStudent.profile._id.toString(),
            });
        expect(allowed.status).toBe(200);
        expect(allowed.body.data.student.full_name).toBe('Laura López');

        const forbidden = await request(app)
            .get('/api/guardians/me/bulletin')
            .set('Authorization', `Bearer ${fixture.guardian.token}`)
            .query({
                school_year_id: fixture.schoolYear._id.toString(),
                period_id: (await Period.findOne({ school_year_id: fixture.schoolYear._id }))._id.toString(),
                student_id: fixture.unrelatedStudent.profile._id.toString(),
            });
        expect(forbidden.status).toBe(403);
    });
});
