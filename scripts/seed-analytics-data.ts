import appConfig from '../src/config/config.js';
import User from '../src/models/UserModel.js';
import Person from '../src/models/PersonModel.js';
import Student from '../src/models/StudentModel.js';
import Teacher from '../src/models/TeacherModel.js';
import SchoolYear from '../src/models/SchoolYearModel.js';
import Period from '../src/models/PeriodModel.js';
import Grade from '../src/models/GradeModel.js';
import Area from '../src/models/AreaModel.js';
import Group from '../src/models/GroupModel.js';
import GradeArea from '../src/models/GradeAreaModel.js';
import GroupTeacher from '../src/models/GroupTeacherModel.js';
import Enrollment from '../src/models/EnrollmentModel.js';
import PeriodAreaResult from '../src/models/PeriodAreaResultModel.js';
import FinalResult from '../src/models/FinalResultModel.js';

const DEFAULT_PASSWORD = 'EduConnect123!';
const DEFAULT_GROUP_SIZE = 8;
const DEFAULT_GROUP_SUFFIXES = ['A', 'B'];
const PASS_SCORE = 6;

type CliOptions = {
    activate: boolean;
    year: number | null;
    groupSize: number;
};

type SeedProfileInput = {
    email: string;
    first_name: string;
    last_name: string;
    role: 'Teacher' | 'Student';
    document_number: string;
};

type GradeDefinition = {
    name: string;
    level: string;
    description: string;
    _id?: unknown;
};

type ScoreSeedInput = {
    studentIndex: number;
    gradeIndex: number;
    groupIndex: number;
    areaIndex: number;
    periodIndex: number;
};

const AREA_DEFINITIONS = [
    { name: 'Matematicas', description: 'Pensamiento numerico y resolucion de problemas', weekly_hours: 5 },
    { name: 'Lenguaje', description: 'Comprension lectora y expresion escrita', weekly_hours: 5 },
    { name: 'Ciencias', description: 'Exploracion cientifica aplicada', weekly_hours: 4 },
    { name: 'Sociales', description: 'Contexto historico y ciudadano', weekly_hours: 3 },
    { name: 'Ingles', description: 'Competencia comunicativa en segunda lengua', weekly_hours: 3 },
];

const GRADE_DEFINITIONS: GradeDefinition[] = [
    { name: '6', level: 'Demo Analytics', description: 'Grado demo para analitica anual' },
    { name: '7', level: 'Demo Analytics', description: 'Grado demo para analitica anual' },
    { name: '8', level: 'Demo Analytics', description: 'Grado demo para analitica anual' },
];

const FIRST_NAMES = [
    'Ana', 'Luis', 'Marta', 'Julian', 'Paula', 'Sergio', 'Laura', 'Diego', 'Camila', 'Tomas',
    'Valeria', 'Mateo', 'Sara', 'Nicolas', 'Lucia', 'Samuel', 'Danna', 'Juan', 'Isabela', 'Andres',
    'Sofia', 'Daniel', 'Maria', 'Felipe', 'Gabriela', 'David', 'Natalia', 'Kevin', 'Daniela', 'Miguel',
    'Julieta', 'Sebastian', 'Mariana', 'Carlos', 'Emilia', 'Jeronimo', 'Salome', 'Brayan', 'Manuela', 'Cristian',
];

const LAST_NAMES = [
    'Lopez', 'Gomez', 'Martinez', 'Rodriguez', 'Diaz', 'Morales', 'Vargas', 'Rojas', 'Torres', 'Ruiz',
    'Pineda', 'Castro', 'Garcia', 'Mendoza', 'Sanchez', 'Navarro', 'Herrera', 'Acosta', 'Arias', 'Pena',
];

const cliArgs = process.argv.slice(2);
const cliOptions = cliArgs.reduce<CliOptions>((acc, arg) => {
    if (arg === '--activate') acc.activate = true;
    if (arg.startsWith('--year=')) acc.year = Number(arg.split('=')[1]);
    if (arg.startsWith('--group-size=')) acc.groupSize = Number(arg.split('=')[1]);
    return acc;
}, {
    activate: false,
    year: null,
    groupSize: DEFAULT_GROUP_SIZE,
});

const round2 = (value: number) => Number((value || 0).toFixed(2));
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const stringHash = (value: string) => {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
    }
    return Math.abs(hash);
};

