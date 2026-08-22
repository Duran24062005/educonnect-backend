import mongoose from 'mongoose';
import appConfig from '../src/config/config.js';
import Institution from '../src/models/InstitutionModel.js';
import User from '../src/models/UserModel.js';
import Person from '../src/models/PersonModel.js';
import Student from '../src/models/StudentModel.js';
import Teacher from '../src/models/TeacherModel.js';
import SchoolYear from '../src/models/SchoolYearModel.js';
import Period from '../src/models/PeriodModel.js';
import Grade from '../src/models/GradeModel.js';
import Area from '../src/models/AreaModel.js';
import Aula from '../src/models/AulaModel.js';
import GradeArea from '../src/models/GradeAreaModel.js';
import Group from '../src/models/GroupModel.js';
import GroupTeacher from '../src/models/GroupTeacherModel.js';
import Enrollment from '../src/models/EnrollmentModel.js';
import GradeItem from '../src/models/GradeItemModel.js';
import StudentGrade from '../src/models/StudentGradeModel.js';
import PeriodAreaResult from '../src/models/PeriodAreaResultModel.js';
import FinalResult from '../src/models/FinalResultModel.js';
import Activity from '../src/models/ActivityModel.js';
import ActivitySubmission from '../src/models/ActivitySubmissionModel.js';
import Notification from '../src/models/NotificationModel.js';
import Session from '../src/models/SessionModel.js';
import AuditLog from '../src/models/AuditLogModel.js';
import ClassSession from '../src/models/ClassSessionModel.js';

const help = process.argv.includes('--help') || process.argv.includes('-h');
if (help) {
    console.log('Uso: TENANT_MIGRATION_INSTITUTION_ID=<ObjectId> TENANT_MIGRATION_CONFIRM=EDUCONNECT-TENANT yarn migrate:tenant');
    process.exit(0);
}

const institutionId = process.env.TENANT_MIGRATION_INSTITUTION_ID;
if (!institutionId || !mongoose.isValidObjectId(institutionId)) {
    throw new Error('TENANT_MIGRATION_INSTITUTION_ID debe ser un ObjectId válido');
}

if (process.env.TENANT_MIGRATION_CONFIRM !== 'EDUCONNECT-TENANT') {
    throw new Error('La migración requiere TENANT_MIGRATION_CONFIRM=EDUCONNECT-TENANT');
}

const tenantId = new mongoose.Types.ObjectId(institutionId);
type TenantModel = {
    modelName: string;
    updateMany: (filter: unknown, update: unknown) => Promise<{ modifiedCount: number }>;
    syncIndexes: () => Promise<unknown>;
};

const models = [
    User,
    Person,
    Student,
    Teacher,
    SchoolYear,
    Period,
    Grade,
    Area,
    Aula,
    GradeArea,
    Group,
    GroupTeacher,
    Enrollment,
    GradeItem,
    StudentGrade,
    PeriodAreaResult,
    FinalResult,
    Activity,
    ActivitySubmission,
    Notification,
    Session,
    AuditLog,
    ClassSession,
] as unknown as TenantModel[];

const run = async () => {
    if (appConfig.app.nodeEnv === 'production' && process.env.TENANT_DATA_ISOLATION === 'true') {
        throw new Error('Ejecuta la migración con TENANT_DATA_ISOLATION=false y actívalo después de verificar índices y conteos');
    }

    await appConfig.connectDatabase();
    const institution = await Institution.findById(tenantId).select('_id status max_students');
    if (!institution) throw new Error(`Institución no encontrada: ${institutionId}`);
    if (institution.status === 'archived') throw new Error('No se puede migrar hacia una institución archivada');

    const filter = {
        $or: [
            { institution_id: null },
            { institution_id: { $exists: false } },
        ],
    };

    for (const model of models) {
        const result = await model.updateMany(filter, { $set: { institution_id: tenantId } });
        console.log(`${model.modelName}: ${result.modifiedCount} registros asignados`);
    }

    for (const model of models) {
        await model.syncIndexes();
        console.log(`${model.modelName}: índices sincronizados`);
    }

    console.log(`Migración tenant completada para ${institutionId}`);
};

run()
    .catch((error) => {
        console.error('Migración tenant fallida:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await appConfig.disconnectDatabase();
    });
