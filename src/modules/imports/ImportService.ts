// @ts-nocheck
import Area from '../../models/AreaModel.js';
import Enrollment from '../../models/EnrollmentModel.js';
import Grade from '../../models/GradeModel.js';
import Group from '../../models/GroupModel.js';
import ImportJob from '../../models/ImportJobModel.js';
import Person from '../../models/PersonModel.js';
import SchoolYear from '../../models/SchoolYearModel.js';
import Student from '../../models/StudentModel.js';
import StudentGuardian from '../../models/StudentGuardianModel.js';
import Teacher from '../../models/TeacherModel.js';
import User from '../../models/UserModel.js';
import Campus from '../../models/CampusModel.js';
import SchoolShift from '../../models/SchoolShiftModel.js';
import AuditLogService from '../audit/AuditLogService.js';
import AppError from '../../utils/AppError.js';
import { parseCsv } from '../../utils/csv.js';

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 5000;
const VALID_STATUS = ['active', 'inactive', 'pending', 'blocked', 'egresado'];
const VALID_DOCUMENT_TYPES = ['CC', 'RC', 'CE'];
const VALID_RELATIONSHIPS = ['mother', 'father', 'guardian', 'other'];

const definitions = {
    students: {
        required: ['email', 'first_name', 'last_name', 'document_type', 'document_number', 'password'],
        aliases: {
            email: ['email', 'correo', 'correo_electronico'],
            first_name: ['first_name', 'nombre', 'nombres'],
            last_name: ['last_name', 'apellido', 'apellidos'],
            phone: ['phone', 'telefono', 'celular'],
            document_type: ['document_type', 'tipo_documento', 'tipo_de_documento'],
            document_number: ['document_number', 'numero_documento', 'documento'],
            password: ['password', 'contrasena', 'clave'],
            status: ['status', 'estado'],
        },
    },
    guardians: {
        required: ['email', 'first_name', 'last_name', 'document_type', 'document_number', 'password', 'student_document_number'],
        aliases: {
            email: ['email', 'correo', 'correo_electronico'],
            first_name: ['first_name', 'nombre', 'nombres'],
            last_name: ['last_name', 'apellido', 'apellidos'],
            phone: ['phone', 'telefono', 'celular'],
            document_type: ['document_type', 'tipo_documento', 'tipo_de_documento'],
            document_number: ['document_number', 'numero_documento', 'documento'],
            password: ['password', 'contrasena', 'clave'],
            student_document_number: ['student_document_number', 'documento_estudiante', 'documento_del_estudiante'],
            relationship: ['relationship', 'parentesco', 'relacion'],
            is_authorized: ['is_authorized', 'autorizado', 'autorizada'],
            status: ['status', 'estado'],
        },
    },
    teachers: {
        required: ['email', 'first_name', 'last_name', 'document_type', 'document_number', 'password'],
        aliases: {
            email: ['email', 'correo', 'correo_electronico'],
            first_name: ['first_name', 'nombre', 'nombres'],
            last_name: ['last_name', 'apellido', 'apellidos'],
            phone: ['phone', 'telefono', 'celular'],
            document_type: ['document_type', 'tipo_documento', 'tipo_de_documento'],
            document_number: ['document_number', 'numero_documento', 'documento'],
            password: ['password', 'contrasena', 'clave'],
            area: ['area', 'area_principal'],
            status: ['status', 'estado'],
        },
    },
    grades: {
        required: ['name'],
        aliases: {
            name: ['name', 'nombre', 'grado'],
            level: ['level', 'nivel'],
            description: ['description', 'descripcion'],
        },
    },
    areas: {
        required: ['name'],
        aliases: {
            name: ['name', 'nombre', 'area', 'asignatura'],
            description: ['description', 'descripcion'],
        },
    },
    groups: {
        required: ['school_year_year', 'grade_name', 'name', 'max_capacity'],
        aliases: {
            school_year_year: ['school_year_year', 'ano', 'ano_escolar', 'year'],
            grade_name: ['grade_name', 'nombre_grado', 'grado'],
            name: ['name', 'nombre', 'grupo'],
            max_capacity: ['max_capacity', 'capacidad', 'cupo'],
        },
    },
    enrollments: {
        required: ['student_document_number', 'school_year_year', 'group_name'],
        aliases: {
            student_document_number: ['student_document_number', 'documento_estudiante', 'documento_del_estudiante'],
            school_year_year: ['school_year_year', 'ano', 'ano_escolar', 'year'],
            group_name: ['group_name', 'nombre_grupo', 'grupo'],
            campus_code: ['campus_code', 'codigo_sede', 'sede'],
            shift_code: ['shift_code', 'codigo_jornada', 'jornada'],
            status: ['status', 'estado'],
            observations: ['observations', 'observaciones'],
        },
    },
};

