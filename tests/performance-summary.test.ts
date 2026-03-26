import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let app;
let appConfig;
let generateToken;
let User;
let Person;
let Teacher;
let Student;
let SchoolYear;
let Period;
let Grade;
let Group;
let Area;
let GroupTeacher;
let Enrollment;
let PeriodAreaResult;
let FinalResult;
let mongoServer;
let uniqueIndex = 0;

const nextEmail = (prefix) => `${prefix}.${uniqueIndex += 1}@educonnect.local`;
const nextDocument = (prefix) => `${prefix}-${String(uniqueIndex += 1).padStart(4, '0')}`;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key';

    mongoServer = await MongoMemoryServer.create();
    process.env.DATABASE_URL = mongoServer.getUri('educonnect_performance_test');

    ({ default: app } = await import('../src/app.js'));
    ({ default: appConfig } = await import('../src/config/config.js'));
    ({ generateToken } = await import('../src/utils/jwt.js'));
    ({ default: User } = await import('../src/models/UserModel.js'));
    ({ default: Person } = await import('../src/models/PersonModel.js'));
    ({ default: Teacher } = await import('../src/models/TeacherModel.js'));
    ({ default: Student } = await import('../src/models/StudentModel.js'));
    ({ default: SchoolYear } = await import('../src/models/SchoolYearModel.js'));
    ({ default: Period } = await import('../src/models/PeriodModel.js'));
    ({ default: Grade } = await import('../src/models/GradeModel.js'));
    ({ default: Group } = await import('../src/models/GroupModel.js'));
    ({ default: Area } = await import('../src/models/AreaModel.js'));
    ({ default: GroupTeacher } = await import('../src/models/GroupTeacherModel.js'));
    ({ default: Enrollment } = await import('../src/models/EnrollmentModel.js'));
    ({ default: PeriodAreaResult } = await import('../src/models/PeriodAreaResultModel.js'));
    ({ default: FinalResult } = await import('../src/models/FinalResultModel.js'));

    await appConfig.connectDatabase();
});

afterAll(async () => {
    await appConfig.disconnectDatabase();
    await mongoServer.stop();
    await mongoose.connection.close();
});

beforeEach(async () => {
    const collections = Object.values(mongoose.connection.collections);
    for (const collection of collections) {
        await collection.deleteMany({});
    }
});

const createActor = async ({ role, firstName, lastName, prefix }) => {
    const user = await User.create({
        email: nextEmail(prefix),
        hash_password: 'Password123!',
    });

    const person = await Person.create({
        user_id: user._id,
        first_name: firstName,
        last_name: lastName,
        born_date: '1990-01-01',
        document_type: 'CC',
        document_number: nextDocument(prefix),
        role,
        status: 'active',
    });

    await User.findByIdAndUpdate(user._id, { person_id: person._id });

    let profile = null;
    if (role === 'Teacher') profile = await Teacher.create({ user_id: user._id, area: 'Matemáticas' });
    if (role === 'Student') profile = await Student.create({ user_id: user._id });

    return {
        user,
        person,
        profile,
        token: generateToken(user._id, role),
    };
};