const hashNoise = (seed: string, range = 1.2) => {
    const normalized = (stringHash(seed) % 1000) / 1000;
    return (normalized - 0.5) * range;
};

async function ensureUserWithProfile({ email, first_name, last_name, role, document_number }: SeedProfileInput) {
    let user = await User.findOne({ email });

    if (!user) {
        user = new User({
            email,
            hash_password: DEFAULT_PASSWORD,
        });
        await user.save();
    }

    let person = await Person.findOne({ user_id: user._id });
    if (!person) {
        person = new Person({
            user_id: user._id,
            first_name,
            last_name,
            role,
            status: 'active',
            document_type: 'CC',
            document_number,
        });
    } else {
        person.first_name = first_name;
        person.last_name = last_name;
        person.role = role;
        person.status = 'active';
        person.document_type = 'CC';
        person.document_number = document_number;
    }

    await person.save();

    if (!user.person_id || String(user.person_id) !== String(person._id)) {
        user.person_id = person._id;
        await user.save();
    }

    return { user, person };
}

async function ensureSchoolYear(targetYear: number, shouldActivate: boolean) {
    let schoolYear = await SchoolYear.findOne({ year: targetYear });

    if (!schoolYear) {
        schoolYear = await SchoolYear.create({
            year: targetYear,
            start_date: new Date(`${targetYear}-01-15T00:00:00.000Z`),
            end_date: new Date(`${targetYear}-11-30T23:59:59.999Z`),
            is_active: false,
        });
    }

    if (shouldActivate) {
        await SchoolYear.updateMany({ is_active: true }, { $set: { is_active: false } });
        schoolYear.is_active = true;
        await schoolYear.save();
    }

    return schoolYear;
}

async function ensurePeriods(schoolYearId: unknown, targetYear: number) {
    const periods = [
        { name: 'Periodo 1', weight: 0.25, start_date: new Date(`${targetYear}-01-15T00:00:00.000Z`), end_date: new Date(`${targetYear}-03-31T23:59:59.999Z`) },
        { name: 'Periodo 2', weight: 0.25, start_date: new Date(`${targetYear}-04-01T00:00:00.000Z`), end_date: new Date(`${targetYear}-06-15T23:59:59.999Z`) },
        { name: 'Periodo 3', weight: 0.25, start_date: new Date(`${targetYear}-07-15T00:00:00.000Z`), end_date: new Date(`${targetYear}-09-20T23:59:59.999Z`) },
        { name: 'Periodo 4', weight: 0.25, start_date: new Date(`${targetYear}-09-21T00:00:00.000Z`), end_date: new Date(`${targetYear}-11-30T23:59:59.999Z`) },
    ];

    const periodDocs = [];
    for (const period of periods) {
        let doc = await Period.findOne({ school_year_id: schoolYearId, name: period.name });
        if (!doc) {
            doc = new Period({ school_year_id: schoolYearId, ...period });
        } else {
            doc.weight = period.weight;
            doc.start_date = period.start_date;
            doc.end_date = period.end_date;
        }
        await doc.save();
        periodDocs.push(doc);
    }

    return periodDocs;
}

async function ensureAreas() {
    const areaDocs = [];
    for (const area of AREA_DEFINITIONS) {
        let doc = await Area.findOne({ name: area.name });
        if (!doc) {
            doc = new Area(area);
        } else {
            doc.description = area.description;
        }
        await doc.save();
        areaDocs.push(doc);
    }
    return areaDocs;
}

async function ensureGrades() {
    const gradeDocs = [];
    for (const grade of GRADE_DEFINITIONS) {
        let doc = await Grade.findOne({ name: grade.name, level: grade.level });
        if (!doc) {
            doc = new Grade(grade);
        } else {
            doc.description = grade.description;
        }
        await doc.save();
        gradeDocs.push(doc);
    }
    return gradeDocs;
}

async function ensureGradeAreas(gradeDocs: any[], areaDocs: any[]) {
    for (const grade of gradeDocs) {
        for (const area of areaDocs) {
            const definition = AREA_DEFINITIONS.find((item) => item.name === area.name);
            await GradeArea.updateOne(
                { grade_id: grade._id, area_id: area._id },
                {
                    $set: {
                        grade_id: grade._id,
                        area_id: area._id,
                        weekly_hours: definition?.weekly_hours || 3,
                    },
                },
                { upsert: true }
            );
        }
    }
}