const normalize = (value) => String(value ?? '').trim();
const lower = (value) => normalize(value).toLowerCase();
const id = (value) => value?._id?.toString?.() || value?.toString?.();

const boolValue = (value, defaultValue = true) => {
    const normalized = lower(value);
    if (!normalized) return defaultValue;
    if (['true', '1', 'si', 'sí', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
    return null;
};

const canonicalize = (entity, row) => {
    const definition = definitions[entity];
    return Object.entries(definition.aliases).reduce((result, [canonical, aliases]) => {
        const source = aliases.find((alias) => Object.prototype.hasOwnProperty.call(row, alias));
        result[canonical] = source ? normalize(row[source]) : '';
        return result;
    }, {});
};

const addError = (errors, rowNumber, field, message) => errors.push({ row_number: rowNumber, field, message });

const validateRow = (entity, row, rowNumber) => {
    const errors = [];
    const definition = definitions[entity];

    for (const field of definition.required) {
        if (!normalize(row[field])) addError(errors, rowNumber, field, 'El campo es requerido');
    }

    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower(row.email))) {
        addError(errors, rowNumber, 'email', 'El correo no es válido');
    }

    if (['students', 'guardians', 'teachers'].includes(entity)) {
        const documentType = normalize(row.document_type).toUpperCase();
        if (documentType && !VALID_DOCUMENT_TYPES.includes(documentType)) {
            addError(errors, rowNumber, 'document_type', 'Usa CC, RC o CE');
        }
        if (row.document_number && !/^[0-9A-Za-z-]{4,20}$/.test(normalize(row.document_number))) {
            addError(errors, rowNumber, 'document_number', 'Formato de documento inválido');
        }
        if (row.password && normalize(row.password).length < 8) {
            addError(errors, rowNumber, 'password', 'La contraseña debe tener al menos 8 caracteres');
        }
        if (row.status && !VALID_STATUS.includes(lower(row.status))) {
            addError(errors, rowNumber, 'status', 'Estado inválido');
        }
    }

    if (entity === 'guardians') {
        const relationship = lower(row.relationship);
        if (relationship && !VALID_RELATIONSHIPS.includes(relationship)) {
            addError(errors, rowNumber, 'relationship', 'Parentesco inválido');
        }
        if (row.is_authorized && boolValue(row.is_authorized, null) === null) {
            addError(errors, rowNumber, 'is_authorized', 'Usa true/false, 1/0 o si/no');
        }
    }

    if (entity === 'groups') {
        const year = Number(row.school_year_year);
        const capacity = Number(row.max_capacity);
        if (!Number.isInteger(year) || year < 2000 || year > 2100) addError(errors, rowNumber, 'school_year_year', 'Año inválido');
        if (!Number.isInteger(capacity) || capacity < 1 || capacity > 800) addError(errors, rowNumber, 'max_capacity', 'La capacidad debe estar entre 1 y 800');
    }

    if (entity === 'enrollments') {
        const year = Number(row.school_year_year);
        if (!Number.isInteger(year) || year < 2000 || year > 2100) addError(errors, rowNumber, 'school_year_year', 'Año inválido');
        if (row.status && !['active', 'transferred', 'retired'].includes(lower(row.status))) {
            addError(errors, rowNumber, 'status', 'Estado de matrícula inválido');
        }
    }

    return errors;
};

