import { fileURLToPath } from 'node:url';
import mongoose, { type Model } from 'mongoose';
import appConfig from '../src/config/config.js';
import Activity from '../src/models/ActivityModel.js';
import ActivitySubmission from '../src/models/ActivitySubmissionModel.js';
import Area from '../src/models/AreaModel.js';
import AttendanceRecord from '../src/models/AttendanceRecordModel.js';
import AttendanceSession from '../src/models/AttendanceSessionModel.js';
import AuditLog from '../src/models/AuditLogModel.js';
import Aula from '../src/models/AulaModel.js';
import Campus from '../src/models/CampusModel.js';
import ClassSession from '../src/models/ClassSessionModel.js';
import Enrollment from '../src/models/EnrollmentModel.js';
import FinalResult from '../src/models/FinalResultModel.js';
import GradeArea from '../src/models/GradeAreaModel.js';
import GradeItem from '../src/models/GradeItemModel.js';
import Grade from '../src/models/GradeModel.js';
import GroupTeacher from '../src/models/GroupTeacherModel.js';
import Group from '../src/models/GroupModel.js';
import ImportJob from '../src/models/ImportJobModel.js';
import Institution from '../src/models/InstitutionModel.js';
import Notification from '../src/models/NotificationModel.js';
import PeriodAreaResult from '../src/models/PeriodAreaResultModel.js';
import Period from '../src/models/PeriodModel.js';
import Person from '../src/models/PersonModel.js';
import SchoolShift from '../src/models/SchoolShiftModel.js';
import SchoolYear from '../src/models/SchoolYearModel.js';
import Session from '../src/models/SessionModel.js';
import StudentGuardian from '../src/models/StudentGuardianModel.js';
import StudentGrade from '../src/models/StudentGradeModel.js';
import Student from '../src/models/StudentModel.js';
import Teacher from '../src/models/TeacherModel.js';
import User from '../src/models/UserModel.js';

type SeedModel = Model<any>;
type SeedValues = Record<string, unknown>;

type IdentitySpec = {
    email: string;
    firstName: string;
    lastName: string;
    role: 'Admin' | 'Teacher' | 'Parent' | 'Student';
    documentType: 'CC' | 'RC' | 'CE';
    documentNumber: string;
    phone: string;
    bornDate: string;
    institutionId: mongoose.Types.ObjectId | null;
    profile?: 'teacher' | 'student';
    area?: string;
};

type SeedIdentity = {
    user: any;
    person: any;
    profile?: any;
};

type SeedStats = Record<string, { created: number; updated: number }>;

const DEFAULT_PASSWORD = process.env.SEED_PASSWORD || 'EduConnect123!';
const DEFAULT_NAMESPACE = process.env.SEED_NAMESPACE || 'demo';
const SEED_CONFIRMATION = 'EDUCONNECT-DEMO';
const RESET_CONFIRMATION = 'EDUCONNECT-RESET';
const ANCHOR_DATE = process.env.SEED_ANCHOR_DATE || '2026-08-24T00:00:00.000Z';

const stats: SeedStats = {};

const normalizeSegment = (value: string, fallback: string): string => {
    const normalized = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 24);
    return normalized || fallback;
};

const normalizeInstitutionCode = (value: string): string => {
    const code = value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 40);
    if (code.length < 3) throw new Error('SEED_INSTITUTION_CODE debe tener al menos 3 caracteres validos');
    return code;
};

const namespace = normalizeSegment(DEFAULT_NAMESPACE, 'demo');
const institutionCode = normalizeInstitutionCode(process.env.SEED_INSTITUTION_CODE || `EDU-${namespace}`);
const seedDate = new Date(ANCHOR_DATE);

if (Number.isNaN(seedDate.getTime())) {
    throw new Error('SEED_ANCHOR_DATE debe ser una fecha ISO valida');
}

const statsFor = (label: string): { created: number; updated: number } => {
    stats[label] ||= { created: 0, updated: 0 };
    return stats[label];
};

const mark = (label: string, action: 'created' | 'updated'): void => {
    statsFor(label)[action] += 1;
};

