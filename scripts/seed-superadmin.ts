import appConfig from '../src/config/config.js';
import User from '../src/models/UserModel.js';
import Person from '../src/models/PersonModel.js';

const required = (name: string) => {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`${name} es requerido`);
    return value;
};

const run = async () => {
    const email = required('SUPERADMIN_EMAIL').toLowerCase();
    const password = required('SUPERADMIN_PASSWORD');
    const firstName = required('SUPERADMIN_FIRST_NAME');
    const lastName = required('SUPERADMIN_LAST_NAME');
    const documentType = (process.env.SUPERADMIN_DOCUMENT_TYPE || 'CC') as 'CC' | 'RC' | 'CE';
    const documentNumber = required('SUPERADMIN_DOCUMENT_NUMBER');

    if (password.length < 12) throw new Error('SUPERADMIN_PASSWORD debe tener al menos 12 caracteres');
    if (!['CC', 'RC', 'CE'].includes(documentType)) throw new Error('SUPERADMIN_DOCUMENT_TYPE debe ser CC, RC o CE');

    await appConfig.connectDatabase();
    const existing = await User.findOne({ email }).setOptions({ skipTenant: true });

    if (existing) {
        const person = await Person.findOne({ user_id: existing._id }).setOptions({ skipTenant: true });
        if (!person || person.role !== 'SuperAdmin') {
            throw new Error('SUPERADMIN_EMAIL ya pertenece a una cuenta que no es SuperAdmin');
        }
        if (existing.institution_id) throw new Error('Un SuperAdmin no puede pertenecer a una institución');
        if (person.status !== 'active') {
            person.status = 'active';
            await person.save();
        }
        if (String(existing.person_id || '') !== String(person._id)) {
            existing.person_id = person._id;
            await existing.save();
        }
        console.log(`SuperAdmin ya existente: ${email}`);
        return;
    }

    const user = await User.create({ email, hash_password: password, institution_id: null });
    const person = await Person.create({
        user_id: user._id,
        first_name: firstName,
        last_name: lastName,
        document_type: documentType,
        document_number: documentNumber,
        phone: process.env.SUPERADMIN_PHONE?.trim() || null,
        role: 'SuperAdmin',
        status: 'active',
        institution_id: null,
    });
    user.person_id = person._id;
    await user.save();

    console.log(`SuperAdmin creado: ${email}`);
};

run()
    .catch((error) => {
        console.error('Bootstrap de SuperAdmin fallido:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await appConfig.disconnectDatabase();
    });