async function ensureGroups(gradeDocs: any[], schoolYearId: unknown, groupSize: number) {
    const groups = [];
    for (const grade of gradeDocs) {
        for (const suffix of DEFAULT_GROUP_SUFFIXES) {
            const name = `Demo ${grade.name}${suffix}`;
            let group = await Group.findOne({
                school_year_id: schoolYearId,
                grade_id: grade._id,
                name,
            });

            if (!group) {
                group = new Group({
                    name,
                    grade_id: grade._id,
                    school_year_id: schoolYearId,
                    max_capacity: groupSize + 2,
                });
            } else {
                group.max_capacity = groupSize + 2;
            }

            await group.save();
            groups.push(group);
        }
    }
    return groups;
}

async function ensureTeachers(areaDocs: any[], groups: any[]) {
    const teachers = [];

    for (let index = 0; index < areaDocs.length; index += 1) {
        const area = areaDocs[index];
        const email = `demo.teacher.${index + 1}@educonnect.local`;
        const first_name = ['Laura', 'Carlos', 'Andrea', 'Natalia', 'Mauricio'][index] || `Docente${index + 1}`;
        const last_name = ['Ruiz', 'Gomez', 'Mora', 'Pineda', 'Salazar'][index] || 'Demo';
        const { user } = await ensureUserWithProfile({
            email,
            first_name,
            last_name,
            role: 'Teacher',
            document_number: `TD-${String(index + 1).padStart(4, '0')}`,
        });

        let teacher = await Teacher.findOne({ user_id: user._id });
        if (!teacher) {
            teacher = new Teacher({ user_id: user._id, area: area.name });
        } else {
            teacher.area = area.name;
        }
        await teacher.save();
        teachers.push({ teacher, area });
    }

    for (const group of groups) {
        for (const assignment of teachers) {
            await GroupTeacher.updateOne(
                {
                    teacher_id: assignment.teacher._id,
                    group_id: group._id,
                    area_id: assignment.area._id,
                },
                {
                    $set: {
                        teacher_id: assignment.teacher._id,
                        group_id: group._id,
                        area_id: assignment.area._id,
                    },
                },
                { upsert: true }
            );
        }
    }

    return teachers;
}

function buildStudentIdentity(globalIndex: number) {
    const first_name = FIRST_NAMES[globalIndex % FIRST_NAMES.length];
    const last_name = LAST_NAMES[Math.floor(globalIndex / FIRST_NAMES.length) % LAST_NAMES.length];
    return { first_name, last_name };
}

function buildScore({ studentIndex, gradeIndex, groupIndex, areaIndex, periodIndex }: ScoreSeedInput) {
    const base = 5.15 + (gradeIndex * 0.45) + (groupIndex * 0.18) + ((studentIndex % 8) * 0.22);
    const areaModifier = [0.55, 0.2, 0.1, -0.25, 0.35][areaIndex] || 0;
    const periodModifier = [-0.2, 0.15, 0.35, 0.2][periodIndex] || 0;
    const noise = hashNoise(`${studentIndex}:${gradeIndex}:${groupIndex}:${areaIndex}:${periodIndex}`, 1.4);
    return round2(clamp(base + areaModifier + periodModifier + noise, 3.2, 9.8));
}

