// @ts-nocheck
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let app;
let appConfig;
let SessionService;
let mongoServer;
let User;
let Person;
let SchoolYear;
let Period;
let Grade;
let Area;
let GradeArea;
let Group;
let GroupTeacher;
let Teacher;
let Student;
let Enrollment;
let Aula;
let Activity;
let SchoolShift;
let WeeklySchedule;

const actor = async (role, index) => {
    const user = await User.create({
        email: `calendar.${role.toLowerCase()}.${index}@educonnect.local`,
        hash_password: 'Calendar123!',
    });
    const person = await Person.create({
        user_id: user._id,
        first_name: `${role}${index}`,
        last_name: 'Calendar',
        role,
        status: 'active',
        born_date: '1990-01-01',
        document_type: 'CC',
        document_number: `CAL-${role}-${index}`,
    });
    await User.findByIdAndUpdate(user._id, { person_id: person._id });
    const session = await SessionService.create({ userId: user._id, role: role.toLowerCase() });
    return { user, person, token: session.token };
};

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'calendar-test-secret';
    process.env.JWT_EXPIRE = '1d';

    mongoServer = await MongoMemoryServer.create();
    process.env.DATABASE_URL = mongoServer.getUri('educonnect_calendar_test');

    ({ default: app } = await import('../src/app.js'));
    ({ default: appConfig } = await import('../src/config/config.js'));
    ({ default: SessionService } = await import('../src/modules/auth/SessionService.js'));
    ({ default: User } = await import('../src/models/UserModel.js'));
    ({ default: Person } = await import('../src/models/PersonModel.js'));
    ({ default: SchoolYear } = await import('../src/models/SchoolYearModel.js'));
    ({ default: Period } = await import('../src/models/PeriodModel.js'));
    ({ default: Grade } = await import('../src/models/GradeModel.js'));
    ({ default: Area } = await import('../src/models/AreaModel.js'));
    ({ default: GradeArea } = await import('../src/models/GradeAreaModel.js'));
    ({ default: Group } = await import('../src/models/GroupModel.js'));
    ({ default: GroupTeacher } = await import('../src/models/GroupTeacherModel.js'));
    ({ default: Teacher } = await import('../src/models/TeacherModel.js'));
    ({ default: Student } = await import('../src/models/StudentModel.js'));
    ({ default: Enrollment } = await import('../src/models/EnrollmentModel.js'));
    ({ default: Aula } = await import('../src/models/AulaModel.js'));
    ({ default: Activity } = await import('../src/models/ActivityModel.js'));
    ({ default: SchoolShift } = await import('../src/models/SchoolShiftModel.js'));
    ({ default: WeeklySchedule } = await import('../src/models/WeeklyScheduleModel.js'));

    await appConfig.connectDatabase();
});

afterAll(async () => {
    await appConfig.disconnectDatabase();
    await mongoServer.stop();
    await mongoose.connection.close();
});