const validateDuplicates = (entity, records) => {
    const errors = [];
    const emailRows = new Map();
    const documentRows = new Map();
    const relationshipRows = new Map();

    records.forEach(({ row_number: rowNumber, data }) => {
        if (data.email) {
            const previous = emailRows.get(lower(data.email));
            if (previous && entity !== 'guardians') addError(errors, rowNumber, 'email', `Repetido en la fila ${previous}`);
            emailRows.set(lower(data.email), rowNumber);
        }
        if (data.document_number) {
            const previous = documentRows.get(normalize(data.document_number));
            if (previous && entity !== 'guardians') addError(errors, rowNumber, 'document_number', `Repetido en la fila ${previous}`);
            documentRows.set(normalize(data.document_number), rowNumber);
        }
        if (entity === 'guardians') {
            const key = `${lower(data.email)}:${normalize(data.student_document_number)}`;
            const previous = relationshipRows.get(key);
            if (previous) addError(errors, rowNumber, 'student_document_number', `Relación repetida en la fila ${previous}`);
            relationshipRows.set(key, rowNumber);
        }
    });

    return errors;
};

const findPersonByDocument = (documentNumber) => Person.findOne({ document_number: normalize(documentNumber) });

class ImportService {
    async preview({ userId, role, institutionId, entity, file }) {
        if (lower(role) !== 'admin') throw new AppError('Solo administración puede importar datos', 403);
        if (!definitions[entity]) throw new AppError('Entidad de importación inválida', 400);
        if (!file?.buffer) throw new AppError('El archivo CSV es requerido', 400);
        if (file.size > MAX_FILE_BYTES || file.buffer.length > MAX_FILE_BYTES) throw new AppError('El archivo supera el máximo de 2MB', 400);

        const parsed = parseCsv(file.buffer);
        if (parsed.rows.length > MAX_ROWS) throw new AppError(`El archivo supera el máximo de ${MAX_ROWS} filas`, 400);

        const records = parsed.rows.map((raw, index) => ({ row_number: index + 2, data: canonicalize(entity, raw) }));
        const errors = records.flatMap(({ row_number: rowNumber, data }) => validateRow(entity, data, rowNumber));
        errors.push(...validateDuplicates(entity, records));

        if (['guardians', 'enrollments'].includes(entity)) {
            for (const record of records) {
                const { row_number: rowNumber, data } = record;
                if (entity === 'guardians' && !(await Student.findOne({
                    user_id: (await findPersonByDocument(data.student_document_number))?.user_id,
                }))) {
                    addError(errors, rowNumber, 'student_document_number', 'No existe un estudiante con ese documento');
                }
                if (entity === 'enrollments') {
                    const person = await findPersonByDocument(data.student_document_number);
                    const student = person ? await Student.findOne({ user_id: person.user_id }) : null;
                    if (!student) addError(errors, rowNumber, 'student_document_number', 'No existe un estudiante con ese documento');

                    const year = await SchoolYear.findOne({ year: Number(data.school_year_year) });
                    if (!year) addError(errors, rowNumber, 'school_year_year', 'No existe el año escolar');
                    const group = year ? await Group.findOne({ school_year_id: year._id, name: data.group_name }) : null;
                    if (!group) addError(errors, rowNumber, 'group_name', 'No existe el grupo para ese año');
                    if (data.campus_code && !(await Campus.findOne({ code: data.campus_code }))) addError(errors, rowNumber, 'campus_code', 'No existe la sede');
                    if (data.shift_code && !(await SchoolShift.findOne({ code: data.shift_code }))) addError(errors, rowNumber, 'shift_code', 'No existe la jornada');
                }
            }
        }

        if (entity === 'groups') {
            for (const record of records) {
                const { row_number: rowNumber, data } = record;
                const year = await SchoolYear.findOne({ year: Number(data.school_year_year) });
                if (!year) addError(errors, rowNumber, 'school_year_year', 'No existe el año escolar');
                const grade = await Grade.findOne({ name: data.grade_name });
                if (!grade) addError(errors, rowNumber, 'grade_name', 'No existe el grado');
            }
        }

        const summary = {
            total: records.length,
            valid: records.length - new Set(errors.map((error) => error.row_number)).size,
            invalid: new Set(errors.map((error) => error.row_number)).size,
            created: 0,
            updated: 0,
        };
        const job = await new ImportJob({
            entity,
            file_name: file.originalname || `${entity}.csv`,
            headers: parsed.headers,
            records,
            validation_errors: errors,
            summary,
            created_by_user_id: userId,
            ...(institutionId ? { institution_id: institutionId } : {}),
        }).save();

        await AuditLogService.record({
            actorUserId: userId,
            actorRole: role,
            action: 'import.previewed',
            entityType: 'ImportJob',
            entityId: job._id,
            institutionId,
            metadata: { entity, file_name: job.file_name, summary },
        });

        return this.serializeJob(job);
    }

