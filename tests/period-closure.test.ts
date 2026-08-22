import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let app;
let appConfig;
let generateToken;
let User;
let Person;
let Teacher;
let SchoolYear;
let Period;
let Area;
let Grade;
let GradeArea;
let Group;
let GroupTeacher;
let mongoServer;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'period-closure-test-secret';
    mongoServer = await MongoMemoryServer.create();
    process.env.DATABASE_URL = mongoServer.getUri('educonnect_period_closure_test');

    ({ default: app } = await import('../src/app.js'));
    ({ default: appConfig } = await import('../src/config/config.js'));
    ({ generateToken } = await import('../src/utils/jwt.js'));
    ({ default: User } = await import('../src/models/UserModel.js'));
    ({ default: Person } = await import('../src/models/PersonModel.js'));
    ({ default: Teacher } = await import('../src/models/TeacherModel.js'));
    ({ default: SchoolYear } = await import('../src/models/SchoolYearModel.js'));
    ({ default: Period } = await import('../src/models/PeriodModel.js'));
    ({ default: Area } = await import('../src/models/AreaModel.js'));
    ({ default: Grade } = await import('../src/models/GradeModel.js'));
    ({ default: GradeArea } = await import('../src/models/GradeAreaModel.js'));
    ({ default: Group } = await import('../src/models/GroupModel.js'));
    ({ default: GroupTeacher } = await import('../src/models/GroupTeacherModel.js'));
    await appConfig.connectDatabase();
});

afterAll(async () => {
    await appConfig.disconnectDatabase();
    await mongoServer.stop();
    await mongoose.connection.close();
});

const actor = async (role, index) => {
    const user = await User.create({ email: `period-closure.${role.toLowerCase()}.${index}@educonnect.local`, hash_password: 'Password123!' });
    const person = await Person.create({ user_id: user._id, first_name: `${role}${index}`, last_name: 'Period', role, status: 'active', born_date: '1990-01-01', document_type: 'CC', document_number: `PC-${role}-${index}` });
    await User.findByIdAndUpdate(user._id, { person_id: person._id });
    const profile = role === 'Teacher' ? await Teacher.create({ user_id: user._id, area: 'Matemáticas' }) : null;
    return { user, profile, token: generateToken(user._id, role) };
};

describe('Period closure', () => {
    it('blocks grade item changes while closed and allows admin reopening', async () => {
        const admin = await actor('Admin', 1);
        const teacher = await actor('Teacher', 1);
        const schoolYear = await SchoolYear.create({ year: 2026, start_date: '2026-01-01', end_date: '2026-12-31', is_active: true });
        const period = await Period.create({ school_year_id: schoolYear._id, name: 'Periodo 1', weight: 1, start_date: '2026-01-01', end_date: '2026-04-30' });
        const grade = await Grade.create({ name: '7°', level: '7' });
        const area = await Area.create({ name: 'Matemáticas' });
        const group = await Group.create({ name: '7A', grade_id: grade._id, school_year_id: schoolYear._id, max_capacity: 30 });
        await GradeArea.create({ grade_id: grade._id, area_id: area._id, weekly_hours: 4 });
        await GroupTeacher.create({ teacher_id: teacher.profile._id, group_id: group._id, area_id: area._id });

        const closed = await request(app)
            .patch(`/api/academic/periods/${period._id}/status`)
            .set('Authorization', `Bearer ${admin.token}`)
            .send({ status: 'closed' });
        expect(closed.status).toBe(200);
        expect(closed.body.data.status).toBe('closed');

        const blocked = await request(app)
            .post('/api/evaluations/grade-items')
            .set('Authorization', `Bearer ${teacher.token}`)
            .send({ name: 'Taller 1', percentage: 100, area_id: area._id.toString(), period_id: period._id.toString() });
        expect(blocked.status).toBe(409);

        const reopened = await request(app)
            .patch(`/api/academic/periods/${period._id}/status`)
            .set('Authorization', `Bearer ${admin.token}`)
            .send({ status: 'open' });
        expect(reopened.status).toBe(200);
        expect(reopened.body.data.status).toBe('open');

        const created = await request(app)
            .post('/api/evaluations/grade-items')
            .set('Authorization', `Bearer ${teacher.token}`)
            .send({ name: 'Taller 1', percentage: 100, area_id: area._id.toString(), period_id: period._id.toString() });
        expect(created.status).toBe(201);
    });
});
