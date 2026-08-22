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
let Enrollment;
let SchoolYear;
let Grade;
let Group;
let Area;
let Teacher;
let Aula;
let ClassSession;
let mongoServer;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'guardian-calendar-test-secret';
    mongoServer = await MongoMemoryServer.create();
    process.env.DATABASE_URL = mongoServer.getUri('educonnect_guardian_calendar_test');

    ({ default: app } = await import('../src/app.js'));
    ({ default: appConfig } = await import('../src/config/config.js'));
    ({ generateToken } = await import('../src/utils/jwt.js'));
    ({ default: User } = await import('../src/models/UserModel.js'));
    ({ default: Person } = await import('../src/models/PersonModel.js'));
    ({ default: Student } = await import('../src/models/StudentModel.js'));
    ({ default: StudentGuardian } = await import('../src/models/StudentGuardianModel.js'));
    ({ default: Enrollment } = await import('../src/models/EnrollmentModel.js'));
    ({ default: SchoolYear } = await import('../src/models/SchoolYearModel.js'));
    ({ default: Grade } = await import('../src/models/GradeModel.js'));
    ({ default: Group } = await import('../src/models/GroupModel.js'));
    ({ default: Area } = await import('../src/models/AreaModel.js'));
    ({ default: Teacher } = await import('../src/models/TeacherModel.js'));
    ({ default: Aula } = await import('../src/models/AulaModel.js'));
    ({ default: ClassSession } = await import('../src/models/ClassSessionModel.js'));
    await appConfig.connectDatabase();
});

afterAll(async () => {
    await appConfig.disconnectDatabase();
    await mongoServer.stop();
    await mongoose.connection.close();
});

const actor = async (role, index) => {
    const user = await User.create({ email: `guardian-calendar.${role.toLowerCase()}.${index}@educonnect.local`, hash_password: 'Password123!' });
    const person = await Person.create({
        user_id: user._id,
        first_name: `${role}${index}`,
        last_name: 'Calendar',
        role,
        status: 'active',
        born_date: role === 'Student' ? '2012-01-01' : '1990-01-01',
        document_type: 'CC',
        document_number: `GC-${role}-${index}`,
    });
    await User.findByIdAndUpdate(user._id, { person_id: person._id });
    const profile = role === 'Student'
        ? await Student.create({ user_id: user._id })
        : role === 'Teacher'
            ? await Teacher.create({ user_id: user._id, area: 'Matemáticas' })
            : null;
    return { user, profile, token: generateToken(user._id, role) };
};

describe('Guardian calendar', () => {
    it('returns sessions for every linked student active group and excludes unlinked groups', async () => {
        const guardian = await actor('Parent', 1);
        const student = await actor('Student', 1);
        const secondStudent = await actor('Student', 2);
        const teacher = await actor('Teacher', 1);
        const schoolYear = await SchoolYear.create({ year: 2026, start_date: '2026-01-01', end_date: '2026-12-31', is_active: true });
        const grade = await Grade.create({ name: '6°', level: '6' });
        const area = await Area.create({ name: 'Matemáticas' });
        const aula = await Aula.create({ name: 'Aula 1', max_capacity: 30 });
        const group = await Group.create({ name: '6A', grade_id: grade._id, school_year_id: schoolYear._id, max_capacity: 30 });
        const unrelatedGroup = await Group.create({ name: '6B', grade_id: grade._id, school_year_id: schoolYear._id, max_capacity: 30 });
        await Enrollment.create({ student_id: student.profile._id, school_year_id: schoolYear._id, group_id: group._id, status: 'active' });
        await Enrollment.create({ student_id: secondStudent.profile._id, school_year_id: schoolYear._id, group_id: unrelatedGroup._id, status: 'active' });
        await StudentGuardian.create({ student_id: student.profile._id, guardian_id: guardian.user._id, relationship: 'father' });
        await StudentGuardian.create({ student_id: secondStudent.profile._id, guardian_id: guardian.user._id, relationship: 'father' });

        const start = new Date('2026-02-05T09:00:00.000Z');
        const end = new Date('2026-02-05T10:00:00.000Z');
        await ClassSession.create({
            school_year_id: schoolYear._id,
            group_id: group._id,
            area_id: area._id,
            teacher_id: teacher.profile._id,
            aula_id: aula._id,
            start_at: start,
            end_at: end,
            topic: 'Clase visible',
            created_by: teacher.user._id,
            updated_by: teacher.user._id,
        });
        await ClassSession.create({
            school_year_id: schoolYear._id,
            group_id: unrelatedGroup._id,
            area_id: area._id,
            teacher_id: teacher.profile._id,
            aula_id: aula._id,
            start_at: new Date('2026-02-05T11:00:00.000Z'),
            end_at: new Date('2026-02-05T12:00:00.000Z'),
            topic: 'Clase del segundo estudiante',
            created_by: teacher.user._id,
            updated_by: teacher.user._id,
        });

        const response = await request(app)
            .get('/api/calendar/me')
            .set('Authorization', `Bearer ${guardian.token}`)
            .query({ from: '2026-02-05', to: '2026-02-05', school_year_id: schoolYear._id.toString() });

        expect(response.status).toBe(200);
        expect(response.body.data.sessions).toHaveLength(2);
        expect(response.body.data.sessions.map((item) => item.topic)).toEqual([
            'Clase visible',
            'Clase del segundo estudiante',
        ]);
    });
});
