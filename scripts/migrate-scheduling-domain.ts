// @ts-nocheck
import mongoose from 'mongoose';
import appConfig from '../src/config/config.js';
import Institution from '../src/models/InstitutionModel.js';
import SchoolYear from '../src/models/SchoolYearModel.js';
import Group from '../src/models/GroupModel.js';
import GroupTeacher from '../src/models/GroupTeacherModel.js';
import WeeklySchedule from '../src/models/WeeklyScheduleModel.js';
import ScheduleEntry from '../src/models/ScheduleEntryModel.js';
import ClassSession from '../src/models/ClassSessionModel.js';
import ScheduleException from '../src/models/ScheduleExceptionModel.js';

const institutionId = process.env.SCHEDULING_MIGRATION_INSTITUTION_ID;
const apply = process.env.SCHEDULING_MIGRATION_APPLY === 'true';
if (apply && process.env.SCHEDULING_MIGRATION_CONFIRM !== 'EDUCONNECT-SCHEDULING') throw new Error('La migración requiere SCHEDULING_MIGRATION_CONFIRM=EDUCONNECT-SCHEDULING');
if (institutionId && !mongoose.isValidObjectId(institutionId)) throw new Error('SCHEDULING_MIGRATION_INSTITUTION_ID debe ser un ObjectId válido');

const id = (value) => value?._id?.toString?.() || value?.toString?.() || null;
const run = async () => {
    await appConfig.connectDatabase();
    const institutionFilter = institutionId ? { institution_id: institutionId } : {};
    const institutions = await Institution.find(institutionFilter).select('_id');
    const report = { dry_run: !apply, institutions: 0, assignments_backfilled: 0, entries_created: 0, sessions_linked: 0, exceptions_created: 0, unresolved: [] };

    for (const institution of institutions) {
        report.institutions += 1;
        const years = await SchoolYear.find({ institution_id: institution._id });
        for (const year of years) {
            const groups = await Group.find({ institution_id: institution._id, school_year_id: year._id });
            const groupById = new Map(groups.map((group) => [id(group._id), group]));
            const assignments = await GroupTeacher.find({ institution_id: institution._id });
            for (const assignment of assignments) {
                const group = groupById.get(id(assignment.group_id)) || await Group.findOne({ _id: assignment.group_id, institution_id: institution._id });
                if (!group) continue;
                if (!assignment.school_year_id || id(assignment.school_year_id) !== id(group.school_year_id) || !assignment.status) {
                    report.assignments_backfilled += 1;
                    if (apply) {
                        assignment.school_year_id = group.school_year_id;
                        assignment.status = assignment.status || 'active';
                        await assignment.save();
                    }
                }
            }

            const schedules = await WeeklySchedule.find({ institution_id: institution._id, school_year_id: year._id });
            for (const schedule of schedules) {
                for (const slot of schedule.slots || []) {
                    const assignment = await GroupTeacher.findOne({ institution_id: institution._id, group_id: slot.group_id, area_id: slot.area_id, teacher_id: slot.teacher_id });
                    if (!assignment) { report.unresolved.push({ schedule_id: id(schedule), slot_id: slot.slot_id, reason: 'No existe TeachingAssignment para el slot' }); continue; }
                    let entry = await ScheduleEntry.findOne({ schedule_id: schedule._id, legacy_slot_id: slot.slot_id });
                    if (!entry) {
                        report.entries_created += 1;
                        if (apply) {
                            entry = await ScheduleEntry.create({ institution_id: institution._id, schedule_id: schedule._id, teaching_assignment_id: assignment._id, school_year_id: year._id, group_id: slot.group_id, area_id: slot.area_id, teacher_id: slot.teacher_id, aula_id: slot.aula_id, entry_key: slot.slot_id, legacy_slot_id: slot.slot_id, weekday: slot.weekday, start_time: slot.start_time, end_time: slot.end_time });
                        }
                    }
                    if (entry) {
                        const sessions = await ClassSession.find({ institution_id: institution._id, schedule_id: schedule._id, schedule_slot_id: slot.slot_id, schedule_entry_id: null });
                        report.sessions_linked += sessions.length;
                        if (apply) {
                            for (const session of sessions) {
                                session.schedule_entry_id = entry._id;
                                session.occurrence_date = session.occurrence_date || new Date(new Date(session.start_at).toISOString().slice(0, 10));
                                await session.save();
                            }
                        }
                    }
                }
            }

            const exceptionSessions = await ClassSession.find({ institution_id: institution._id, school_year_id: year._id, source: 'exception' });
            for (const session of exceptionSessions) {
                const occurrenceDate = session.occurrence_date || new Date(new Date(session.start_at).toISOString().slice(0, 10));
                const exists = await ScheduleException.exists({ institution_id: institution._id, school_year_id: year._id, occurrence_date: occurrenceDate, type: 'additional' });
                if (!exists) {
                    report.exceptions_created += 1;
                    if (apply) await ScheduleException.create({ institution_id: institution._id, school_year_id: year._id, occurrence_date: occurrenceDate, type: 'additional', start_at: session.start_at, end_at: session.end_at, aula_id: session.aula_id, group_id: session.group_id, area_id: session.area_id, teacher_id: session.teacher_id, reason: session.exception_reason || 'Migración de excepción legacy', created_by: session.created_by, updated_by: session.updated_by });
                }
            }
        }
    }
    console.log(JSON.stringify(report, null, 2));
};

run().catch((error) => { console.error('Migración del dominio de horarios fallida:', error); process.exitCode = 1; }).finally(async () => { await appConfig.disconnectDatabase(); });
