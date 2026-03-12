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
let Activity;
let ActivitySubmission;
let mongoServer;
let uniqueIndex = 0;

const nextId = (prefix) => `${prefix.slice(0, 4).toUpperCase()}-${String(uniqueIndex += 1).padStart(4, '0')}`;

const tomorrow = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
};

const yesterday = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date;
};

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key';

    mongoServer = await MongoMemoryServer.create();
    process.env.DATABASE_URL = mongoServer.getUri('educonnect_activities_test');

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
    ({ default: Activity } = await import('../src/models/ActivityModel.js'));
    ({ default: ActivitySubmission } = await import('../src/models/ActivitySubmissionModel.js'));

    await appConfig.connectDatabase();
});

afterAll(async () => {
    await appConfig.disconnectDatabase();
    await mongoServer.stop();
    await mongoose.connection.close();
});

const clearDatabase = async () => {
    const collections = Object.values(mongoose.connection.collections);
    for (const collection of collections) {
        await collection.deleteMany({});
    }
};

const createActor = async ({ role, emailPrefix, firstName, lastName }) => {
    const user = await User.create({
        email: `${emailPrefix}.${uniqueIndex += 1}@educonnect.local`,
        hash_password: 'Password123!',
    });

    const person = await Person.create({
        user_id: user._id,
        first_name: firstName,
        last_name: lastName,
        born_date: '1990-01-01',
        document_type: 'CC',
        document_number: nextId(emailPrefix),
        role,
        status: 'active',
    });

    await User.findByIdAndUpdate(user._id, { person_id: person._id });

    let profile = null;
    if (role === 'Teacher') {
        profile = await Teacher.create({ user_id: user._id, area: 'Matemáticas' });
    }
    if (role === 'Student') {
        profile = await Student.create({ user_id: user._id });
    }

    return {
        user,
        person,
        profile,
        token: generateToken(user._id, role),
    };
};

const createFixture = async () => {
    const schoolYear = await SchoolYear.create({
        year: 2026,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        is_active: true,
    });
    const otherYear = await SchoolYear.create({
        year: 2027,
        start_date: '2027-01-01',
        end_date: '2027-12-31',
        is_active: false,
    });

    const period = await Period.create({
        school_year_id: schoolYear._id,
        name: 'Periodo 1',
        weight: 0.25,
        start_date: '2026-01-10',
        end_date: '2026-03-30',
    });
    const otherYearPeriod = await Period.create({
        school_year_id: otherYear._id,
        name: 'Periodo 1',
        weight: 0.25,
        start_date: '2027-01-10',
        end_date: '2027-03-30',
    });

    const grade = await Grade.create({ name: '6' });
    const area = await Area.create({ name: 'Matemáticas' });
    const secondArea = await Area.create({ name: 'Lenguaje' });

    const group = await Group.create({
        name: '6B',
        grade_id: grade._id,
        school_year_id: schoolYear._id,
        max_capacity: 40,
    });
    const otherGroup = await Group.create({
        name: '6C',
        grade_id: grade._id,
        school_year_id: schoolYear._id,
        max_capacity: 40,
    });

    const teacher = await createActor({
        role: 'Teacher',
        emailPrefix: 'teacher',
        firstName: 'Carlos',
        lastName: 'Docente',
    });
    const secondTeacher = await createActor({
        role: 'Teacher',
        emailPrefix: 'teacher-alt',
        firstName: 'Ana',
        lastName: 'Docente',
    });
    const student = await createActor({
        role: 'Student',
        emailPrefix: 'student',
        firstName: 'Laura',
        lastName: 'Alumno',
    });
    const secondStudent = await createActor({
        role: 'Student',
        emailPrefix: 'student-alt',
        firstName: 'Mateo',
        lastName: 'Alumno',
    });

    await GroupTeacher.create({
        teacher_id: teacher.profile._id,
        group_id: group._id,
        area_id: area._id,
    });
    await GroupTeacher.create({
        teacher_id: secondTeacher.profile._id,
        group_id: otherGroup._id,
        area_id: area._id,
    });

    await Enrollment.create({
        student_id: student.profile._id,
        school_year_id: schoolYear._id,
        group_id: group._id,
        status: 'active',
    });
    await Enrollment.create({
        student_id: secondStudent.profile._id,
        school_year_id: schoolYear._id,
        group_id: otherGroup._id,
        status: 'active',
    });

    await Student.findByIdAndUpdate(student.profile._id, { group_id: group._id });
    await Student.findByIdAndUpdate(secondStudent.profile._id, { group_id: otherGroup._id });

    return {
        schoolYear,
        otherYear,
        period,
        otherYearPeriod,
        grade,
        area,
        secondArea,
        group,
        otherGroup,
        teacher,
        secondTeacher,
        student,
        secondStudent,
    };
};

