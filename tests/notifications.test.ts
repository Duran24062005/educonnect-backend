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
let Notification;
let StudentGuardian;
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
    process.env.DATABASE_URL = mongoServer.getUri('educonnect_notifications_test');

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
    ({ default: Notification } = await import('../src/models/NotificationModel.js'));
    ({ default: StudentGuardian } = await import('../src/models/StudentGuardianModel.js'));

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
    const schoolYear = await SchoolYear.create({
        year: 2026,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        is_active: true,
    });

    const period = await Period.create({
        school_year_id: schoolYear._id,
        name: 'Periodo 1',
        weight: 0.25,
        start_date: '2026-01-10',
        end_date: '2026-03-30',
    });

    const grade = await Grade.create({ name: '6' });
    const area = await Area.create({ name: 'Matemáticas' });

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

    const admin = await createActor({
        role: 'Admin',
        emailPrefix: 'admin',
        firstName: 'Alice',
        lastName: 'Admin',
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
        admin,
        teacher,
        secondTeacher,
        student,
        secondStudent,
        period,
        area,
        group,
        otherGroup,
    };
};

const activityPayload = (fixture) => ({
    title: 'Taller de fracciones',
    description: 'Resolver ejercicios',
    context: 'Debes responder todos los puntos.',
    group_id: fixture.group._id.toString(),
    area_id: fixture.area._id.toString(),
    period_id: fixture.period._id.toString(),
    open_at: yesterday().toISOString(),
    due_at: tomorrow().toISOString(),
    allowed_extensions: ['txt', 'pdf', 'link'],
    rubric_criteria: [
        { title: 'Procedimiento', description: 'Claridad', max_points: 10 },
        { title: 'Resultado', description: 'Correctitud', max_points: 10 },
    ],
});

beforeEach(async () => {
    await clearDatabase();
});

describe('Notifications API', () => {
    test('creating a teacher activity notifies only active students in the target group', async () => {
        const fixture = await createFixture();

        const response = await request(app)
            .post('/api/activities/teacher/me')
            .set('Authorization', `Bearer ${fixture.teacher.token}`)
            .send(activityPayload(fixture));

        expect(response.statusCode).toBe(201);

        const studentNotifications = await Notification.find({ recipient_user_id: fixture.student.user._id });
        const otherStudentNotifications = await Notification.find({ recipient_user_id: fixture.secondStudent.user._id });

        expect(studentNotifications).toHaveLength(1);
        expect(studentNotifications[0].type).toBe('activity_created');
        expect(studentNotifications[0].metadata.area_name).toBe('Matemáticas');
        expect(otherStudentNotifications).toHaveLength(0);
    });

    test('submitting an activity notifies only the teacher creator', async () => {
        const fixture = await createFixture();

        const createResponse = await request(app)
            .post('/api/activities/teacher/me')
            .set('Authorization', `Bearer ${fixture.teacher.token}`)
            .send(activityPayload(fixture));

        const activityId = createResponse.body.data.activity._id;

        const submitResponse = await request(app)
            .post(`/api/activities/student/me/${activityId}/submission`)
            .set('Authorization', `Bearer ${fixture.student.token}`)
            .field('link_url', 'https://example.com/entrega');

        expect(submitResponse.statusCode).toBe(200);

        const teacherNotifications = await Notification.find({
            recipient_user_id: fixture.teacher.user._id,
            type: 'activity_submitted',
        });
        const otherTeacherNotifications = await Notification.find({
            recipient_user_id: fixture.secondTeacher.user._id,
            type: 'activity_submitted',
        });

        expect(teacherNotifications).toHaveLength(1);
        expect(teacherNotifications[0].metadata.student_name).toContain('Laura');
        expect(otherTeacherNotifications).toHaveLength(0);
    });

    test('teacher announcements reach authorized guardians without duplicating a multi-student guardian', async () => {
        const fixture = await createFixture();
        const guardian = await createActor({
            role: 'Parent',
            emailPrefix: 'guardian',
            firstName: 'Maria',
            lastName: 'Acudiente',
        });
        await StudentGuardian.create([
            { student_id: fixture.student.profile._id, guardian_id: guardian.user._id, relationship: 'mother' },
            { student_id: fixture.secondStudent.profile._id, guardian_id: guardian.user._id, relationship: 'mother' },
        ]);

        const response = await request(app)
            .post('/api/notifications/teacher/announcements')
            .set('Authorization', `Bearer ${fixture.teacher.token}`)
            .send({ title: 'Reunión', message: 'Reunión de seguimiento', scope: 'all_my_students' });

        expect(response.statusCode).toBe(201);
        expect(response.body.data.created_count).toBe(2);
        const guardianNotifications = await Notification.find({ recipient_user_id: guardian.user._id });
        expect(guardianNotifications).toHaveLength(1);
        expect(guardianNotifications[0].audience_role).toBe('parent');
    });

    test('admin can create announcements by role and users can mark notifications as read', async () => {
        const fixture = await createFixture();

        const createResponse = await request(app)
            .post('/api/notifications/admin/announcements')
            .set('Authorization', `Bearer ${fixture.admin.token}`)
            .send({
                title: 'Aviso docente',
                message: 'Revisen la planeación semanal.',
                target_role: 'teacher',
            });

        expect(createResponse.statusCode).toBe(201);
        expect(createResponse.body.data.created_count).toBe(2);

        const listResponse = await request(app)
            .get('/api/notifications/me')
            .set('Authorization', `Bearer ${fixture.teacher.token}`);

        expect(listResponse.statusCode).toBe(200);
        expect(listResponse.body.data.notifications).toHaveLength(1);
        expect(listResponse.body.data.notifications[0].type).toBe('admin_announcement');

        const unreadResponse = await request(app)
            .get('/api/notifications/me/unread-count')
            .set('Authorization', `Bearer ${fixture.teacher.token}`);

        expect(unreadResponse.statusCode).toBe(200);
        expect(unreadResponse.body.data.unread_count).toBe(1);

        const notificationId = listResponse.body.data.notifications[0].id;
        const markResponse = await request(app)
            .patch(`/api/notifications/${notificationId}/read`)
            .set('Authorization', `Bearer ${fixture.teacher.token}`);

        expect(markResponse.statusCode).toBe(200);
        expect(markResponse.body.data.notification.is_read).toBe(true);
    });

    test('teacher can announce to one assigned group only', async () => {
        const fixture = await createFixture();

        const response = await request(app)
            .post('/api/notifications/teacher/announcements')
            .set('Authorization', `Bearer ${fixture.teacher.token}`)
            .send({
                title: 'Recordatorio',
                message: 'No olviden la actividad.',
                scope: 'group',
                group_id: fixture.group._id.toString(),
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.data.created_count).toBe(1);

        const studentNotifications = await Notification.find({
            recipient_user_id: fixture.student.user._id,
            type: 'teacher_announcement',
        });
        const otherStudentNotifications = await Notification.find({
            recipient_user_id: fixture.secondStudent.user._id,
            type: 'teacher_announcement',
        });

        expect(studentNotifications).toHaveLength(1);
        expect(otherStudentNotifications).toHaveLength(0);
    });

    test('teacher cannot announce to a group without assignment', async () => {
        const fixture = await createFixture();

        const response = await request(app)
            .post('/api/notifications/teacher/announcements')
            .set('Authorization', `Bearer ${fixture.teacher.token}`)
            .send({
                title: 'Aviso',
                message: 'Mensaje inválido',
                scope: 'group',
                group_id: fixture.otherGroup._id.toString(),
            });

        expect(response.statusCode).toBe(403);
        expect(response.body.message).toContain('no tienes asignado');
    });
});
