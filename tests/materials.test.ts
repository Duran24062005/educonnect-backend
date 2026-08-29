import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let app: any;
let appConfig: any;
let User: any;
let Person: any;
let Teacher: any;
let Student: any;
let SchoolYear: any;
let Grade: any;
let Group: any;
let Area: any;
let GradeArea: any;
let GroupTeacher: any;
let Enrollment: any;
let Aula: any;
let ClassSession: any;
let Material: any;
let mongoServer: MongoMemoryServer;
let sequence = 0;
let storage: any;

const actor = async (role: string, prefix: string) => {
    const user = await User.create({ email: `${prefix}.${Date.now()}@educonnect.local`, hash_password: 'Materials123!' });
    const person = await Person.create({
        user_id: user._id,
        first_name: prefix,
        last_name: 'Test',
        born_date: '1990-01-01',
        document_type: 'CC',
        document_number: `MAT-${prefix.slice(0, 4)}-${++sequence}`,
        role,
        status: 'active',
    });
    await User.findByIdAndUpdate(user._id, { person_id: person._id });
    const profile = role === 'Teacher'
        ? await Teacher.create({ user_id: user._id, area: 'Matemáticas' })
        : await Student.create({ user_id: user._id });
    const { generateToken } = await import('../src/utils/jwt.js');
    return { user, profile, token: generateToken(user._id, role) };
};

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'materials-test-secret';
    process.env.AWS_S3_BUCKET = 'educonnect-materials-test';
    process.env.MATERIAL_FILE_SIZE_LIMIT_MB = '50';
    mongoServer = await MongoMemoryServer.create();
    process.env.DATABASE_URL = mongoServer.getUri('educonnect_materials_test');

    storage = {
        uploads: [],
        deletions: [],
        async uploadProfilePhoto() { throw new Error('Not implemented'); },
        async uploadActivitySubmission() { throw new Error('Not implemented'); },
        async uploadMaterial({ sessionId, originalName }: any) {
            const key = `session-materials/${sessionId}/${Date.now()}-${originalName}`;
            const result = { provider: 'aws-s3', bucket: 'educonnect-materials-test', key, signedUrl: `https://signed.example/${++sequence}`, signedUrlExpiresAt: new Date(Date.now() + 900000) };
            this.uploads.push(result);
            return result;
        },
        async deleteObject(input: any) { this.deletions.push(input); },
        async buildSignedUrl({ key }: any) { return { url: `https://signed.example/refreshed-${++sequence}/${key}`, expiresAt: new Date(Date.now() + 900000) }; },
        isSignedUrlStale(expiresAt: any) { return !expiresAt || new Date(expiresAt).getTime() < Date.now(); },
    };
    globalThis.__EDUCONNECT_STORAGE_SERVICE__ = storage;

    ({ default: app } = await import('../src/app.js'));
    ({ default: appConfig } = await import('../src/config/config.js'));
    ({ default: User } = await import('../src/models/UserModel.js'));
    ({ default: Person } = await import('../src/models/PersonModel.js'));
    ({ default: Teacher } = await import('../src/models/TeacherModel.js'));
    ({ default: Student } = await import('../src/models/StudentModel.js'));
    ({ default: SchoolYear } = await import('../src/models/SchoolYearModel.js'));
    ({ default: Grade } = await import('../src/models/GradeModel.js'));
    ({ default: Group } = await import('../src/models/GroupModel.js'));
    ({ default: Area } = await import('../src/models/AreaModel.js'));
    ({ default: GradeArea } = await import('../src/models/GradeAreaModel.js'));
    ({ default: GroupTeacher } = await import('../src/models/GroupTeacherModel.js'));
    ({ default: Enrollment } = await import('../src/models/EnrollmentModel.js'));
    ({ default: Aula } = await import('../src/models/AulaModel.js'));
    ({ default: ClassSession } = await import('../src/models/ClassSessionModel.js'));
    ({ default: Material } = await import('../src/models/MaterialModel.js'));
    await appConfig.connectDatabase();
});

afterAll(async () => {
    delete globalThis.__EDUCONNECT_STORAGE_SERVICE__;
    await appConfig.disconnectDatabase();
    await mongoServer.stop();
    await mongoose.connection.close();
});

