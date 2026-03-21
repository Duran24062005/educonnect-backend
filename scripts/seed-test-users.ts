import appConfig from '../src/config/config.js';
import User from '../src/models/UserModel.js';
import Person from '../src/models/PersonModel.js';
import Teacher from '../src/models/TeacherModel.js';
import Student from '../src/models/StudentModel.js';

const TEST_PASSWORD = 'Test12345*';

type SeedUser = {
    email: string;
    role: 'Admin' | 'Teacher' | 'Student';
    first_name: string;
    last_name: string;
    phone: string;
    document_type: 'CC' | 'RC' | 'CE';
    document_number: string;
    born_date: string;
    area?: string;
};

const STAFF_USERS: SeedUser[] = [
    {
        email: 'admin1@educonnect.test',
        role: 'Admin',
        first_name: 'Carla',
        last_name: 'Mendoza',
        phone: '3001110001',
        document_type: 'CC',
        document_number: 'ADM-1001',
        born_date: '1988-04-12',
    },
    {
        email: 'admin2@educonnect.test',
        role: 'Admin',
        first_name: 'Jorge',
        last_name: 'Ramirez',
        phone: '3001110002',
        document_type: 'CC',
        document_number: 'ADM-1002',
        born_date: '1985-10-01',
    },
    {
        email: 'admin3@educonnect.test',
        role: 'Admin',
        first_name: 'Luisa',
        last_name: 'Torres',
        phone: '3001110003',
        document_type: 'CC',
        document_number: 'ADM-1003',
        born_date: '1990-02-27',
    },
    {
        email: 'teacher1@educonnect.test',
        role: 'Teacher',
        first_name: 'Daniel',
        last_name: 'Vargas',
        phone: '3002220001',
        document_type: 'CC',
        document_number: 'DOC-2001',
        born_date: '1991-06-09',
        area: 'Matemáticas',
    },
    {
        email: 'teacher2@educonnect.test',
        role: 'Teacher',
        first_name: 'Paula',
        last_name: 'Ortega',
        phone: '3002220002',
        document_type: 'CC',
        document_number: 'DOC-2002',
        born_date: '1989-12-14',
        area: 'Lenguaje',
    },
    {
        email: 'teacher3@educonnect.test',
        role: 'Teacher',
        first_name: 'Mauricio',
        last_name: 'Santos',
        phone: '3002220003',
        document_type: 'CC',
        document_number: 'DOC-2003',
        born_date: '1993-03-18',
        area: 'Ciencias',
    },
    {
        email: 'teacher4@educonnect.test',
        role: 'Teacher',
        first_name: 'Natalia',
        last_name: 'Pineda',
        phone: '3002220004',
        document_type: 'CC',
        document_number: 'DOC-2004',
        born_date: '1992-11-07',
        area: 'Inglés',
    },
    {
        email: 'teacher5@educonnect.test',
        role: 'Teacher',
        first_name: 'Andres',
        last_name: 'Quintero',
        phone: '3002220005',
        document_type: 'CC',
        document_number: 'DOC-2005',
        born_date: '1987-09-21',
        area: 'Tecnología',
    },
];


