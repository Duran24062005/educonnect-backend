// @ts-nocheck
import AttendanceSession from '../models/AttendanceSessionModel.js';
import AttendanceRecord from '../models/AttendanceRecordModel.js';

const sessionPopulate = [
    { path: 'school_year_id' },
    { path: 'period_id' },
    { path: 'group_id', populate: { path: 'grade_id' } },
    { path: 'area_id' },
    {
        path: 'teacher_id',
        populate: { path: 'user_id', populate: { path: 'person_id' } },
    },
];

const recordPopulate = {
    path: 'student_id',
    populate: {
        path: 'user_id',
        populate: { path: 'person_id' },
    },
};

class AttendanceRepository {
    async createSession(data) {
        return await new AttendanceSession(data).save();
    }

    async findSessionById(id) {
        return await AttendanceSession.findById(id).populate(sessionPopulate);
    }

    async findSessions(filter) {
        return await AttendanceSession.find(filter)
            .populate(sessionPopulate)
            .sort({ date: -1, created_at: -1 });
    }

    async updateSession(id, data) {
        return await AttendanceSession.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        }).populate(sessionPopulate);
    }

    async createRecords(records) {
        return await Promise.all(records.map((record) => new AttendanceRecord(record).save()));
    }

    async findRecordsBySession(sessionId) {
        return await AttendanceRecord.find({ session_id: sessionId })
            .populate(recordPopulate)
            .sort({ created_at: 1 });
    }

    async upsertRecord(sessionId, studentId, data) {
        return await AttendanceRecord.findOneAndUpdate(
            { session_id: sessionId, student_id: studentId },
            { $set: data },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        ).populate(recordPopulate);
    }

    async findRecordsByStudentAndYear(studentId, schoolYearId) {
        const sessions = await AttendanceSession.find({ school_year_id: schoolYearId }).select('_id');
        return await AttendanceRecord.find({
            student_id: studentId,
            session_id: { $in: sessions.map((session) => session._id) },
        })
            .populate({ path: 'session_id', populate: sessionPopulate })
            .sort({ 'session_id.date': -1, created_at: -1 });
    }
}

export default new AttendanceRepository();