    async list(userId, limit = 20) {
        const jobs = await ImportJob.find({ created_by_user_id: userId })
            .select('-records')
            .sort({ created_at: -1 })
            .limit(Math.min(Number(limit) || 20, 100));
        return jobs.map((job) => this.serializeJob(job));
    }

    async get(userId, jobId) {
        const job = await ImportJob.findOne({ _id: jobId, created_by_user_id: userId });
        if (!job) throw new AppError('Carga no encontrada', 404);
        return this.serializeJob(job);
    }

    async confirm({ userId, role, institutionId, jobId }) {
        if (lower(role) !== 'admin') throw new AppError('Solo administración puede confirmar importaciones', 403);
        const job = await ImportJob.findOne({ _id: jobId, created_by_user_id: userId });
        if (!job) throw new AppError('Carga no encontrada', 404);
        if (job.status !== 'preview') throw new AppError('La carga ya fue procesada', 409);
        if (job.validation_errors?.length) throw new AppError('Corrige los errores antes de confirmar la carga', 400, job.validation_errors);

        const summary = { ...(job.summary?.toObject?.() || job.summary), created: 0, updated: 0 };
        try {
            for (const record of job.records) {
                const result = await this.persistRecord(job.entity, record.data, institutionId);
                summary.created += result.created || 0;
                summary.updated += result.updated || 0;
            }
            job.status = 'confirmed';
            job.confirmed_at = new Date();
            job.summary = summary;
            await job.save();
        } catch (error) {
            job.status = 'failed';
            job.summary = summary;
            await job.save();
            throw error;
        }

        await AuditLogService.record({
            actorUserId: userId,
            actorRole: role,
            action: 'import.confirmed',
            entityType: 'ImportJob',
            entityId: job._id,
            institutionId,
            metadata: { entity: job.entity, summary },
        });

        return this.serializeJob(job);
    }

    async persistRecord(entity, row, institutionId) {
        if (entity === 'students') return this.persistIdentity(row, 'Student', Student, institutionId);
        if (entity === 'teachers') return this.persistIdentity(row, 'Teacher', Teacher, institutionId);
        if (entity === 'guardians') return this.persistGuardian(row, institutionId);
        if (entity === 'grades') return this.persistSimple(Grade, { name: row.name, level: row.level || null, description: row.description || null }, ['name'], institutionId);
        if (entity === 'areas') return this.persistSimple(Area, { name: row.name, description: row.description || null }, ['name'], institutionId);
        if (entity === 'groups') return this.persistGroup(row, institutionId);
        if (entity === 'enrollments') return this.persistEnrollment(row, institutionId);
        throw new AppError('Entidad de importación inválida', 400);
    }