async function seedStudentsAndResults({
    groups,
    areaDocs,
    periodDocs,
    schoolYear,
}: {
    groups: any[];
    areaDocs: any[];
    periodDocs: any[];
    schoolYear: any;
}) {
    let globalStudentIndex = 0;
    let periodAreaRows = 0;
    let finalRows = 0;

    for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
        const group = groups[groupIndex];
        const gradeIndex = GRADE_DEFINITIONS.findIndex((grade) => String(group.grade_id) === String(grade._id));

        for (let localIndex = 0; localIndex < cliOptions.groupSize; localIndex += 1) {
            globalStudentIndex += 1;
            const identity = buildStudentIdentity(globalStudentIndex - 1);
            const email = `demo.student.${schoolYear.year}.${String(globalStudentIndex).padStart(3, '0')}@educonnect.local`;
            const { user } = await ensureUserWithProfile({
                email,
                first_name: identity.first_name,
                last_name: identity.last_name,
                role: 'Student',
                document_number: `SD-${schoolYear.year}-${String(globalStudentIndex).padStart(4, '0')}`,
            });

            let student = await Student.findOne({ user_id: user._id });
            if (!student) {
                student = new Student({ user_id: user._id, group_id: group._id });
            } else {
                student.group_id = group._id;
            }
            await student.save();

            await Enrollment.updateOne(
                {
                    student_id: student._id,
                    school_year_id: schoolYear._id,
                    status: 'active',
                },
                {
                    $set: {
                        student_id: student._id,
                        school_year_id: schoolYear._id,
                        group_id: group._id,
                        status: 'active',
                        closed_at: null,
                        previous_enrollment_id: null,
                        transfer_reason: null,
                        observations: null,
                    },
                },
                { upsert: true }
            );

            const allScores = [];
            for (let areaIndex = 0; areaIndex < areaDocs.length; areaIndex += 1) {
                const area = areaDocs[areaIndex];
                for (let periodIndex = 0; periodIndex < periodDocs.length; periodIndex += 1) {
                    const period = periodDocs[periodIndex];
                    const final_score = buildScore({
                        studentIndex: globalStudentIndex,
                        gradeIndex: Math.max(gradeIndex, 0),
                        groupIndex,
                        areaIndex,
                        periodIndex,
                    });

                    allScores.push(final_score);

                    await PeriodAreaResult.updateOne(
                        {
                            student_id: student._id,
                            area_id: area._id,
                            period_id: period._id,
                        },
                        {
                            $set: {
                                student_id: student._id,
                                area_id: area._id,
                                period_id: period._id,
                                final_score,
                            },
                        },
                        { upsert: true }
                    );
                    periodAreaRows += 1;
                }
            }

            const final_score = round2(allScores.reduce((sum, value) => sum + value, 0) / allScores.length);
            let status = final_score >= PASS_SCORE ? 'passed' : 'failed';

            if (status === 'failed' && stringHash(email) % 4 === 0) {
                status = 'repeating';
            }

            await FinalResult.updateOne(
                {
                    student_id: student._id,
                    school_year_id: schoolYear._id,
                },
                {
                    $set: {
                        student_id: student._id,
                        school_year_id: schoolYear._id,
                        final_score,
                        status,
                    },
                },
                { upsert: true }
            );
            finalRows += 1;
        }
    }

    return {
        students: globalStudentIndex,
        periodAreaRows,
        finalRows,
    };
}

async function runSeed() {
    await appConfig.connectDatabase();

    try {
        const activeYear = await SchoolYear.findOne({ is_active: true });
        const targetYear: number = Number.isInteger(cliOptions.year)
            ? (cliOptions.year as number)
            : (activeYear?.year || new Date().getFullYear() + 1);

        const schoolYear = await ensureSchoolYear(targetYear, cliOptions.activate || !activeYear);
        const periodDocs = await ensurePeriods(schoolYear._id, schoolYear.year);
        const areaDocs = await ensureAreas();
        const gradeDocs = await ensureGrades();
        for (let index = 0; index < gradeDocs.length; index += 1) {
            GRADE_DEFINITIONS[index]._id = gradeDocs[index]._id;
        }
        await ensureGradeAreas(gradeDocs, areaDocs);
        const groups = await ensureGroups(gradeDocs, schoolYear._id, cliOptions.groupSize);
        const teachers = await ensureTeachers(areaDocs, groups);
        const studentSummary = await seedStudentsAndResults({
            groups,
            areaDocs,
            periodDocs,
            schoolYear,
        });

        console.log('Analytics seed completed');
        console.log(`School year: ${schoolYear.year}${schoolYear.is_active ? ' (active)' : ''}`);
        console.log(`Periods: ${periodDocs.length}`);
        console.log(`Grades: ${gradeDocs.length}`);
        console.log(`Areas: ${areaDocs.length}`);
        console.log(`Groups: ${groups.length}`);
        console.log(`Teachers: ${teachers.length}`);
        console.log(`Students: ${studentSummary.students}`);
        console.log(`Period results upserted: ${studentSummary.periodAreaRows}`);
        console.log(`Final results upserted: ${studentSummary.finalRows}`);
        console.log(`Default password for demo accounts: ${DEFAULT_PASSWORD}`);
    } finally {
        await appConfig.disconnectDatabase();
    }
}

runSeed().catch((error) => {
    console.error('Analytics seed failed:', error);
    process.exit(1);
});