const resetStats = (): void => {
    for (const key of Object.keys(stats)) delete stats[key];
};

const at = (dayOffset: number, hour: number, minute = 0): Date => {
    const date = new Date(seedDate);
    date.setUTCDate(date.getUTCDate() + dayOffset);
    date.setUTCHours(hour, minute, 0, 0);
    return date;
};

const id = (document: { _id: mongoose.Types.ObjectId }): mongoose.Types.ObjectId => document._id;

const ensureDocument = async (
    model: SeedModel,
    filter: SeedValues,
    values: SeedValues,
    label: string,
): Promise<any> => {
    const existing = await model.findOne(filter);
    if (existing) {
        existing.set(values);
        await existing.save();
        mark(label, 'updated');
        return existing;
    }

    const created = await model.create({ ...filter, ...values });
    mark(label, 'created');
    return created;
};

const ensureUser = async (
    spec: Pick<IdentitySpec, 'email' | 'institutionId'>,
): Promise<any> => {
    let user = await User.findOne({ email: spec.email });
    if (!user) {
        user = await User.create({
            email: spec.email,
            hash_password: DEFAULT_PASSWORD,
            institution_id: spec.institutionId,
        });
        mark('User', 'created');
        return user;
    }

    await User.updateOne({ _id: user._id }, { $set: { institution_id: spec.institutionId } });
    user.institution_id = spec.institutionId;
    mark('User', 'updated');
    return user;
};

const ensureIdentity = async (spec: IdentitySpec): Promise<SeedIdentity> => {
    const user = await ensureUser(spec);
    const person = await ensureDocument(
        Person,
        { user_id: user._id },
        {
            institution_id: spec.institutionId,
            first_name: spec.firstName,
            last_name: spec.lastName,
            phone: spec.phone,
            role: spec.role,
            status: 'active',
            born_date: new Date(spec.bornDate),
            document_type: spec.documentType,
            document_number: spec.documentNumber,
        },
        'Person',
    );

    if (!user.person_id || String(user.person_id) !== String(person._id)) {
        await User.updateOne({ _id: user._id }, { $set: { person_id: person._id } });
        user.person_id = person._id;
    }

    let profile: any;
    if (spec.profile === 'teacher') {
        profile = await ensureDocument(
            Teacher,
            { user_id: user._id },
            { institution_id: spec.institutionId, area: spec.area || null },
            'Teacher',
        );
    }

    if (spec.profile === 'student') {
        profile = await ensureDocument(
            Student,
            { user_id: user._id },
            { institution_id: spec.institutionId },
            'Student',
        );
    }

    return { user, person, profile };
};

const ensureInstitution = async (adminUserId: mongoose.Types.ObjectId): Promise<any> => (
    ensureDocument(
        Institution,
        { code: institutionCode },
        {
            name: 'Colegio EduConnect Demo',
            type: 'private',
            status: 'active',
            max_students: 800,
            timezone: 'America/Bogota',
            created_by_user_id: adminUserId,
        },
        'Institution',
    )
);

const updateInstitutionReference = async (
    identity: SeedIdentity,
    institutionId: mongoose.Types.ObjectId,
): Promise<void> => {
    await User.updateOne({ _id: identity.user._id }, { $set: { institution_id: institutionId } });
    identity.user.institution_id = institutionId;
    identity.person.institution_id = institutionId;
    await identity.person.save();
};

const countFor = async (model: SeedModel, filter: SeedValues): Promise<number> => (
    model.countDocuments(filter)
);

