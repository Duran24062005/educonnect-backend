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
let Area;
let Group;
let GroupTeacher;
let Enrollment;
let StudentGuardian;
let mongoServer;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'attendance-test-secret';

    mongoServer = await MongoMemoryServer.create();
    process.env.DATABASE_URL = mongoServer.getUri('educonnect_attendance_test');

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
    ({ default: Area } = await import('../src/models/AreaModel.js'));
    ({ default: Group } = await import('../src/models/GroupModel.js'));
    ({ default: GroupTeacher } = await import('../src/models/GroupTeacherModel.js'));
    ({ default: Enrollment } = await import('../src/models/EnrollmentModel.js'));
    ({ default: StudentGuardian } = await import('../src/models/StudentGuardianModel.js'));

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

const actor = async (role, index) => {
    const user = await User.create({
        email: `attendance.${role.toLowerCase()}.${index}@educonnect.local`,
        hash_password: 'Password123!',
    });
    const person = await Person.create({
        user_id: user._id,
        first_name: `${role}${index}`,
        last_name: 'Attendance',
        role,
        status: 'active',
        born_date: role === 'Student' ? '2012-01-01' : '1990-01-01',
        document_type: 'CC',
        document_number: `ATT-${role}-${index}`,
    });
    await User.findByIdAndUpdate(user._id, { person_id: person._id });
    const profile = role === 'Teacher'
        ? await Teacher.create({ user_id: user._id, area: 'Matemáticas' })
        : role === 'Student'
            ? await Student.create({ user_id: user._id })
            : null;
    return { user, person, profile, token: generateToken(user._id, role) };
};

describe('Attendance API', () => {
    it('creates, updates and closes a session, then exposes the authorized guardian summary', async () => {
        const admin = await actor('Admin', 1);
        const teacher = await actor('Teacher', 1);
        const outsiderTeacher = await actor('Teacher', 2);
        const guardian = await actor('Parent', 1);
        const firstStudent = await actor('Student', 1);
        const secondStudent = await actor('Student', 2);
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
            start_date: '2026-01-01',
            end_date: '2026-04-30',
        });
        const grade = await Grade.create({ name: '7°', level: '7' });
        const area = await Area.create({ name: 'Matemáticas' });
        const group = await Group.create({
            name: '7A',
            grade_id: grade._id,
            school_year_id: schoolYear._id,
            max_capacity: 30,
        });
        await GroupTeacher.create({ teacher_id: teacher.profile._id, group_id: group._id, area_id: area._id });
        await Enrollment.create([
            { student_id: firstStudent.profile._id, school_year_id: schoolYear._id, group_id: group._id, status: 'active' },
            { student_id: secondStudent.profile._id, school_year_id: schoolYear._id, group_id: group._id, status: 'active' },
        ]);
        await StudentGuardian.create({ student_id: firstStudent.profile._id, guardian_id: guardian.user._id, relationship: 'mother' });
        await StudentGuardian.create({ student_id: secondStudent.profile._id, guardian_id: guardian.user._id, relationship: 'mother' });

        const input = {
            school_year_id: schoolYear._id.toString(),
            period_id: period._id.toString(),
            group_id: group._id.toString(),
            area_id: area._id.toString(),
            date: '2026-02-05',
            topic: 'Ecuaciones',
        };

        const forbidden = await request(app)
            .post('/api/attendance/sessions')
            .set('Authorization', `Bearer ${outsiderTeacher.token}`)
            .send(input);
        expect(forbidden.status).toBe(403);

        const created = await request(app)
            .post('/api/attendance/sessions')
            .set('Authorization', `Bearer ${teacher.token}`)
            .send(input);
        expect(created.status).toBe(201);
        expect(created.body.data.records).toHaveLength(2);
        expect(created.body.data.records.every((record) => record.status === 'pending')).toBe(true);

        const sessionId = created.body.data._id;
        const updated = await request(app)
            .patch(`/api/attendance/sessions/${sessionId}/records`)
            .set('Authorization', `Bearer ${teacher.token}`)
            .send({
                records: [
                    { student_id: firstStudent.profile._id.toString(), status: 'present' },
                    { student_id: secondStudent.profile._id.toString(), status: 'excused', justification: 'Cita médica' },
                ],
            });
        expect(updated.status).toBe(200);
        expect(updated.body.data.records.map((record) => record.status)).toEqual(expect.arrayContaining(['present', 'excused']));

        const closed = await request(app)
            .patch(`/api/attendance/sessions/${sessionId}/status`)
            .set('Authorization', `Bearer ${admin.token}`)
            .send({ status: 'closed' });
        expect(closed.status).toBe(200);
        expect(closed.body.data.status).toBe('closed');

        const report = await request(app)
            .get('/api/attendance/reports')
            .set('Authorization', 'Bearer ' + admin.token)
            .query({ school_year_id: schoolYear._id.toString(), group_id: group._id.toString() });
        expect(report.status).toBe(200);
        expect(report.body.data.summary.records).toBe(2);
        expect(report.body.data.summary.present).toBe(1);
        expect(report.body.data.summary.excused).toBe(1);

        const csv = await request(app)
            .get('/api/attendance/reports.csv')
            .set('Authorization', 'Bearer ' + admin.token)
            .query({ school_year_id: schoolYear._id.toString(), group_id: group._id.toString() });
        expect(csv.status).toBe(200);
        expect(csv.headers['content-type']).toContain('text/csv');
        expect(csv.text).toContain('date,group,grade,area,topic,student,status,note,justification');
        expect(csv.text).toContain('Ecuaciones');

        const guardianSummary = await request(app)
            .get('/api/guardians/me/attendance')
            .set('Authorization', `Bearer ${guardian.token}`)
            .query({ school_year_id: schoolYear._id.toString() });
        expect(guardianSummary.status).toBe(200);
        expect(guardianSummary.body.data.students).toHaveLength(2);
        const firstSummary = guardianSummary.body.data.students.find((item) => item.student._id === firstStudent.profile._id.toString());
        const secondSummary = guardianSummary.body.data.students.find((item) => item.student._id === secondStudent.profile._id.toString());
        expect(firstSummary.attendance.totals.present).toBe(1);
        expect(secondSummary.attendance.totals.excused).toBe(1);
        expect(firstSummary.attendance.attendance_rate).toBe(100);
    });
});