describe('Materials API', () => {
    let teacher: any;
    let outsider: any;
    let student: any;
    let otherStudent: any;
    let session: any;
    let otherGroup: any;

    beforeEach(async () => {
        for (const collection of Object.values(mongoose.connection.collections)) await collection.deleteMany({});
        const schoolYear = await SchoolYear.create({ year: 2026, start_date: '2026-01-01', end_date: '2026-12-31', is_active: true });
        const grade = await Grade.create({ name: '7' });
        const area = await Area.create({ name: 'Matemáticas' });
        const aula = await Aula.create({ name: 'Aula 201', max_capacity: 40 });
        const group = await Group.create({ name: `7A-${Date.now()}`, grade_id: grade._id, school_year_id: schoolYear._id, max_capacity: 40 });
        otherGroup = await Group.create({ name: `7B-${Date.now()}`, grade_id: grade._id, school_year_id: schoolYear._id, max_capacity: 40 });
        await GradeArea.create({ grade_id: grade._id, area_id: area._id, weekly_hours: 2 });
        teacher = await actor('Teacher', 'teacher');
        outsider = await actor('Teacher', 'outsider');
        student = await actor('Student', 'student');
        otherStudent = await actor('Student', 'other-student');
        await GroupTeacher.create({ teacher_id: teacher.profile._id, group_id: group._id, area_id: area._id });
        await Enrollment.create({ student_id: student.profile._id, school_year_id: schoolYear._id, group_id: group._id, status: 'active' });
        await Enrollment.create({ student_id: otherStudent.profile._id, school_year_id: schoolYear._id, group_id: otherGroup._id, status: 'active' });
        session = await ClassSession.create({
            school_year_id: schoolYear._id,
            group_id: group._id,
            area_id: area._id,
            teacher_id: teacher.profile._id,
            aula_id: aula._id,
            start_at: new Date('2026-08-28T12:00:00Z'),
            end_at: new Date('2026-08-28T13:00:00Z'),
            topic: 'Ecuaciones lineales',
            source: 'legacy',
            created_by: teacher.user._id,
            updated_by: teacher.user._id,
        });
    });

    test('allows multiple links and files, scopes students, and replaces stored files', async () => {
        const linkRes = await request(app).post('/api/materials/teacher/me')
            .set('Authorization', `Bearer ${teacher.token}`)
            .field('title', 'Video de apoyo')
            .field('description', 'Repaso previo')
            .field('session_id', session._id.toString())
            .field('link_url', 'https://example.com/video')
            ;
        expect(linkRes.statusCode).toBe(201);
        expect(linkRes.body.data.material.material_type).toBe('link');

        const fileRes = await request(app).post('/api/materials/teacher/me')
            .set('Authorization', `Bearer ${teacher.token}`)
            .field('title', 'Guía PDF')
            .field('session_id', session._id.toString())
            .attach('material_file', Buffer.from('pdf content'), { filename: 'guia.pdf', contentType: 'application/pdf' })
            .expect(201);
        expect(fileRes.body.data.material.material_type).toBe('file');
        expect(storage.uploads).toHaveLength(1);

        const list = await request(app).get('/api/materials/student/me').set('Authorization', `Bearer ${student.token}`).expect(200);
        expect(list.body.data.materials).toHaveLength(2);
        expect(list.body.data.materials.map((item: any) => item.title)).toEqual(expect.arrayContaining(['Video de apoyo', 'Guía PDF']));

        const outsiderList = await request(app).get('/api/materials/student/me').set('Authorization', `Bearer ${otherStudent.token}`).expect(200);
        expect(outsiderList.body.data.materials).toHaveLength(0);

        const materialId = fileRes.body.data.material._id;
        await request(app).put(`/api/materials/teacher/me/${materialId}`)
            .set('Authorization', `Bearer ${teacher.token}`)
            .field('title', 'Guía actualizada')
            .field('session_id', session._id.toString())
            .attach('material_file', Buffer.from('new content'), { filename: 'guia-v2.bin', contentType: 'application/octet-stream' })
            .expect(200);
        expect(storage.uploads).toHaveLength(2);
        expect(storage.deletions).toEqual(expect.arrayContaining([expect.objectContaining({ key: expect.stringContaining('guia.pdf') })]));
    });

    test('enforces teacher ownership and resource validation', async () => {
        await request(app).post('/api/materials/teacher/me')
            .set('Authorization', `Bearer ${teacher.token}`)
            .field('title', 'Inválido')
            .field('session_id', session._id.toString())
            .field('link_url', 'ftp://example.com/file')
            .expect(400);

        await request(app).post('/api/materials/teacher/me')
            .set('Authorization', `Bearer ${outsider.token}`)
            .field('title', 'No autorizado')
            .field('session_id', session._id.toString())
            .field('link_url', 'https://example.com')
            .expect(403);
    });

    test('updates the canonical session topic and keeps cancelled materials visible', async () => {
        const created = await request(app).post('/api/materials/teacher/me')
            .set('Authorization', `Bearer ${teacher.token}`)
            .field('title', 'Guía de clase')
            .field('session_id', session._id.toString())
            .field('topic', 'Sistemas de ecuaciones')
            .field('link_url', 'https://example.com/guide')
            ;
        expect(created.statusCode).toBe(201);
        const refreshedSession = await ClassSession.findById(session._id);
        expect(refreshedSession.topic).toBe('Sistemas de ecuaciones');

        await ClassSession.findByIdAndUpdate(session._id, { status: 'cancelled' });
        const studentList = await request(app).get('/api/materials/student/me').set('Authorization', `Bearer ${student.token}`).expect(200);
        expect(studentList.body.data.materials[0]._id).toBe(created.body.data.material._id);

        await request(app).delete(`/api/materials/teacher/me/${created.body.data.material._id}`).set('Authorization', `Bearer ${teacher.token}`).expect(200);
        expect(await Material.findById(created.body.data.material._id)).toBeNull();
    });
});