const verifyCoverage = async (institutionId: mongoose.Types.ObjectId, sessionJti: string): Promise<Record<string, number>> => {
    const checks: Array<[string, Promise<number>]> = [
        ['Institution', countFor(Institution, { _id: institutionId })],
        ['User', countFor(User, { institution_id: institutionId })],
        ['Person', countFor(Person, { institution_id: institutionId })],
        ['Session', countFor(Session, { jti: sessionJti })],
        ['Teacher', countFor(Teacher, { institution_id: institutionId })],
        ['Student', countFor(Student, { institution_id: institutionId })],
        ['Campus', countFor(Campus, { institution_id: institutionId })],
        ['SchoolShift', countFor(SchoolShift, { institution_id: institutionId })],
        ['SchoolYear', countFor(SchoolYear, { institution_id: institutionId })],
        ['Period', countFor(Period, { institution_id: institutionId })],
        ['Grade', countFor(Grade, { institution_id: institutionId })],
        ['Area', countFor(Area, { institution_id: institutionId })],
        ['GradeArea', countFor(GradeArea, { institution_id: institutionId })],
        ['Group', countFor(Group, { institution_id: institutionId })],
        ['Aula', countFor(Aula, { institution_id: institutionId })],
        ['Enrollment', countFor(Enrollment, { institution_id: institutionId })],
        ['GroupTeacher', countFor(GroupTeacher, { institution_id: institutionId })],
        ['GradeItem', countFor(GradeItem, { institution_id: institutionId })],
        ['StudentGrade', countFor(StudentGrade, { institution_id: institutionId })],
        ['PeriodAreaResult', countFor(PeriodAreaResult, { institution_id: institutionId })],
        ['FinalResult', countFor(FinalResult, { institution_id: institutionId })],
        ['Activity', countFor(Activity, { institution_id: institutionId })],
        ['ActivitySubmission', countFor(ActivitySubmission, { institution_id: institutionId })],
        ['ClassSession', countFor(ClassSession, { institution_id: institutionId })],
        ['AttendanceSession', countFor(AttendanceSession, { institution_id: institutionId })],
        ['AttendanceRecord', countFor(AttendanceRecord, { institution_id: institutionId })],
        ['StudentGuardian', countFor(StudentGuardian, { institution_id: institutionId })],
        ['Notification', countFor(Notification, { institution_id: institutionId })],
        ['AuditLog', countFor(AuditLog, { institution_id: institutionId })],
        ['ImportJob', countFor(ImportJob, { institution_id: institutionId })],
    ];

    const entries = await Promise.all(checks.map(async ([name, query]) => [name, await query] as const));
    const counts = Object.fromEntries(entries);
    const missing = Object.entries(counts).filter(([, value]) => value < 1).map(([name]) => name);
    if (missing.length > 0) {
        throw new Error(`El seed no cubrio las entidades: ${missing.join(', ')}`);
    }
    return counts;
};

export type SeedOptions = {
    reset?: boolean;
};

