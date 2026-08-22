import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let app;
let appConfig;
let generateToken;
let User;
let Person;
let Student;
let Grade;
let Group;
let SchoolYear;
let Enrollment;
let StudentGuardian;
let ImportJob;
let mongoServer;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'imports-test-secret';

    mongoServer = await MongoMemoryServer.create();
    process.env.DATABASE_URL = mongoServer.getUri('educonnect_imports_test');

    ({ default: app } = await import('../src/app.js'));
    ({ default: appConfig } = await import('../src/config/config.js'));
    ({ generateToken } = await import('../src/utils/jwt.js'));
    ({ default: User } = await import('../src/models/UserModel.js'));
    ({ default: Person } = await import('../src/models/PersonModel.js'));
    ({ default: Student } = await import('../src/models/StudentModel.js'));
    ({ default: Grade } = await import('../src/models/GradeModel.js'));
    ({ default: Group } = await import('../src/models/GroupModel.js'));
    ({ default: SchoolYear } = await import('../src/models/SchoolYearModel.js'));
    ({ default: Enrollment } = await import('../src/models/EnrollmentModel.js'));
    ({ default: StudentGuardian } = await import('../src/models/StudentGuardianModel.js'));
    ({ default: ImportJob } = await import('../src/models/ImportJobModel.js'));

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
    const user = await User.create({ email: 'imports.admin@educonnect.local', hash_password: 'Password123!' });
    const person = await Person.create({
        user_id: user._id,
        first_name: 'Admin',
        last_name: 'Importaciones',
        role: 'Admin',
        status: 'active',
        document_type: 'CC',
        document_number: 'IMP-ADMIN-1',
    });
    await User.findByIdAndUpdate(user._id, { person_id: person._id });
    return generateToken(user._id, 'Admin');
};

const upload = (token, entity, csv) => request(app)
    .post('/api/imports/preview')
    .set('Authorization', `Bearer ${token}`)
    .field('entity', entity)
    .attach('file', Buffer.from(csv), { filename: `${entity}.csv`, contentType: 'text/csv' });

describe('Controlled CSV imports', () => {
    it('previews and confirms academic identities, groups, enrollments and multi-student guardian links', async () => {
        const token = await createAdmin();
        const schoolYear = await SchoolYear.create({
            year: 2026,
            start_date: '2026-01-01',
            end_date: '2026-12-31',
            is_active: true,
        });

        const gradesPreview = await upload(token, 'grades', 'nombre,nivel\nSexto,6');
        expect(gradesPreview.status).toBe(201);
        expect(gradesPreview.body.data.summary.valid).toBe(1);
        await request(app)
            .post(`/api/imports/${gradesPreview.body.data._id}/confirm`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        const studentsPreview = await upload(
            token,
            'students',
            'correo,nombre,apellido,tipo_documento,numero_documento,clave\n' +
                'laura@example.com,Laura,Lopez,CC,1001,Password123!\n' +
                'mateo@example.com,Mateo,Ruiz,CC,1002,Password123!'
        );
        expect(studentsPreview.body.data.summary).toMatchObject({ total: 2, valid: 2, invalid: 0 });
        await request(app)
            .post(`/api/imports/${studentsPreview.body.data._id}/confirm`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        const groupPreview = await upload(token, 'groups', 'ano,grado,nombre,capacidad\n2026,Sexto,6A,30');
        expect(groupPreview.body.data.summary.invalid).toBe(0);
        await request(app)
            .post(`/api/imports/${groupPreview.body.data._id}/confirm`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        const enrollmentPreview = await upload(
            token,
            'enrollments',
            'documento_estudiante,ano,nombre_grupo\n1001,2026,6A\n1002,2026,6A'
        );
        expect(enrollmentPreview.body.data.summary).toMatchObject({ total: 2, valid: 2, invalid: 0 });
        await request(app)
            .post(`/api/imports/${enrollmentPreview.body.data._id}/confirm`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        const guardianPreview = await upload(
            token,
            'guardians',
            'correo,nombre,apellido,tipo_documento,numero_documento,clave,documento_estudiante,parentesco\n' +
                'guardian@example.com,Maria,Acudiente,CC,2001,Password123!,1001,mother\n' +
                'guardian@example.com,Maria,Acudiente,CC,2001,Password123!,1002,mother'
        );
        expect(guardianPreview.body.data.summary).toMatchObject({ total: 2, valid: 2, invalid: 0 });
        await request(app)
            .post(`/api/imports/${guardianPreview.body.data._id}/confirm`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(await Student.countDocuments()).toBe(2);
        expect(await Group.countDocuments({ school_year_id: schoolYear._id })).toBe(1);
        expect(await Enrollment.countDocuments({ status: 'active' })).toBe(2);
        expect(await StudentGuardian.countDocuments()).toBe(2);
        expect(await ImportJob.countDocuments({ status: 'confirmed' })).toBe(5);
    });

    it('keeps invalid rows in preview and blocks confirmation', async () => {
        const token = await createAdmin();
        const preview = await upload(token, 'students', 'correo,nombre\nnot-an-email,Sin Apellido');

        expect(preview.status).toBe(201);
        expect(preview.body.data.summary.invalid).toBe(1);

        const confirmation = await request(app)
            .post(`/api/imports/${preview.body.data._id}/confirm`)
            .set('Authorization', `Bearer ${token}`);

        expect(confirmation.status).toBe(400);
        expect(await Student.countDocuments()).toBe(0);
    });
});