describe('Calendar API', () => {
    let admin;
    let teacher;
    let outsiderTeacher;
    let student;
    let schoolYear;
    let group;
    let area;
    let teacherProfile;
    let aula;
    let sessionInput;
    let range;

    beforeAll(async () => {
        [admin, teacher, outsiderTeacher, student] = await Promise.all([
            actor('Admin', 1),
            actor('Teacher', 1),
            actor('Teacher', 2),
            actor('Student', 1),
        ]);

        schoolYear = await SchoolYear.create({
            year: 2026,
            start_date: '2026-01-01',
            end_date: '2026-12-31',
            is_active: true,
        });
        const grade = await Grade.create({ name: '7°', level: '7' });
        area = await Area.create({ name: 'Matemáticas' });
        aula = await Aula.create({ name: 'Aula 201', max_capacity: 40 });
        await GradeArea.create({ grade_id: grade._id, area_id: area._id, weekly_hours: 4 });
        group = await Group.create({
            name: '7A',
            grade_id: grade._id,
            school_year_id: schoolYear._id,
            max_capacity: 40,
        });
        const shift = await SchoolShift.create({
            name: 'Jornada mañana',
            code: 'MANANA',
            start_time: '06:15',
            end_time: '12:15',
            created_by_user_id: admin.user._id,
        });
        group.shift_id = shift._id;
        await group.save();
        await WeeklySchedule.create({
            school_year_id: schoolYear._id,
            version: 1,
            status: 'published',
            school_days: [1, 2, 3, 4, 5],
            availability_windows: [{ window_id: 'window-7a', group_id: group._id, start_time: '06:15', end_time: '12:15' }],
            created_by: admin.user._id,
            updated_by: admin.user._id,
            published_by: admin.user._id,
            published_at: new Date(),
        });
        teacherProfile = await Teacher.create({ user_id: teacher.user._id, area: 'Matemáticas' });
        const outsiderProfile = await Teacher.create({ user_id: outsiderTeacher.user._id, area: 'Lenguaje' });
        await GroupTeacher.create({ teacher_id: teacherProfile._id, group_id: group._id, area_id: area._id });

        const studentProfile = await Student.create({ user_id: student.user._id, group_id: group._id });
        await Enrollment.create({
            student_id: studentProfile._id,
            school_year_id: schoolYear._id,
            group_id: group._id,
            status: 'active',
        });

        const period = await Period.create({
            school_year_id: schoolYear._id,
            name: 'Periodo 1',
            weight: 1,
            start_date: '2026-01-01',
            end_date: '2026-04-30',
        });
        await Activity.create({
            title: 'Taller de ecuaciones',
            description: 'Actividad calendarizada',
            context: 'Resolver ecuaciones lineales',
            group_id: group._id,
            area_id: area._id,
            period_id: period._id,
            school_year_id: schoolYear._id,
            teacher_id: teacherProfile._id,
            open_at: new Date(Date.now() - 60 * 60 * 1000),
            due_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            allowed_extensions: ['link'],
            rubric_criteria: [{ title: 'Procedimiento', max_points: 10 }],
            status: 'published',
        });

        const startAt = new Date('2026-08-31T12:00:00.000Z');
        const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
        sessionInput = {
            school_year_id: schoolYear._id.toString(),
            group_id: group._id.toString(),
            area_id: area._id.toString(),
            teacher_id: teacherProfile._id.toString(),
            aula_id: aula._id.toString(),
            start_at: startAt.toISOString(),
            end_at: endAt.toISOString(),
            topic: 'Ecuaciones lineales',
        };
        range = {
            from: startAt.toISOString().slice(0, 10),
            to: new Date(startAt.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        };

        expect(outsiderProfile).toBeTruthy();
    });

    test('returns a real catalog and creates a session with an audit-ready response', async () => {
        const catalogResponse = await request(app)
            .get(`/api/calendar/catalog?school_year_id=${schoolYear._id}`)
            .set('Authorization', `Bearer ${admin.token}`);

        expect(catalogResponse.statusCode).toBe(200);
        expect(catalogResponse.body.data.groups[0]._id.toString()).toBe(group._id.toString());
        expect(catalogResponse.body.data.areas[0]._id.toString()).toBe(area._id.toString());

        const response = await request(app)
            .post('/api/calendar/sessions')
            .set('Authorization', `Bearer ${admin.token}`)
            .send(sessionInput);

        expect(response.statusCode).toBe(201);
        expect(response.body.data.topic).toBe('Ecuaciones lineales');
        expect(response.body.data.group._id.toString()).toBe(group._id.toString());
        expect(response.body.data.status).toBe('scheduled');
    });

    test('limits /me by enrollment or assignment and includes pending activities', async () => {
        const studentResponse = await request(app)
            .get('/api/calendar/me')
            .query({ ...range, school_year_id: schoolYear._id.toString() })
            .set('Authorization', `Bearer ${student.token}`);
        const teacherResponse = await request(app)
            .get('/api/calendar/me')
            .query({ ...range, school_year_id: schoolYear._id.toString() })
            .set('Authorization', `Bearer ${teacher.token}`);

        expect(studentResponse.statusCode).toBe(200);
        expect(studentResponse.body.data.sessions).toHaveLength(1);
        expect(studentResponse.body.data.sessions[0].pending_activities[0].status).toBe('pending');
        expect(teacherResponse.statusCode).toBe(200);
        expect(teacherResponse.body.data.sessions).toHaveLength(1);
        expect(teacherResponse.body.data.sessions[0].teacher._id.toString()).toBe(teacherProfile._id.toString());
    });

    test('enforces teacher ownership, detects conflicts and reactivates cancelled sessions', async () => {
        const forbidden = await request(app)
            .post('/api/calendar/sessions')
            .set('Authorization', `Bearer ${outsiderTeacher.token}`)
            .send(sessionInput);
        expect(forbidden.statusCode).toBe(403);

        const conflict = await request(app)
            .post('/api/calendar/sessions')
            .set('Authorization', `Bearer ${admin.token}`)
            .send({ ...sessionInput, topic: 'Conflicto de horario' });
        expect(conflict.statusCode).toBe(409);

        const sessionId = (await request(app)
            .get('/api/calendar')
            .query({ ...range, school_year_id: schoolYear._id.toString() })
            .set('Authorization', `Bearer ${admin.token}`)).body.data.sessions[0]._id;

        const cancelled = await request(app)
            .patch(`/api/calendar/sessions/${sessionId}`)
            .set('Authorization', `Bearer ${admin.token}`)
            .send({ status: 'cancelled' });
        expect(cancelled.statusCode).toBe(200);
        expect(cancelled.body.data.status).toBe('cancelled');

        const activated = await request(app)
            .patch(`/api/calendar/sessions/${sessionId}`)
            .set('Authorization', `Bearer ${admin.token}`)
            .send({ status: 'scheduled' });
        expect(activated.statusCode).toBe(200);
        expect(activated.body.data.status).toBe('scheduled');
        expect(activated.body.data.topic).toBe('Ecuaciones lineales');
    });

    test('enforces published availability for teachers and isolates their calendar', async () => {
        const teacherAvailability = await request(app)
            .get('/api/calendar/schedules/me')
            .query({ school_year_id: schoolYear._id.toString() })
            .set('Authorization', `Bearer ${teacher.token}`);
        expect(teacherAvailability.statusCode).toBe(200);
        expect(teacherAvailability.body.data.schedules).toHaveLength(1);
        expect(teacherAvailability.body.data.schedules[0].availability_windows[0].group._id.toString()).toBe(group._id.toString());

        const adminAvailability = await request(app)
            .get('/api/calendar/schedules/me')
            .query({ school_year_id: schoolYear._id.toString() })
            .set('Authorization', `Bearer ${admin.token}`);
        expect(adminAvailability.statusCode).toBe(403);

        const teacherSession = await request(app)
            .post('/api/calendar/sessions')
            .set('Authorization', `Bearer ${teacher.token}`)
            .send({
                ...sessionInput,
                start_at: '2026-08-31T13:00:00.000Z',
                end_at: '2026-08-31T14:00:00.000Z',
                topic: 'Clase registrada por docente',
            });
        expect(teacherSession.statusCode).toBe(403);
        expect(teacherSession.body.message).toContain('generadas por el horario institucional');

        const outsideWindow = await request(app)
            .post('/api/calendar/sessions')
            .set('Authorization', `Bearer ${teacher.token}`)
            .send({
                ...sessionInput,
                start_at: '2026-08-31T17:00:00.000Z',
                end_at: '2026-08-31T18:00:00.000Z',
                topic: 'Fuera de jornada',
            });
        expect(outsideWindow.statusCode).toBe(403);

        const outsideByAdmin = await request(app)
            .post('/api/calendar/sessions')
            .set('Authorization', `Bearer ${admin.token}`)
            .send({
                ...sessionInput,
                start_at: '2026-08-31T17:00:00.000Z',
                end_at: '2026-08-31T18:00:00.000Z',
                topic: 'Sesión administrativa fuera de jornada',
            });
        expect(outsideByAdmin.statusCode).toBe(409);

        const exception = await request(app)
            .post('/api/calendar/exceptions')
            .set('Authorization', `Bearer ${admin.token}`)
            .send({
                ...sessionInput,
                start_at: '2026-08-31T17:00:00.000Z',
                end_at: '2026-08-31T18:00:00.000Z',
                topic: 'Reunión extraordinaria',
                reason: 'Actividad institucional autorizada',
            });
        expect(exception.statusCode).toBe(201);
        expect(exception.body.data.source).toBe('exception');
        expect(exception.body.data.exception_reason).toBe('Actividad institucional autorizada');

        const teacherCalendar = await request(app)
            .get('/api/calendar/me')
            .query({ ...range, school_year_id: schoolYear._id.toString() })
            .set('Authorization', `Bearer ${teacher.token}`);
        expect(teacherCalendar.statusCode).toBe(200);
        expect(teacherCalendar.body.data.sessions).toHaveLength(2);
        expect(teacherCalendar.body.data.sessions.every((item) => item.teacher._id.toString() === teacherProfile._id.toString())).toBe(true);
    });

    test('publishes versioned group availability without converting legacy subject slots', async () => {
        const draft = await request(app)
            .post('/api/calendar/schedules/drafts')
            .set('Authorization', `Bearer ${admin.token}`)
            .send({ school_year_id: schoolYear._id.toString() });
        expect(draft.statusCode).toBe(201);
        expect(draft.body.data.status).toBe('draft');
        expect(draft.body.data.availability_windows).toHaveLength(1);

        const updated = await request(app)
            .patch(`/api/calendar/schedules/${draft.body.data.id}`)
            .set('Authorization', `Bearer ${admin.token}`)
            .send({
                school_days: [1, 2, 3, 4, 5],
                availability_windows: [{ window_id: 'window-7a', group_id: group._id.toString(), start_time: '06:15', end_time: '12:15' }],
            });
        expect(updated.statusCode).toBe(200);

        const published = await request(app)
            .post(`/api/calendar/schedules/${draft.body.data.id}/publish`)
            .set('Authorization', `Bearer ${admin.token}`);
        expect(published.statusCode).toBe(200);
        expect(published.body.data.status).toBe('published');
        expect(published.body.data.version).toBe(2);

        const archived = await request(app)
            .get('/api/calendar/schedules')
            .query({ school_year_id: schoolYear._id.toString(), status: 'archived' })
            .set('Authorization', `Bearer ${admin.token}`);
        expect(archived.statusCode).toBe(200);
        expect(archived.body.data.schedules).toHaveLength(1);
    });

    test('persists exact weekly subject slots and enforces them for scheduled sessions', async () => {
        const draft = await request(app)
            .post('/api/calendar/schedules/drafts')
            .set('Authorization', `Bearer ${admin.token}`)
            .send({ school_year_id: schoolYear._id.toString() });
        expect(draft.statusCode).toBe(201);

        const updated = await request(app)
            .patch(`/api/calendar/schedules/${draft.body.data.id}`)
            .set('Authorization', `Bearer ${admin.token}`)
            .send({
                school_days: [1, 2, 3, 4, 5],
                availability_windows: [{ window_id: 'window-7a', group_id: group._id.toString(), start_time: '06:15', end_time: '12:15' }],
                slots: [{
                    slot_id: 'martes-matematicas-0615',
                    group_id: group._id.toString(),
                    area_id: area._id.toString(),
                    teacher_id: teacherProfile._id.toString(),
                    aula_id: aula._id.toString(),
                    weekday: 2,
                    start_time: '06:15',
                    end_time: '08:15',
                }],
            });
        expect(updated.statusCode).toBe(200);
        expect(updated.body.data.slots[0].area.name).toBe('Matemáticas');

        const legacyUpdate = await request(app)
            .patch(`/api/calendar/schedules/${draft.body.data.id}`)
            .set('Authorization', `Bearer ${admin.token}`)
            .send({
                school_days: [1, 2, 3, 4, 5],
                availability_windows: [{ window_id: 'window-7a', group_id: group._id.toString(), start_time: '06:15', end_time: '12:15' }],
            });
        expect(legacyUpdate.statusCode).toBe(200);
        expect(legacyUpdate.body.data.slots).toHaveLength(1);

        const published = await request(app)
            .post(`/api/calendar/schedules/${draft.body.data.id}/publish`)
            .set('Authorization', `Bearer ${admin.token}`);
        expect(published.statusCode).toBe(200);
        expect(published.body.data.slots[0].slot_id).toBe('martes-matematicas-0615');

        const teacherSlots = await request(app)
            .get('/api/calendar/schedules/me')
            .query({ school_year_id: schoolYear._id.toString() })
            .set('Authorization', `Bearer ${teacher.token}`);
        expect(teacherSlots.statusCode).toBe(200);
        expect(teacherSlots.body.data.schedules[0].slots).toHaveLength(1);
        expect(teacherSlots.body.data.schedules[0].slots[0].teacher._id.toString()).toBe(teacherProfile._id.toString());

        const allowed = await request(app)
            .post('/api/calendar/sessions')
            .set('Authorization', `Bearer ${admin.token}`)
            .send({
                ...sessionInput,
                start_at: '2026-09-01T12:00:00.000Z',
                end_at: '2026-09-01T13:00:00.000Z',
                topic: 'Clase dentro del bloque',
            });
        expect(allowed.statusCode).toBe(409);

        const generated = await request(app)
            .get('/api/calendar')
            .query({ from: '2026-09-01', to: '2026-09-01', school_year_id: schoolYear._id.toString() })
            .set('Authorization', `Bearer ${admin.token}`);
        expect(generated.statusCode).toBe(200);
        const generatedSession = generated.body.data.sessions.find((item) => item.schedule_slot_id === 'martes-matematicas-0615');
        expect(generatedSession).toBeTruthy();

        const entries = await request(app)
            .get(`/api/calendar/schedules/${draft.body.data.id}/entries`)
            .set('Authorization', `Bearer ${admin.token}`);
        expect(entries.statusCode).toBe(200);
        expect(entries.body.data.entries).toHaveLength(1);

        const plan = await request(app)
            .post('/api/lesson-plans')
            .set('Authorization', `Bearer ${teacher.token}`)
            .send({ session_id: generatedSession._id, topic: 'Ecuaciones lineales', learning_objective: 'Resolver ecuaciones de primer grado', status: 'completed' });
        expect(plan.statusCode).toBe(201);
        expect(plan.body.data.status).toBe('completed');

        const studentPlan = await request(app)
            .get(`/api/lesson-plans/session/${generatedSession._id}`)
            .set('Authorization', `Bearer ${student.token}`);
        expect(studentPlan.statusCode).toBe(200);
        expect(studentPlan.body.data.topic).toBe('Ecuaciones lineales');

        const teacherSessionUpdate = await request(app)
            .patch(`/api/calendar/sessions/${generatedSession._id}`)
            .set('Authorization', `Bearer ${teacher.token}`)
            .send({ start_at: '2026-09-01T15:00:00.000Z' });
        expect(teacherSessionUpdate.statusCode).toBe(403);

        const cancellation = await request(app)
            .post('/api/calendar/exceptions')
            .set('Authorization', `Bearer ${admin.token}`)
            .send({ type: 'cancelled', session_id: generatedSession._id, reason: 'Jornada institucional suspendida' });
        expect(cancellation.statusCode).toBe(201);
        expect(cancellation.body.data.status).toBe('cancelled');

        const outsideSlot = await request(app)
            .post('/api/calendar/sessions')
            .set('Authorization', `Bearer ${admin.token}`)
            .send({
                ...sessionInput,
                start_at: '2026-09-01T14:00:00.000Z',
                end_at: '2026-09-01T15:00:00.000Z',
                topic: 'Clase fuera del bloque',
            });
        expect(outsideSlot.statusCode).toBe(409);
    });

    test('supports canonical teaching assignments and schedule entries', async () => {
        const outsiderProfile = await Teacher.findOne({ user_id: outsiderTeacher.user._id });
        const assignment = await request(app)
            .post('/api/teaching-assignments')
            .set('Authorization', `Bearer ${admin.token}`)
            .send({ school_year_id: schoolYear._id.toString(), teacher_id: outsiderProfile._id.toString(), group_id: group._id.toString(), area_id: area._id.toString() });
        expect(assignment.statusCode).toBe(201);
        expect(assignment.body.data.status).toBe('active');

        const draft = await request(app)
            .post('/api/calendar/schedules/drafts')
            .set('Authorization', `Bearer ${admin.token}`)
            .send({ school_year_id: schoolYear._id.toString() });
        expect(draft.statusCode).toBe(201);

        const entry = await request(app)
            .post(`/api/calendar/schedules/${draft.body.data.id}/entries`)
            .set('Authorization', `Bearer ${admin.token}`)
            .send({ teaching_assignment_id: assignment.body.data.id, aula_id: aula._id.toString(), entry_key: 'jueves-outsider-0900', weekday: 4, start_time: '09:00', end_time: '10:00' });
        expect(entry.statusCode).toBe(201);
        expect(entry.body.data.group.id.toString()).toBe(group._id.toString());
        expect(entry.body.data.teacher.id.toString()).toBe(outsiderProfile._id.toString());

        const duplicate = await request(app)
            .post(`/api/calendar/schedules/${draft.body.data.id}/entries`)
            .set('Authorization', `Bearer ${admin.token}`)
            .send({ teaching_assignment_id: assignment.body.data.id, aula_id: aula._id.toString(), entry_key: 'jueves-outsider-0930', weekday: 4, start_time: '09:30', end_time: '10:30' });
        expect(duplicate.statusCode).toBe(409);
    });
});
