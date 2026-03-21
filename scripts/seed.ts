import appConfig from '../src/config/config.js';
import User from '../src/models/UserModel.js';
import Person from '../src/models/PersonModel.js';
import Student from '../src/models/StudentModel.js';
import Teacher from '../src/models/TeacherModel.js';
import Area from '../src/models/AreaModel.js';

const DEFAULT_PASSWORD = 'EduConnect123!';

type SeedProfileInput = {
    email: string;
    first_name: string;
    last_name: string;
    role: 'Teacher' | 'Student';
    document_number: string;
};

const teachers = [
    { email: 'teacher.math@educonnect.local', first_name: 'Laura', last_name: 'Ruiz', area: 'Mathematics', document_number: 'T-1001' },
    { email: 'teacher.lang@educonnect.local', first_name: 'Carlos', last_name: 'Gomez', area: 'Language', document_number: 'T-1002' },
    { email: 'teacher.science@educonnect.local', first_name: 'Andrea', last_name: 'Mora', area: 'Science', document_number: 'T-1003' },
];

const students = [
    { email: 'student.ana@educonnect.local', first_name: 'Ana', last_name: 'Lopez', document_number: 'S-2001' },
    { email: 'student.diego@educonnect.local', first_name: 'Diego', last_name: 'Pena', document_number: 'S-2002' },
    { email: 'student.maria@educonnect.local', first_name: 'Maria', last_name: 'Diaz', document_number: 'S-2003' },
    { email: 'student.juan@educonnect.local', first_name: 'Juan', last_name: 'Rojas', document_number: 'S-2004' },
];

const subjects = [
    { name: 'Mathematics', description: 'Core math curriculum' },
    { name: 'Language', description: 'Reading and writing skills' },
    { name: 'Science', description: 'Natural sciences' },
    { name: 'Social Studies', description: 'History and citizenship' },
];

async function ensureUserWithProfile({ email, first_name, last_name, role, document_number }: SeedProfileInput) {
    let user = await User.findOne({ email });

    if (!user) {
        user = await User.create({
            email,
            hash_password: DEFAULT_PASSWORD,
        });
    }

    let person = await Person.findOne({ user_id: user._id });
    if (!person) {
        person = await Person.create({
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
        await person.save();
    }

    if (!user.person_id || String(user.person_id) !== String(person._id)) {
        user.person_id = person._id;
        await user.save();
    }

    return { user, person };
}

async function runSeed() {
    await appConfig.connectDatabase();

    try {
        for (const subject of subjects) {
            await Area.updateOne({ name: subject.name }, subject, { upsert: true });
        }

        for (const teacher of teachers) {
            const { user } = await ensureUserWithProfile({ ...teacher, role: 'Teacher' });
            await Teacher.updateOne(
                { user_id: user._id },
                { user_id: user._id, area: teacher.area },
                { upsert: true }
            );
        }

        for (const student of students) {
            const { user } = await ensureUserWithProfile({ ...student, role: 'Student' });
            await Student.updateOne(
                { user_id: user._id },
                { user_id: user._id },
                { upsert: true }
            );
        }

        console.log('Seed completed');
        console.log(`Teachers: ${teachers.length}, Students: ${students.length}, Subjects: ${subjects.length}`);
        console.log(`Default password: ${DEFAULT_PASSWORD}`);
    } finally {
        await appConfig.disconnectDatabase();
    }
}

runSeed().catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
});