export const runSeed = async (options: SeedOptions = {}): Promise<{ institutionId: string; counts: Record<string, number>; stats: SeedStats }> => {
    resetStats();

    const resetRequested = options.reset ?? process.argv.includes('--reset');
    if (resetRequested) {
        if (appConfig.app.nodeEnv === 'production') {
            throw new Error('El modo reset esta bloqueado porque NODE_ENV=production. Para desarrollo usa NODE_ENV=development y una base local.');
        }
        if (process.env.SEED_RESET_CONFIRM !== RESET_CONFIRMATION) {
            throw new Error(`Reset bloqueado. Define SEED_RESET_CONFIRM=${RESET_CONFIRMATION} para confirmar el borrado total.`);
        }
    }

    if (appConfig.app.nodeEnv === 'production' && process.env.SEED_CONFIRM !== SEED_CONFIRMATION) {
        throw new Error(`Seed bloqueado en produccion. Define SEED_CONFIRM=${SEED_CONFIRMATION} solo con aprobacion explicita.`);
    }

    await appConfig.connectDatabase();

    try {
        if (resetRequested) {
            await mongoose.connection.dropDatabase();
            console.warn('Base de datos limpiada por solicitud explicita de reset.');
        }

        // Admin is created first because Institution stores its creator user.
        const admin = await ensureIdentity({
            email: `admin.${namespace}@educonnect.local`,
            firstName: 'Carla',
            lastName: 'Mendoza',
            role: 'Admin',
            documentType: 'CC',
            documentNumber: `ADM-${namespace}-001`,
            phone: '3001110001',
            bornDate: '1988-04-12',
            institutionId: null,
        });
        const institution = await ensureInstitution(id(admin.user));
        const institutionId = id(institution);
        await updateInstitutionReference(admin, institutionId);

        const teacher = await ensureIdentity({
            email: `teacher.${namespace}@educonnect.local`,
            firstName: 'Daniel',
            lastName: 'Vargas',
            role: 'Teacher',
            documentType: 'CC',
            documentNumber: `DOC-${namespace}-001`,
            phone: '3002220001',
            bornDate: '1991-06-09',
            institutionId,
            profile: 'teacher',
            area: 'Matematicas',
        });
        const parent = await ensureIdentity({
            email: `parent.${namespace}@educonnect.local`,
            firstName: 'Maria',
            lastName: 'Rodriguez',
            role: 'Parent',
            documentType: 'CC',
            documentNumber: `PAD-${namespace}-001`,
            phone: '3003330001',
            bornDate: '1987-08-22',
            institutionId,
        });
        const studentOne = await ensureIdentity({
            email: `student.one.${namespace}@educonnect.local`,
            firstName: 'Sofia',
            lastName: 'Rodriguez',
            role: 'Student',
            documentType: 'RC',
            documentNumber: `EST-${namespace}-001`,
            phone: '3004440001',
            bornDate: '2012-03-15',
            institutionId,
            profile: 'student',
        });
        const studentTwo = await ensureIdentity({
            email: `student.two.${namespace}@educonnect.local`,
            firstName: 'Mateo',
            lastName: 'Rodriguez',
            role: 'Student',
            documentType: 'RC',
            documentNumber: `EST-${namespace}-002`,
            phone: '3004440002',
            bornDate: '2014-07-20',
            institutionId,
            profile: 'student',
        });

        const campus = await ensureDocument(
            Campus,
            { institution_id: institutionId, code: 'CENTRO' },
            { name: 'Sede Centro', address: 'Calle 100 # 10-20', status: 'active', created_by_user_id: id(admin.user) },
            'Campus',
        );
        const shift = await ensureDocument(
            SchoolShift,
            { institution_id: institutionId, code: 'AM' },
            { name: 'Jornada manana', start_time: '07:00', end_time: '13:00', status: 'active', created_by_user_id: id(admin.user) },
            'SchoolShift',
        );
        const schoolYear = await ensureDocument(
            SchoolYear,
            { institution_id: institutionId, year: 2026 },
            {
                start_date: new Date('2026-01-15T00:00:00.000Z'),
                end_date: new Date('2026-11-30T23:59:59.000Z'),
                is_active: true,
                grading_policy: {
                    min_score: 0,
                    max_score: 10,
                    passing_score: 6,
                    performance_levels: [
                        { code: 'BAJO', label: 'Bajo', min_score: 0, max_score: 5.9 },
                        { code: 'BASICO', label: 'Basico', min_score: 6, max_score: 7.9 },
                        { code: 'ALTO', label: 'Alto', min_score: 8, max_score: 9.4 },
                        { code: 'SUPERIOR', label: 'Superior', min_score: 9.5, max_score: 10 },
                    ],
                },
            },
            'SchoolYear',
        );
        const period = await ensureDocument(
            Period,
            { institution_id: institutionId, school_year_id: id(schoolYear), name: 'Periodo 1' },
            {
                weight: 1,
                start_date: new Date('2026-01-15T00:00:00.000Z'),
                end_date: new Date('2026-04-30T23:59:59.000Z'),
                status: 'open',
                closed_at: null,
                closed_by_user_id: null,
            },
            'Period',
        );
        const grade = await ensureDocument(
            Grade,
            { institution_id: institutionId, name: 'Sexto' },
            { level: '6', description: 'Educacion basica secundaria' },
            'Grade',
        );
        const areaMath = await ensureDocument(
            Area,
            { institution_id: institutionId, name: 'Matematicas' },
            { description: 'Pensamiento numerico y algebraico' },
            'Area',
        );
        const areaLanguage = await ensureDocument(
            Area,
            { institution_id: institutionId, name: 'Lenguaje' },
            { description: 'Lectura critica y produccion textual' },
            'Area',
        );
        await ensureDocument(
            GradeArea,
            { institution_id: institutionId, grade_id: id(grade), area_id: id(areaMath) },
            { weekly_hours: 4 },
            'GradeArea',
        );
        await ensureDocument(
            GradeArea,
            { institution_id: institutionId, grade_id: id(grade), area_id: id(areaLanguage) },
            { weekly_hours: 3 },
            'GradeArea',
        );
        const aulaOne = await ensureDocument(
            Aula,
            { institution_id: institutionId, name: 'Aula 101' },
            { max_capacity: 35 },
            'Aula',
        );
        const aulaTwo = await ensureDocument(
            Aula,
            { institution_id: institutionId, name: 'Aula 102' },
            { max_capacity: 35 },
            'Aula',
        );
        const groupOne = await ensureDocument(
            Group,
            { institution_id: institutionId, school_year_id: id(schoolYear), grade_id: id(grade), name: '6A' },
            { max_capacity: 35 },
            'Group',
        );
        const groupTwo = await ensureDocument(
            Group,
            { institution_id: institutionId, school_year_id: id(schoolYear), grade_id: id(grade), name: '6B' },
            { max_capacity: 35 },
            'Group',
        );

        await ensureDocument(
            Enrollment,
            { institution_id: institutionId, student_id: id(studentOne.profile), school_year_id: id(schoolYear) },
            {
                group_id: id(groupOne),
                campus_id: id(campus),
                shift_id: id(shift),
                status: 'active',
                previous_enrollment_id: null,
                closed_at: null,
                transfer_reason: null,
                observations: 'Registro demo para validar el portal familiar.',
            },
            'Enrollment',
        );
        await ensureDocument(
            Enrollment,
            { institution_id: institutionId, student_id: id(studentTwo.profile), school_year_id: id(schoolYear) },
            {
                group_id: id(groupTwo),
                campus_id: id(campus),
                shift_id: id(shift),
                status: 'active',
                previous_enrollment_id: null,
                closed_at: null,
                transfer_reason: null,
                observations: 'Segundo estudiante del mismo acudiente.',
            },
            'Enrollment',
        );
        await ensureDocument(
            Student,
            { _id: id(studentOne.profile) },
            { institution_id: institutionId, group_id: id(groupOne), aula_id: id(aulaOne) },
            'Student',
        );
        await ensureDocument(
            Student,
            { _id: id(studentTwo.profile) },
            { institution_id: institutionId, group_id: id(groupTwo), aula_id: id(aulaTwo) },
            'Student',
        );
        await ensureDocument(
            GroupTeacher,
            { institution_id: institutionId, teacher_id: id(teacher.profile), group_id: id(groupOne), area_id: id(areaMath) },
            {},
            'GroupTeacher',
        );
        await ensureDocument(
            GroupTeacher,
            { institution_id: institutionId, teacher_id: id(teacher.profile), group_id: id(groupTwo), area_id: id(areaMath) },
            {},
            'GroupTeacher',
        );

        const gradeItemMath = await ensureDocument(
            GradeItem,
            { institution_id: institutionId, area_id: id(areaMath), period_id: id(period), name: 'Taller de ecuaciones' },
            { percentage: 100 },
            'GradeItem',
        );
        const gradeItemLanguage = await ensureDocument(
            GradeItem,
            { institution_id: institutionId, area_id: id(areaLanguage), period_id: id(period), name: 'Lectura critica' },
            { percentage: 100 },
            'GradeItem',
        );
        await ensureDocument(
            StudentGrade,
            { institution_id: institutionId, student_id: id(studentOne.profile), grade_item_id: id(gradeItemMath) },
            { score: 8.5 },
            'StudentGrade',
        );
        await ensureDocument(
            StudentGrade,
            { institution_id: institutionId, student_id: id(studentTwo.profile), grade_item_id: id(gradeItemLanguage) },
            { score: 7.8 },
            'StudentGrade',
        );
        await ensureDocument(
            PeriodAreaResult,
            { institution_id: institutionId, student_id: id(studentOne.profile), area_id: id(areaMath), period_id: id(period) },
            { final_score: 8.5 },
            'PeriodAreaResult',
        );
        await ensureDocument(
            PeriodAreaResult,
            { institution_id: institutionId, student_id: id(studentTwo.profile), area_id: id(areaLanguage), period_id: id(period) },
            { final_score: 7.8 },
            'PeriodAreaResult',
        );
        await ensureDocument(
            FinalResult,
            { institution_id: institutionId, student_id: id(studentOne.profile), school_year_id: id(schoolYear) },
            { final_score: 8.5, status: 'passed' },
            'FinalResult',
        );
        await ensureDocument(
            FinalResult,
            { institution_id: institutionId, student_id: id(studentTwo.profile), school_year_id: id(schoolYear) },
            { final_score: 7.8, status: 'passed' },
            'FinalResult',
        );

        const activity = await ensureDocument(
            Activity,
            { institution_id: institutionId, group_id: id(groupOne), area_id: id(areaMath), period_id: id(period), title: 'Proyecto de fracciones' },
            {
                description: 'Actividad de practica para el primer periodo.',
                context: 'Resolver situaciones cotidianas usando fracciones equivalentes.',
                school_year_id: id(schoolYear),
                teacher_id: id(teacher.profile),
                open_at: at(-2, 8),
                due_at: at(5, 23, 59),
                allowed_extensions: ['link', 'pdf'],
                rubric_criteria: [{ title: 'Procedimiento', description: 'Explica el proceso.', max_points: 60 }, { title: 'Resultado', description: 'Presenta el resultado.', max_points: 40 }],
                status: 'published',
            },
            'Activity',
        );
        const criterion = activity.rubric_criteria[0];
        await ensureDocument(
            ActivitySubmission,
            { institution_id: institutionId, activity_id: id(activity), student_id: id(studentOne.profile) },
            {
                submission_type: 'link',
                link_url: 'https://example.educonnect.local/entregas/fracciones',
                submitted_at: at(1, 16),
                status: 'graded',
                rubric_scores: [{ criterion_id: criterion._id, title: criterion.title, max_points: 60, earned_points: 54, feedback: 'Buen procedimiento.' }],
                earned_points: 90,
                max_points: 100,
                score_10: 9,
                teacher_feedback: 'Entrega completa.',
                graded_at: at(2, 10),
            },
            'ActivitySubmission',
        );

        await ensureDocument(
            ClassSession,
            { institution_id: institutionId, group_id: id(groupOne), area_id: id(areaMath), start_at: at(1, 8) },
            {
                school_year_id: id(schoolYear),
                teacher_id: id(teacher.profile),
                aula_id: id(aulaOne),
                end_at: at(1, 9),
                topic: 'Fracciones equivalentes',
                status: 'scheduled',
                created_by: id(admin.user),
                updated_by: id(admin.user),
            },
            'ClassSession',
        );
        await ensureDocument(
            ClassSession,
            { institution_id: institutionId, group_id: id(groupTwo), area_id: id(areaMath), start_at: at(1, 10) },
            {
                school_year_id: id(schoolYear),
                teacher_id: id(teacher.profile),
                aula_id: id(aulaTwo),
                end_at: at(1, 11),
                topic: 'Problemas con porcentajes',
                status: 'scheduled',
                created_by: id(admin.user),
                updated_by: id(admin.user),
            },
            'ClassSession',
        );

        const attendanceOne = await ensureDocument(
            AttendanceSession,
            { institution_id: institutionId, group_id: id(groupOne), date: at(2, 0) },
            {
                school_year_id: id(schoolYear),
                period_id: id(period),
                area_id: id(areaMath),
                teacher_id: id(teacher.profile),
                topic: 'Asistencia y participacion',
                status: 'open',
                created_by_user_id: id(teacher.user),
            },
            'AttendanceSession',
        );
        const attendanceTwo = await ensureDocument(
            AttendanceSession,
            { institution_id: institutionId, group_id: id(groupTwo), date: at(2, 0) },
            {
                school_year_id: id(schoolYear),
                period_id: id(period),
                area_id: id(areaMath),
                teacher_id: id(teacher.profile),
                topic: 'Seguimiento de asistencia',
                status: 'open',
                created_by_user_id: id(teacher.user),
            },
            'AttendanceSession',
        );
        await ensureDocument(
            AttendanceRecord,
            { institution_id: institutionId, session_id: id(attendanceOne), student_id: id(studentOne.profile) },
            { status: 'present', note: 'Ingreso registrado.' },
            'AttendanceRecord',
        );
        await ensureDocument(
            AttendanceRecord,
            { institution_id: institutionId, session_id: id(attendanceTwo), student_id: id(studentTwo.profile) },
            { status: 'late', note: 'Ingreso despues del inicio.' },
            'AttendanceRecord',
        );
        await ensureDocument(
            StudentGuardian,
            { institution_id: institutionId, student_id: id(studentOne.profile), guardian_id: id(parent.user) },
            { relationship: 'mother', is_authorized: true },
            'StudentGuardian',
        );
        await ensureDocument(
            StudentGuardian,
            { institution_id: institutionId, student_id: id(studentTwo.profile), guardian_id: id(parent.user) },
            { relationship: 'mother', is_authorized: true },
            'StudentGuardian',
        );
        await ensureDocument(
            Notification,
            { institution_id: institutionId, recipient_user_id: id(parent.user), type: 'admin_announcement', title: 'Bienvenida al portal familiar' },
            {
                message: 'Tu cuenta tiene acceso a la informacion de tus dos estudiantes vinculados.',
                audience_role: 'parent',
                created_by_user_id: id(admin.user),
                created_by_role: 'admin',
                source_type: 'announcement',
                metadata: { seed_namespace: namespace },
            },
            'Notification',
        );

        const sessionJti = `seed-${namespace}-session`;
        await ensureDocument(
            Session,
            { jti: sessionJti },
            {
                user_id: id(admin.user),
                institution_id: institutionId,
                role: 'admin',
                expires_at: at(7, 23, 59),
                revoked_at: null,
                revoked_reason: null,
                last_seen_at: at(0, 8),
                ip_address: '127.0.0.1',
                user_agent: 'EduConnect demo seed',
            },
            'Session',
        );
        await ensureDocument(
            AuditLog,
            { institution_id: institutionId, actor_user_id: id(admin.user), action: 'seed.demo', entity_type: 'Institution', entity_id: String(institutionId) },
            {
                actor_role: 'admin',
                before: null,
                after: { code: institutionCode, namespace },
                ip_address: '127.0.0.1',
                user_agent: 'EduConnect demo seed',
                metadata: { seed_namespace: namespace },
            },
            'AuditLog',
        );
        await ensureDocument(
            ImportJob,
            { institution_id: institutionId, created_by_user_id: id(admin.user), file_name: `seed-${namespace}-students.csv` },
            {
                entity: 'students',
                status: 'preview',
                headers: ['email', 'first_name', 'last_name', 'document_type', 'document_number', 'password'],
                records: [{ row_number: 2, data: { email: `student.one.${namespace}@educonnect.local`, first_name: 'Sofia', last_name: 'Rodriguez' } }],
                validation_errors: [],
                summary: { total: 1, valid: 1, invalid: 0, created: 0, updated: 1 },
                confirmed_at: null,
            },
            'ImportJob',
        );

        const counts = await verifyCoverage(institutionId, sessionJti);
        console.log(`Seed demo completado para ${institutionCode} (${namespace})`);
        console.log(`Password de desarrollo: ${DEFAULT_PASSWORD}`);
        console.log(`Institucion: ${institutionId}`);
        console.table(counts);
        console.table(stats);
        return { institutionId: String(institutionId), counts, stats: structuredClone(stats) };
    } finally {
        await appConfig.disconnectDatabase();
    }
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    runSeed().catch((error) => {
        console.error('Error ejecutando seed demo:', error);
        process.exitCode = 1;
    });
}