    async persistIdentity(row, role, ProfileModel, institutionId) {
        const email = lower(row.email);
        const documentNumber = normalize(row.document_number);
        let user = await User.findOne({ email }).populate('person_id');
        const personByDocument = await Person.findOne({ document_number: documentNumber });
        if (user?.person_id && personByDocument && id(user.person_id) !== id(personByDocument)) {
            throw new AppError(`El correo y el documento no pertenecen a la misma persona (${email})`, 400);
        }
        if (user && !user.person_id && personByDocument && id(personByDocument.user_id) !== id(user._id)) {
            throw new AppError(`El correo y el documento no pertenecen a la misma persona (${email})`, 400);
        }
        if (user?.person_id?.document_number && user.person_id.document_number !== documentNumber) {
            throw new AppError(`El correo ya está asociado a otro documento (${email})`, 400);
        }
        if (personByDocument && personByDocument.role !== role) {
            throw new AppError(`El documento ya está registrado con otro rol (${documentNumber})`, 400);
        }

        let created = 0;
        let updated = 0;
        if (!user) {
            user = await new User({ email, hash_password: row.password, ...(institutionId ? { institution_id: institutionId } : {}) }).save();
            created += 1;
        } else {
            updated += 1;
        }

        let person = user.person_id || personByDocument;
        if (!person) {
            person = await new Person({
                user_id: user._id,
                first_name: row.first_name,
                last_name: row.last_name,
                phone: row.phone || null,
                role,
                status: lower(row.status) || 'pending',
                document_type: normalize(row.document_type).toUpperCase(),
                document_number: documentNumber,
                ...(institutionId ? { institution_id: institutionId } : {}),
            }).save();
            user.person_id = person._id;
            await user.save();
            created += 1;
        } else {
            person.first_name = row.first_name;
            person.last_name = row.last_name;
            person.phone = row.phone || null;
            person.status = lower(row.status) || person.status || 'pending';
            person.document_type = normalize(row.document_type).toUpperCase();
            person.document_number = documentNumber;
            await person.save();
            updated += 1;
        }

        if (role === 'Parent') {
            return { created, updated };
        }

        if (role === 'Student') {
            const existing = await ProfileModel.findOne({ user_id: user._id });
            if (existing) updated += 1;
            else {
                await new ProfileModel({ user_id: user._id, ...(institutionId ? { institution_id: institutionId } : {}) }).save();
                created += 1;
            }
        } else {
            const existing = await ProfileModel.findOne({ user_id: user._id });
            if (existing) {
                if (row.area !== undefined) {
                    existing.area = row.area || null;
                    await existing.save();
                }
                updated += 1;
            } else {
                await new ProfileModel({ user_id: user._id, area: row.area || null, ...(institutionId ? { institution_id: institutionId } : {}) }).save();
                created += 1;
            }
        }

        return { created, updated };
    }

    async persistGuardian(row, institutionId) {
        const result = await this.persistIdentity(row, 'Parent', User, institutionId);
        const person = await findPersonByDocument(row.document_number);
        const guardian = await User.findOne({ person_id: person._id });
        const studentPerson = await findPersonByDocument(row.student_document_number);
        const student = studentPerson ? await Student.findOne({ user_id: studentPerson.user_id }) : null;
        if (!student) throw new AppError('No existe el estudiante de la relación', 400);

        const existing = await StudentGuardian.findOne({ student_id: student._id, guardian_id: guardian._id });
        if (existing) {
            existing.relationship = lower(row.relationship) || 'guardian';
            existing.is_authorized = boolValue(row.is_authorized, true);
            await existing.save();
            result.updated += 1;
        } else {
            await new StudentGuardian({
                student_id: student._id,
                guardian_id: guardian._id,
                relationship: lower(row.relationship) || 'guardian',
                is_authorized: boolValue(row.is_authorized, true),
                ...(institutionId ? { institution_id: institutionId } : {}),
            }).save();
            result.created += 1;
        }
        return result;
    }

    async persistSimple(Model, data, keys, institutionId) {
        const filter = Object.fromEntries(keys.map((key) => [key, data[key]]));
        const existing = await Model.findOne(filter);
        if (existing) {
            Object.assign(existing, data);
            await existing.save();
            return { created: 0, updated: 1 };
        }
        await new Model({ ...data, ...(institutionId ? { institution_id: institutionId } : {}) }).save();
        return { created: 1, updated: 0 };
    }