const STUDENT_USERS: SeedUser[] = [
    {
        email: 'student1@educonnect.test',
        role: 'Student',
        first_name: 'Juan',
        last_name: 'Pérez',
        phone: '3001000001',
        document_type: 'CC',
        document_number: 'DOC-3001',
        born_date: '2008-03-15'
    },
    {
        email: 'student2@educonnect.test',
        role: 'Student',
        first_name: 'Laura',
        last_name: 'Gómez',
        phone: '3001000002',
        document_type: 'CC',
        document_number: 'DOC-3002',
        born_date: '2009-07-22'
    },
    {
        email: 'student3@educonnect.test',
        role: 'Student',
        first_name: 'Carlos',
        last_name: 'Ramírez',
        phone: '3001000003',
        document_type: 'CC',
        document_number: 'DOC-3003',
        born_date: '2007-11-02'
    },
    {
        email: 'student4@educonnect.test',
        role: 'Student',
        first_name: 'Valentina',
        last_name: 'Torres',
        phone: '3001000004',
        document_type: 'CC',
        document_number: 'DOC-3004',
        born_date: '2008-01-18'
    },
    {
        email: 'student5@educonnect.test',
        role: 'Student',
        first_name: 'Mateo',
        last_name: 'Castro',
        phone: '3001000005',
        document_type: 'CC',
        document_number: 'DOC-3005',
        born_date: '2009-05-09'
    },
    {
        email: 'student6@educonnect.test',
        role: 'Student',
        first_name: 'Sofía',
        last_name: 'Martínez',
        phone: '3001000006',
        document_type: 'CC',
        document_number: 'DOC-3006',
        born_date: '2008-08-30'
    },
    {
        email: 'student7@educonnect.test',
        role: 'Student',
        first_name: 'Daniel',
        last_name: 'Herrera',
        phone: '3001000007',
        document_type: 'CC',
        document_number: 'DOC-3007',
        born_date: '2007-12-12'
    },
    {
        email: 'student8@educonnect.test',
        role: 'Student',
        first_name: 'Camila',
        last_name: 'Rojas',
        phone: '3001000008',
        document_type: 'CC',
        document_number: 'DOC-3008',
        born_date: '2009-02-27'
    },
    {
        email: 'student9@educonnect.test',
        role: 'Student',
        first_name: 'Sebastián',
        last_name: 'Vargas',
        phone: '3001000009',
        document_type: 'CC',
        document_number: 'DOC-3009',
        born_date: '2008-06-14'
    },
    {
        email: 'student10@educonnect.test',
        role: 'Student',
        first_name: 'Isabella',
        last_name: 'Morales',
        phone: '3001000010',
        document_type: 'CC',
        document_number: 'DOC-3010',
        born_date: '2007-09-03'
    },
    {
        email: 'student11@educonnect.test',
        role: 'Student',
        first_name: 'Samuel',
        last_name: 'Ortega',
        phone: '3001000011',
        document_type: 'CC',
        document_number: 'DOC-3011',
        born_date: '2008-10-21'
    },
    {
        email: 'student12@educonnect.test',
        role: 'Student',
        first_name: 'Mariana',
        last_name: 'López',
        phone: '3001000012',
        document_type: 'CC',
        document_number: 'DOC-3012',
        born_date: '2009-04-11'
    },
    {
        email: 'student13@educonnect.test',
        role: 'Student',
        first_name: 'Nicolás',
        last_name: 'Jiménez',
        phone: '3001000013',
        document_type: 'CC',
        document_number: 'DOC-3013',
        born_date: '2008-12-01'
    },
    {
        email: 'student14@educonnect.test',
        role: 'Student',
        first_name: 'Gabriela',
        last_name: 'Ruiz',
        phone: '3001000014',
        document_type: 'CC',
        document_number: 'DOC-3014',
        born_date: '2007-03-25'
    },
    {
        email: 'student15@educonnect.test',
        role: 'Student',
        first_name: 'Andrés',
        last_name: 'Mendoza',
        phone: '3001000015',
        document_type: 'CC',
        document_number: 'DOC-3015',
        born_date: '2009-06-07'
    },
    {
        email: 'student16@educonnect.test',
        role: 'Student',
        first_name: 'Valeria',
        last_name: 'Silva',
        phone: '3001000016',
        document_type: 'CC',
        document_number: 'DOC-3016',
        born_date: '2008-01-29'
    },
    {
        email: 'student17@educonnect.test',
        role: 'Student',
        first_name: 'David',
        last_name: 'Navarro',
        phone: '3001000017',
        document_type: 'CC',
        document_number: 'DOC-3017',
        born_date: '2007-08-19'
    },
    {
        email: 'student18@educonnect.test',
        role: 'Student',
        first_name: 'Paula',
        last_name: 'Cárdenas',
        phone: '3001000018',
        document_type: 'CC',
        document_number: 'DOC-3018',
        born_date: '2009-09-10'
    },
    {
        email: 'student19@educonnect.test',
        role: 'Student',
        first_name: 'Miguel',
        last_name: 'Pardo',
        phone: '3001000019',
        document_type: 'CC',
        document_number: 'DOC-3019',
        born_date: '2008-05-17'
    },
    {
        email: 'student20@educonnect.test',
        role: 'Student',
        first_name: 'Juliana',
        last_name: 'Acosta',
        phone: '3001000020',
        document_type: 'CC',
        document_number: 'DOC-3020',
        born_date: '2007-11-28'
    }
];

const USERS_TO_SEED: SeedUser[] = [...STAFF_USERS, ...STUDENT_USERS];

async function seedOne(personData: SeedUser) {
    let user = await User.findOne({ email: personData.email });

    if (!user) {
        user = await User.create({
            email: personData.email,
            hash_password: TEST_PASSWORD,
        });
        console.log(`+ User creado: ${personData.email}`);
    }

    let person = await Person.findOne({ user_id: user._id });

    if (!person) {
        person = await Person.create({
            user_id: user._id,
            first_name: personData.first_name,
            last_name: personData.last_name,
            phone: personData.phone,
            role: personData.role,
            status: 'active',
            born_date: personData.born_date ? new Date(personData.born_date) : null,
            document_type: personData.document_type,
            document_number: personData.document_number,
        });
        console.log(`+ Person creada: ${personData.email} (${personData.role})`);
    } else {
        person.first_name = personData.first_name;
        person.last_name = personData.last_name;
        person.phone = personData.phone;
        person.role = personData.role;
        person.status = 'active';
        person.born_date = personData.born_date ? new Date(personData.born_date) : null;
        person.document_type = personData.document_type;
        person.document_number = personData.document_number;
        await person.save();
        console.log(`~ Person actualizada: ${personData.email}`);
    }

    if (!user.person_id || String(user.person_id) !== String(person._id)) {
        user.person_id = person._id;
        await user.save();
    }

    if (personData.role === 'Teacher') {
        const teacherProfile = await Teacher.findOne({ user_id: user._id });
        if (!teacherProfile) {
            await Teacher.create({ user_id: user._id, area: personData.area || null });
            console.log(`+ Perfil Teacher creado: ${personData.email}`);
        } else {
            teacherProfile.area = personData.area || teacherProfile.area;
            await teacherProfile.save();
            console.log(`~ Perfil Teacher actualizado: ${personData.email}`);
        }
    }

    if (personData.role === 'Student') {
        const studentProfile = await Student.findOne({ user_id: user._id });
        if (!studentProfile) {
            await Student.create({ user_id: user._id });
            console.log(`+ Perfil Student creado: ${personData.email}`);
        }
    }
}

async function run() {
    await appConfig.connectDatabase();

    try {
        for (const row of USERS_TO_SEED) {
            await seedOne(row);
        }

        console.log('\n=== Seed finalizado ===');
        console.log(`Usuarios cargados: ${USERS_TO_SEED.length}`);
        console.log(`Password para todos: ${TEST_PASSWORD}`);
    } finally {
        await appConfig.disconnectDatabase();
    }
}

run().catch((err) => {
    console.error('Error ejecutando seed de usuarios de prueba:', err);
    process.exit(1);
});
