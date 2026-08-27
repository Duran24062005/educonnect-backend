// @ts-nocheck
import mongoose from 'mongoose';
import appConfig from '../src/config/config.js';
import Institution from '../src/models/InstitutionModel.js';
import SchoolYear from '../src/models/SchoolYearModel.js';
import Group from '../src/models/GroupModel.js';
import WeeklySchedule from '../src/models/WeeklyScheduleModel.js';

const institutionId = process.env.SCHEDULE_MIGRATION_INSTITUTION_ID;
const confirmation = process.env.SCHEDULE_MIGRATION_CONFIRM;

if (!institutionId || !mongoose.isValidObjectId(institutionId)) {
    throw new Error('SCHEDULE_MIGRATION_INSTITUTION_ID debe ser un ObjectId válido');
}
if (confirmation !== 'EDUCONNECT-SCHEDULE') {
    throw new Error('La migración requiere SCHEDULE_MIGRATION_CONFIRM=EDUCONNECT-SCHEDULE');
}

const run = async () => {
    await appConfig.connectDatabase();
    const tenantId = new mongoose.Types.ObjectId(institutionId);
    const institution = await Institution.findById(tenantId).select('_id school_days created_by_user_id status');
    if (!institution) throw new Error(`Institución no encontrada: ${institutionId}`);
    if (institution.status === 'archived') throw new Error('No se puede migrar una institución archivada');

    const years = await SchoolYear.find({ institution_id: tenantId }).sort({ year: 1 });
    for (const year of years) {
        const existingDraft = await WeeklySchedule.findOne({ institution_id: tenantId, school_year_id: year._id, status: 'draft' });
        if (existingDraft) {
            console.log(`${year.year}: borrador existente, no se modifica`);
            continue;
        }

        const published = await WeeklySchedule.findOne({ institution_id: tenantId, school_year_id: year._id, status: 'published' });
        if (published?.availability_windows?.length) {
            console.log(`${year.year}: ya tiene disponibilidad publicada, no se modifica`);
            continue;
        }

        const groups = await Group.find({ institution_id: tenantId, school_year_id: year._id }).populate('shift_id');
        const availability_windows = groups
            .filter((group) => group.shift_id?.status === 'active')
            .map((group) => ({
                window_id: new mongoose.Types.ObjectId().toString(),
                group_id: group._id,
                start_time: group.shift_id.start_time,
                end_time: group.shift_id.end_time,
            }));
        const version = (await WeeklySchedule.countDocuments({ institution_id: tenantId, school_year_id: year._id })) + 1;
        await WeeklySchedule.create({
            institution_id: tenantId,
            school_year_id: year._id,
            version,
            status: 'draft',
            school_days: institution.school_days || [1, 2, 3, 4, 5],
            availability_windows,
            slots: [],
            created_by: institution.created_by_user_id,
            updated_by: institution.created_by_user_id,
        });
        console.log(`${year.year}: borrador creado con ${availability_windows.length} ventanas; requiere revisión y publicación administrativa`);
    }
};

run()
    .catch((error) => {
        console.error('Migración de disponibilidad fallida:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await appConfig.disconnectDatabase();
    });
