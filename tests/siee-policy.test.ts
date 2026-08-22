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
let ParentLink;
let SchoolYear;
let Period;
let Grade;
let Area;
let Group;
let GroupTeacher;
let Enrollment;
let GradeItem;
let StudentGrade;
let mongoServer;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'siee-policy-test-secret';
    mongoServer = await MongoMemoryServer.create();
    process.env.DATABASE_URL = mongoServer.getUri('educonnect_siee_policy_test');

    ({ default: app } = await import('../src/app.js'));
    ({ default: appConfig } = await import('../src/config/config.js'));
    ({ generateToken } = await import('../src/utils/jwt.js'));
    ({ default: User } = await import('../src/models/UserModel.js'));
    ({ default: Person } = await import('../src/models/PersonModel.js'));
    ({ default: Teacher } = await import('../src/models/TeacherModel.js'));
    ({ default: Student } = await import('../src/models/StudentModel.js'));
    ({ default: ParentLink } = await import('../src/models/StudentGuardianModel.js'));
    ({ default: SchoolYear } = await import('../src/models/SchoolYearModel.js'));
    ({ default: Period } = await import('../src/models/PeriodModel.js'));
    ({ default: Grade } = await import('../src/models/GradeModel.js'));
    ({ default: Area } = await import('../src/models/AreaModel.js'));
    ({ default: Group } = await import('../src/models/GroupModel.js'));
    ({ default: GroupTeacher } = await import('../src/models/GroupTeacherModel.js'));
    ({ default: Enrollment } = await import('../src/models/EnrollmentModel.js'));
    ({ default: GradeItem } = await import('../src/models/GradeItemModel.js'));
    ({ default: StudentGrade } = await import('../src/models/StudentGradeModel.js'));
    await appConfig.connectDatabase();
});

afterAll(async () => {
    await appConfig.disconnectDatabase();
    await mongoServer.stop();
    await mongoose.connection.close();
});

beforeEach(async () => {
    for (const collection of Object.values(mongoose.connection.collections)) await collection.deleteMany({});
});

const actor = async (role, index) => {
    const user = await User.create({ email: `siee.${role.toLowerCase()}.${index}@educonnect.local`, hash_password: 'Password123!' });
    const person = await Person.create({
        user_id: user._id,
        first_name: `${role}${index}`,
        last_name: 'Policy',
        role,
        status: 'active',
        document_type: 'CC',
        document_number: `SIEE-${role}-${index}`,
    });
    await User.findByIdAndUpdate(user._id, { person_id: person._id });
    const profile = role === 'Teacher'
        ? await Teacher.create({ user_id: user._id })
        : role === 'Student'
            ? await Student.create({ user_id: user._id })
            : null;
    return { user, profile, token: generateToken(user._id, role) };
};

describe('SIEE grading policy', () => {
    it('validates scores and family summaries against the configured scale', async () => {
        const admin = await actor('Admin', 1);
        const teacher = await actor('Teacher', 1);
        const student = await actor('Student', 1);
        const parent = await actor('Parent', 1);
        const schoolYear = await SchoolYear.create({
            year: 2026,
            start_date: '2026-01-01',
            end_date: '2026-12-31',
            is_active: true,
            grading_policy: { min_score: 0, max_score: 5, passing_score: 3 },
        });
        const period = await Period.create({ school_year_id: schoolYear._id, name: 'Periodo 1', weight: 1, start_date: '2026-01-01', end_date: '2026-04-30' });
        const grade = await Grade.create({ name: '6°', level: '6' });
        const area = await Area.create({ name: 'Matemáticas' });
        const group = await Group.create({ name: '6A', grade_id: grade._id, school_year_id: schoolYear._id, max_capacity: 30 });
        await GroupTeacher.create({ teacher_id: teacher.profile._id, group_id: group._id, area_id: area._id });
        await Enrollment.create({ student_id: student.profile._id, school_year_id: schoolYear._id, group_id: group._id, status: 'active' });
        await ParentLink.create({ student_id: student.profile._id, guardian_id: parent.user._id, relationship: 'guardian' });
        const item = await GradeItem.create({ name: 'Taller', percentage: 100, area_id: area._id, period_id: period._id });

        const accepted = await request(app)
            .post('/api/evaluations/scores')
            .set('Authorization', `Bearer ${teacher.token}`)
            .send({ student_id: student.profile._id.toString(), grade_item_id: item._id.toString(), score: 4 });
        expect(accepted.status).toBe(200);

        const rejected = await request(app)
            .post('/api/evaluations/scores')
            .set('Authorization', `Bearer ${teacher.token}`)
            .send({ student_id: student.profile._id.toString(), grade_item_id: item._id.toString(), score: 6 });
        expect(rejected.status).toBe(400);

        const periodResult = await request(app)
            .post('/api/evaluations/period-results/calculate')
            .set('Authorization', `Bearer ${teacher.token}`)
            .send({ student_id: student.profile._id.toString(), area_id: area._id.toString(), period_id: period._id.toString() });
        expect(periodResult.status).toBe(200);
        expect(periodResult.body.data.final_score).toBe(4);

        const dashboard = await request(app)
            .get(`/api/guardians/me/dashboard?school_year_id=${schoolYear._id}`)
            .set('Authorization', `Bearer ${parent.token}`);
        expect(dashboard.status).toBe(200);
        expect(dashboard.body.data.students[0].overview.summary.final_status).toBe('passed');
        expect(await StudentGrade.countDocuments()).toBe(1);
        expect(admin.token).toBeDefined();
    });
});