const createFixture = async () => {
    const previousSchoolYear = await SchoolYear.create({
        year: 2025,
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        is_active: false,
    });

    const schoolYear = await SchoolYear.create({
        year: 2026,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        is_active: true,
    });

    const periodOne = await Period.create({
        school_year_id: previousSchoolYear._id,
        name: 'Periodo 1',
        weight: 0.5,
        start_date: '2025-01-10',
        end_date: '2025-03-30',
    });

    const periodTwo = await Period.create({
        school_year_id: previousSchoolYear._id,
        name: 'Periodo 2',
        weight: 0.5,
        start_date: '2025-04-01',
        end_date: '2025-06-30',
    });

    const currentPeriodOne = await Period.create({
        school_year_id: schoolYear._id,
        name: 'Periodo 1',
        weight: 0.5,
        start_date: '2026-01-10',
        end_date: '2026-03-30',
    });

    const currentPeriodTwo = await Period.create({
        school_year_id: schoolYear._id,
        name: 'Periodo 2',
        weight: 0.5,
        start_date: '2026-04-01',
        end_date: '2026-06-30',
    });

    const grade = await Grade.create({ name: '6' });
    const math = await Area.create({ name: 'Matemáticas' });
    const language = await Area.create({ name: 'Lenguaje' });

    const group = await Group.create({
        name: '6B',
        grade_id: grade._id,
        school_year_id: schoolYear._id,
        max_capacity: 40,
    });

    const admin = await createActor({ role: 'Admin', firstName: 'Ada', lastName: 'Admin', prefix: 'admin' });
    const teacher = await createActor({ role: 'Teacher', firstName: 'Carlos', lastName: 'Gomez', prefix: 'teacher' });
    const studentOne = await createActor({ role: 'Student', firstName: 'Laura', lastName: 'Lopez', prefix: 'student' });
    const studentTwo = await createActor({ role: 'Student', firstName: 'Mateo', lastName: 'Ruiz', prefix: 'student' });

    const pendingUser = await User.create({ email: nextEmail('pending'), hash_password: 'Password123!' });
    const pendingPerson = await Person.create({
        user_id: pendingUser._id,
        first_name: 'Pending',
        last_name: 'User',
        born_date: '1990-01-01',
        document_type: 'CC',
        document_number: nextDocument('pending'),
        role: 'Student',
        status: 'pending',
    });
    await User.findByIdAndUpdate(pendingUser._id, { person_id: pendingPerson._id });

    await GroupTeacher.create({
        teacher_id: teacher.profile._id,
        group_id: group._id,
        area_id: math._id,
    });

    await Enrollment.create({
        student_id: studentOne.profile._id,
        school_year_id: previousSchoolYear._id,
        group_id: group._id,
        status: 'active',
    });
    await Enrollment.create({
        student_id: studentOne.profile._id,
        school_year_id: schoolYear._id,
        group_id: group._id,
        status: 'active',
    });
    await Enrollment.create({
        student_id: studentTwo.profile._id,
        school_year_id: schoolYear._id,
        group_id: group._id,
        status: 'active',
    });

    await Student.findByIdAndUpdate(studentOne.profile._id, { group_id: group._id });
    await Student.findByIdAndUpdate(studentTwo.profile._id, { group_id: group._id });

    await PeriodAreaResult.create([
        { student_id: studentOne.profile._id, area_id: math._id, period_id: periodOne._id, final_score: 7 },
        { student_id: studentOne.profile._id, area_id: language._id, period_id: periodOne._id, final_score: 6 },
        { student_id: studentOne.profile._id, area_id: math._id, period_id: periodTwo._id, final_score: 8 },
        { student_id: studentOne.profile._id, area_id: language._id, period_id: periodTwo._id, final_score: 7 },
        { student_id: studentOne.profile._id, area_id: math._id, period_id: currentPeriodOne._id, final_score: 9 },
        { student_id: studentOne.profile._id, area_id: language._id, period_id: currentPeriodOne._id, final_score: 7 },
        { student_id: studentTwo.profile._id, area_id: math._id, period_id: currentPeriodOne._id, final_score: 5 },
        { student_id: studentOne.profile._id, area_id: math._id, period_id: currentPeriodTwo._id, final_score: 8 },
        { student_id: studentOne.profile._id, area_id: language._id, period_id: currentPeriodTwo._id, final_score: 3 },
        { student_id: studentTwo.profile._id, area_id: math._id, period_id: currentPeriodTwo._id, final_score: 6 },
    ]);

    await FinalResult.create([
        { student_id: studentOne.profile._id, school_year_id: previousSchoolYear._id, final_score: 7, status: 'passed' },
        { student_id: studentOne.profile._id, school_year_id: schoolYear._id, final_score: 8.5, status: 'passed' },
        { student_id: studentTwo.profile._id, school_year_id: schoolYear._id, final_score: 5.5, status: 'failed' },
    ]);

    return {
        admin,
        studentOne,
        previousSchoolYear,
        teacher,
        schoolYear,
        group,
        grade,
        math,
        language,
    };
};

