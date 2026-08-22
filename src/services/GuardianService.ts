// @ts-nocheck
import User from '../models/UserModel.js';
import GuardianRepository from '../repositories/GuardianRepository.js';
import AnalyticsService from './AnalyticsService.js';
import AppError from '../utils/AppError.js';

const toIdString = (value) => value?._id?.toString?.() || value?.toString?.() || null;

const getPersonName = (person) =>
    person ? `${person.first_name || ''} ${person.last_name || ''}`.trim() : 'Sin nombre';

const serializeStudent = (link) => {
    const student = link.student_id;
    if (!student) return null;

    const person = student.user_id?.person_id;
    const group = student.group_id;
    const grade = group?.grade_id;
    const aula = student.aula_id;

    return {
        _id: toIdString(student._id),
        full_name: getPersonName(person),
        email: student.user_id?.email || null,
        profile_photo_url: person?.profile_photo_url || null,
        relationship: link.relationship || 'guardian',
        group: group
            ? {
                _id: toIdString(group._id),
                name: group.name || null,
                grade_name: grade?.name || null,
            }
            : null,
        aula: aula
            ? {
                _id: toIdString(aula._id),
                name: aula.name || null,
            }
            : null,
    };
};

class GuardianService {
    async getMyStudents(userId) {
        const links = await GuardianRepository.findAuthorizedStudentsByGuardianId(userId);
        return {
            students: links.map(serializeStudent).filter(Boolean),
        };
    }

    async getDashboard(userId, schoolYearId) {
        const [schoolYear, links] = await Promise.all([
            AnalyticsService.ensureSchoolYear(schoolYearId),
            GuardianRepository.findAuthorizedStudentsByGuardianId(userId),
        ]);

        const students = await Promise.all(
            links
                .filter((link) => link.student_id)
                .map(async (link) => ({
                    student: serializeStudent(link),
                    ...(await AnalyticsService.getStudentDashboard(
                        userId,
                        'parent',
                        schoolYearId,
                        link.student_id._id
                    )),
                }))
        );

        return {
            school_year: {
                _id: schoolYear._id,
                year: schoolYear.year,
                name: String(schoolYear.year),
            },
            students,
        };
    }

    async getBulletin(userId, schoolYearId, periodId, studentId) {
        const link = await GuardianRepository.findAuthorizedLink(userId, studentId);
        if (!link) {
            throw new AppError('No tienes permiso para acceder al boletín de este estudiante', 403);
        }

        return AnalyticsService.getStudentBulletin(userId, schoolYearId, periodId, studentId, 'parent');
    }

    async replaceStudentGuardians(studentId, guardians) {
        const student = await GuardianRepository.findStudentById(studentId);
        if (!student) {
            throw new AppError('Estudiante no encontrado', 404);
        }

        const normalized = guardians.map((guardian) => ({
            guardian_id: guardian.guardian_id,
            relationship: guardian.relationship || 'guardian',
            is_authorized: guardian.is_authorized !== false,
            student_id: student._id,
        }));
        const guardianIds = normalized.map((item) => String(item.guardian_id));
        if (new Set(guardianIds).size !== guardianIds.length) {
            throw new AppError('No puedes repetir un acudiente en el mismo estudiante', 400);
        }

        const guardianUsers = await User.find({ _id: { $in: guardianIds } }).populate('person_id');
        if (guardianUsers.length !== guardianIds.length) {
            throw new AppError('Uno o más acudientes no existen', 400);
        }

        const validGuardianIds = new Set(
            guardianUsers
                .filter((user) =>
                    ['parent', 'guardian'].includes(String(user.person_id?.role || '').toLowerCase()) &&
                    String(user.person_id?.status || '').toLowerCase() === 'active'
                )
                .map((user) => String(user._id))
        );
        if (validGuardianIds.size !== guardianIds.length) {
            throw new AppError('Solo puedes vincular usuarios activos con rol de padre o acudiente', 400);
        }

        const links = await GuardianRepository.replaceStudentGuardians(student._id, normalized);
        return {
            student_id: student._id,
            guardians: links.map((link) => ({
                guardian_id: toIdString(link.guardian_id),
                full_name: getPersonName(link.guardian_id?.person_id),
                email: link.guardian_id?.email || null,
                relationship: link.relationship,
                is_authorized: link.is_authorized,
            })),
        };
    }
}

export default new GuardianService();