    async persistGroup(row, institutionId) {
        const year = await SchoolYear.findOne({ year: Number(row.school_year_year) });
        const grade = await Grade.findOne({ name: row.grade_name });
        if (!year || !grade) throw new AppError('El año o grado del grupo no existe', 400);
        const existing = await Group.findOne({ school_year_id: year._id, grade_id: grade._id, name: row.name });
        if (existing) {
            existing.max_capacity = Number(row.max_capacity);
            await existing.save();
            return { created: 0, updated: 1 };
        }
        await new Group({
            school_year_id: year._id,
            grade_id: grade._id,
            name: row.name,
            max_capacity: Number(row.max_capacity),
            ...(institutionId ? { institution_id: institutionId } : {}),
        }).save();
        return { created: 1, updated: 0 };
    }

    async persistEnrollment(row, institutionId) {
        const person = await findPersonByDocument(row.student_document_number);
        const student = person ? await Student.findOne({ user_id: person.user_id }) : null;
        const year = await SchoolYear.findOne({ year: Number(row.school_year_year) });
        const group = year ? await Group.findOne({ school_year_id: year._id, name: row.group_name }) : null;
        if (!student || !year || !group) throw new AppError('La matrícula referencia datos inexistentes', 400);
        const campus = row.campus_code ? await Campus.findOne({ code: row.campus_code }) : null;
        const shift = row.shift_code ? await SchoolShift.findOne({ code: row.shift_code }) : null;
        if (row.campus_code && !campus) throw new AppError('La sede de la matrícula no existe', 400);
        if (row.shift_code && !shift) throw new AppError('La jornada de la matrícula no existe', 400);

        const status = lower(row.status) || 'active';
        const active = await Enrollment.findOne({ student_id: student._id, school_year_id: year._id, status: 'active' });
        if (active && id(active.group_id) !== id(group._id)) {
            active.status = 'transferred';
            active.closed_at = new Date();
            active.transfer_reason = 'Actualización por importación controlada';
            await active.save();
            await new Enrollment({
                student_id: student._id,
                school_year_id: year._id,
                group_id: group._id,
                status,
                previous_enrollment_id: active._id,
                observations: row.observations || null,
                campus_id: campus?._id || null,
                shift_id: shift?._id || null,
                ...(institutionId ? { institution_id: institutionId } : {}),
            }).save();
            student.group_id = group._id;
            await student.save();
            return { created: 1, updated: 1 };
        }

        const existing = active || await Enrollment.findOne({ student_id: student._id, school_year_id: year._id, group_id: group._id }).sort({ created_at: -1 });
        if (existing) {
            existing.status = status;
            existing.observations = row.observations || null;
            existing.campus_id = campus?._id || null;
            existing.shift_id = shift?._id || null;
            existing.closed_at = status === 'active' ? null : existing.closed_at || new Date();
            await existing.save();
            student.group_id = status === 'active' ? group._id : student.group_id;
            await student.save();
            return { created: 0, updated: 1 };
        }

        if (status === 'active') {
            const count = await Enrollment.countDocuments({ group_id: group._id, status: 'active' });
            if (count >= group.max_capacity) throw new AppError(`El grupo ${group.name} no tiene cupos disponibles`, 400);
        }
        await new Enrollment({
            student_id: student._id,
            school_year_id: year._id,
            group_id: group._id,
            status,
            observations: row.observations || null,
            campus_id: campus?._id || null,
            shift_id: shift?._id || null,
            ...(institutionId ? { institution_id: institutionId } : {}),
        }).save();
        if (status === 'active') {
            student.group_id = group._id;
            await student.save();
        }
        return { created: 1, updated: 0 };
    }

    serializeJob(job) {
        const value = job.toObject ? job.toObject() : job;
        return {
            _id: value._id,
            entity: value.entity,
            file_name: value.file_name,
            status: value.status,
            headers: value.headers,
            records: value.records,
            errors: value.validation_errors || [],
            summary: value.summary,
            created_at: value.created_at,
            confirmed_at: value.confirmed_at,
        };
    }
}

export default new ImportService();