describe('Performance summary endpoints', () => {
    it('returns real student overview with best and attention areas', async () => {
        const fixture = await createFixture();

        const response = await request(app)
            .get('/api/analytics/student/me/overview')
            .set('Authorization', `Bearer ${fixture.studentOne.token}`)
            .query({ school_year_id: fixture.schoolYear._id.toString() });

        expect(response.status).toBe(200);
        expect(response.body.data.student_id).toBe(fixture.studentOne.profile._id.toString());
        expect(response.body.data.school_year.year).toBe(2026);
        expect(response.body.data.summary.general_average).toBe(6.75);
        expect(response.body.data.summary.passed_areas).toBe(1);
        expect(response.body.data.summary.failed_areas).toBe(1);
        expect(response.body.data.best_area).toBe('Matemáticas');
        expect(response.body.data.attention_area).toBe('Lenguaje');
    });

    it('returns student areas with period detail and yearly history', async () => {
        const fixture = await createFixture();

        const response = await request(app)
            .get('/api/analytics/student/me/areas')
            .set('Authorization', `Bearer ${fixture.studentOne.token}`)
            .query({ school_year_id: fixture.schoolYear._id.toString() });

        expect(response.status).toBe(200);
        expect(response.body.data.areas).toHaveLength(2);

        const mathArea = response.body.data.areas.find((area) => area.area_name === 'Matemáticas');
        const languageArea = response.body.data.areas.find((area) => area.area_name === 'Lenguaje');

        expect(mathArea.final_average).toBe(8.5);
        expect(mathArea.periods).toHaveLength(2);
        expect(mathArea.periods[0].average).toBe(9);
        expect(mathArea.year_averages).toEqual([
            { school_year_id: fixture.previousSchoolYear._id.toString(), year: '2025', average: 7.5 },
            { school_year_id: fixture.schoolYear._id.toString(), year: '2026', average: 8.5 },
        ]);

        expect(languageArea.final_average).toBe(5);
        expect(languageArea.status).toBe('failed');
        expect(languageArea.year_averages).toEqual([
            { school_year_id: fixture.previousSchoolYear._id.toString(), year: '2025', average: 6.5 },
            { school_year_id: fixture.schoolYear._id.toString(), year: '2026', average: 5 },
        ]);
    });

    it('returns student period summary with derived status per period', async () => {
        const fixture = await createFixture();

        const response = await request(app)
            .get('/api/analytics/student/me/period-summary')
            .set('Authorization', `Bearer ${fixture.studentOne.token}`)
            .query({ school_year_id: fixture.schoolYear._id.toString() });

        expect(response.status).toBe(200);
        expect(response.body.data.periods).toEqual([
            {
                period_id: expect.any(String),
                period_name: 'Periodo 1',
                general_average: 8,
                passed_areas: 2,
                failed_areas: 0,
                status: 'passed',
            },
            {
                period_id: expect.any(String),
                period_name: 'Periodo 2',
                general_average: 5.5,
                passed_areas: 1,
                failed_areas: 1,
                status: 'failed',
            },
        ]);
    });

    it('returns aggregated admin dashboard summary', async () => {
        const fixture = await createFixture();

        const response = await request(app)
            .get('/api/analytics/admin/dashboard-summary')
            .set('Authorization', `Bearer ${fixture.admin.token}`)
            .query({ school_year_id: fixture.schoolYear._id.toString() });

        expect(response.status).toBe(200);
        expect(response.body.data.stats.total).toBeGreaterThanOrEqual(4);
        expect(response.body.data.pending.count).toBe(1);
        expect(response.body.data.institution_overview.student_count).toBe(2);
        expect(Array.isArray(response.body.data.institution_trend)).toBe(true);
    });

    it('returns aggregated teacher dashboard summary', async () => {
        const fixture = await createFixture();

        const response = await request(app)
            .get('/api/analytics/teacher/me/dashboard-summary')
            .set('Authorization', `Bearer ${fixture.teacher.token}`)
            .query({ school_year_id: fixture.schoolYear._id.toString() });

        expect(response.status).toBe(200);
        expect(response.body.data.summary.assignment_count).toBe(1);
        expect(response.body.data.summary.student_count).toBe(2);
        expect(response.body.data.groups).toHaveLength(1);
        expect(response.body.data.groups[0].students).toHaveLength(2);
        expect(response.body.data.groups[0].periods).toHaveLength(2);
    });

    it('returns group detail summary in a single endpoint', async () => {
        const fixture = await createFixture();

        const response = await request(app)
            .get(`/api/groups/${fixture.group._id.toString()}/detail-summary`)
            .set('Authorization', `Bearer ${fixture.admin.token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.group._id).toBeDefined();
        expect(response.body.data.students.length).toBeGreaterThanOrEqual(2);
        expect(response.body.data.teachers).toHaveLength(1);
        expect(Array.isArray(response.body.data.teacher_options)).toBe(true);
        expect(response.body.data.areas.some((area) => area.name === fixture.language.name)).toBe(true);
    });
});