const activityPayload = (fixture, overrides = {}) => ({
    title: 'Taller de fracciones',
    description: 'Resolver ejercicios en el cuaderno',
    context: 'Debes explicar cada procedimiento y justificar la respuesta final.',
    group_id: fixture.group._id.toString(),
    area_id: fixture.area._id.toString(),
    period_id: fixture.period._id.toString(),
    open_at: yesterday().toISOString(),
    due_at: tomorrow().toISOString(),
    allowed_extensions: ['txt', 'pdf'],
    rubric_criteria: [
        { title: 'Procedimiento', description: 'Claridad del desarrollo', max_points: 10 },
        { title: 'Resultado final', description: 'Respuesta correcta', max_points: 10 },
    ],
    ...overrides,
});

describe('Activities API', () => {
    beforeEach(async () => {
        await clearDatabase();
        uniqueIndex = 0;
    });

    test('teacher can create an activity only for an assigned group and area', async () => {
        const fixture = await createFixture();
        const payload = activityPayload(fixture);

        const success = await request(app)
            .post('/api/activities/teacher/me')
            .set('Authorization', `Bearer ${fixture.teacher.token}`)
            .send(payload);

        expect(success.statusCode).toBe(201);
        expect(success.body.data.activity.title).toBe(payload.title);
        expect(success.body.data.activity.group._id).toBe(fixture.group._id.toString());
        expect(success.body.data.activity.area._id).toBe(fixture.area._id.toString());

        const forbidden = await request(app)
            .post('/api/activities/teacher/me')
            .set('Authorization', `Bearer ${fixture.secondTeacher.token}`)
            .send(payload);

        expect(forbidden.statusCode).toBe(403);
        expect(forbidden.body.message).toContain('no tiene asignación');
    });

    test('defaults due date to one hour after open date when it is omitted', async () => {
        const fixture = await createFixture();
        const openAt = yesterday().toISOString();

        const response = await request(app)
            .post('/api/activities/teacher/me')
            .set('Authorization', `Bearer ${fixture.teacher.token}`)
            .send({
                ...activityPayload(fixture),
                open_at: openAt,
                due_at: undefined,
            });

        expect(response.statusCode).toBe(201);
        const diffMs =
            new Date(response.body.data.activity.due_at).getTime() -
            new Date(response.body.data.activity.open_at).getTime();
        expect(diffMs).toBe(60 * 60 * 1000);
    });

    test('rejects an activity when period belongs to another school year', async () => {
        const fixture = await createFixture();

        const response = await request(app)
            .post('/api/activities/teacher/me')
            .set('Authorization', `Bearer ${fixture.teacher.token}`)
            .send(activityPayload(fixture, {
                period_id: fixture.otherYearPeriod._id.toString(),
            }));

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toContain('mismo año escolar');
    });

    test('student only lists activities from the active enrollment group', async () => {
        const fixture = await createFixture();

        await request(app)
            .post('/api/activities/teacher/me')
            .set('Authorization', `Bearer ${fixture.teacher.token}`)
            .send(activityPayload(fixture, { title: 'Actividad visible' }))
            .expect(201);

        await Activity.create({
            title: 'Actividad oculta',
            description: null,
            context: 'No debería verse',
            group_id: fixture.otherGroup._id,
            area_id: fixture.area._id,
            period_id: fixture.period._id,
            school_year_id: fixture.schoolYear._id,
            teacher_id: fixture.secondTeacher.profile._id,
            open_at: yesterday(),
            due_at: tomorrow(),
            allowed_extensions: ['txt'],
            rubric_criteria: [{ title: 'Único criterio', description: null, max_points: 10 }],
            status: 'published',
        });

        const response = await request(app)
            .get('/api/activities/student/me')
            .set('Authorization', `Bearer ${fixture.student.token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.data.activities).toHaveLength(1);
        expect(response.body.data.activities[0].title).toBe('Actividad visible');
    });

    test('rejects unsupported file types and files larger than the configured limit', async () => {
        const fixture = await createFixture();
        const createRes = await request(app)
            .post('/api/activities/teacher/me')
            .set('Authorization', `Bearer ${fixture.teacher.token}`)
            .send(activityPayload(fixture))
            .expect(201);

        const activityId = createRes.body.data.activity._id;

        const badType = await request(app)
            .post(`/api/activities/student/me/${activityId}/submission`)
            .set('Authorization', `Bearer ${fixture.student.token}`)
            .attach('submission_file', Buffer.from('malicious'), 'entrega.exe');

        expect(badType.statusCode).toBe(400);
        expect(badType.body.message).toContain('Formato inválido');

        const oversized = await request(app)
            .post(`/api/activities/student/me/${activityId}/submission`)
            .set('Authorization', `Bearer ${fixture.student.token}`)
            .attach('submission_file', Buffer.alloc(21 * 1024 * 1024, 'a'), 'entrega.pdf');

        expect(oversized.statusCode).toBe(400);
        expect(oversized.body.message).toContain('20MB');
    });

    test('allows resubmission before due date and rejects submissions after due date', async () => {
        const fixture = await createFixture();
        const createRes = await request(app)
            .post('/api/activities/teacher/me')
            .set('Authorization', `Bearer ${fixture.teacher.token}`)
            .send(activityPayload(fixture, { allowed_extensions: ['txt'] }))
            .expect(201);

        const activityId = createRes.body.data.activity._id;

        const firstSubmission = await request(app)
            .post(`/api/activities/student/me/${activityId}/submission`)
            .set('Authorization', `Bearer ${fixture.student.token}`)
            .attach('submission_file', Buffer.from('version 1'), 'entrega.txt');

        expect(firstSubmission.statusCode).toBe(200);
        expect(firstSubmission.body.data.submission.original_name).toBe('entrega.txt');

        const secondSubmission = await request(app)
            .post(`/api/activities/student/me/${activityId}/submission`)
            .set('Authorization', `Bearer ${fixture.student.token}`)
            .attach('submission_file', Buffer.from('version 2'), 'entrega-final.txt');

        expect(secondSubmission.statusCode).toBe(200);
        expect(secondSubmission.body.data.submission.original_name).toBe('entrega-final.txt');

        await Activity.findByIdAndUpdate(activityId, { due_at: new Date(Date.now() - 60_000) });

        const lateSubmission = await request(app)
            .post(`/api/activities/student/me/${activityId}/submission`)
            .set('Authorization', `Bearer ${fixture.student.token}`)
            .attach('submission_file', Buffer.from('late'), 'tarde.txt');

        expect(lateSubmission.statusCode).toBe(400);
        expect(lateSubmission.body.message).toContain('fecha límite');
    });

    test('grades by rubric on a 0-10 scale and clears the grade when the student resubmits', async () => {
        const fixture = await createFixture();
        const createRes = await request(app)
            .post('/api/activities/teacher/me')
            .set('Authorization', `Bearer ${fixture.teacher.token}`)
            .send(activityPayload(fixture, { allowed_extensions: ['txt'] }))
            .expect(201);

        const activity = createRes.body.data.activity;
        const activityId = activity._id;

        await request(app)
            .post(`/api/activities/student/me/${activityId}/submission`)
            .set('Authorization', `Bearer ${fixture.student.token}`)
            .attach('submission_file', Buffer.from('initial work'), 'actividad.txt')
            .expect(200);

        const reviewRes = await request(app)
            .post(`/api/activities/teacher/me/${activityId}/submissions/${fixture.student.profile._id}/review`)
            .set('Authorization', `Bearer ${fixture.teacher.token}`)
            .send({
                rubric_scores: [
                    {
                        criterion_id: activity.rubric_criteria[0]._id,
                        earned_points: 8,
                        feedback: 'Buen desarrollo',
                    },
                    {
                        criterion_id: activity.rubric_criteria[1]._id,
                        earned_points: 6,
                        feedback: 'Respuesta aceptable',
                    },
                ],
                teacher_feedback: 'Puedes mejorar la justificación del resultado.',
            });

        expect(reviewRes.statusCode).toBe(200);
        expect(reviewRes.body.data.submission.status).toBe('graded');
        expect(reviewRes.body.data.submission.score_10).toBe(7);

        const resubmission = await request(app)
            .post(`/api/activities/student/me/${activityId}/submission`)
            .set('Authorization', `Bearer ${fixture.student.token}`)
            .attach('submission_file', Buffer.from('improved work'), 'actividad-v2.txt');

        expect(resubmission.statusCode).toBe(200);
        expect(resubmission.body.data.submission.status).toBe('submitted');
        expect(resubmission.body.data.submission.score_10).toBeNull();
        expect(resubmission.body.data.submission.rubric_scores).toHaveLength(0);
        expect(resubmission.body.data.submission.teacher_feedback).toBeNull();

        const submissionDoc = await ActivitySubmission.findOne({
            activity_id: activityId,
            student_id: fixture.student.profile._id,
        });

        expect(submissionDoc.status).toBe('submitted');
        expect(submissionDoc.score_10).toBeNull();
        expect(submissionDoc.rubric_scores).toHaveLength(0);
    });

    test('accepts link submissions when the activity allows the link format', async () => {
        const fixture = await createFixture();
        const createRes = await request(app)
            .post('/api/activities/teacher/me')
            .set('Authorization', `Bearer ${fixture.teacher.token}`)
            .send(activityPayload(fixture, { allowed_extensions: ['link'] }))
            .expect(201);

        const activityId = createRes.body.data.activity._id;

        const linkSubmission = await request(app)
            .post(`/api/activities/student/me/${activityId}/submission`)
            .set('Authorization', `Bearer ${fixture.student.token}`)
            .field('link_url', 'https://example.com/entrega/123');

        expect(linkSubmission.statusCode).toBe(200);
        expect(linkSubmission.body.data.submission.submission_type).toBe('link');
        expect(linkSubmission.body.data.submission.link_url).toBe('https://example.com/entrega/123');
        expect(linkSubmission.body.data.submission.file_url).toBeNull();
    });
});
