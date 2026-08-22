// @ts-nocheck
import {
    teacherRepository,
    studentRepository,
    groupTeacherRepository,
} from '../repositories/PersonProfileRepository.js';
import GuardianRepository from '../repositories/GuardianRepository.js';
import { enrollmentRepository } from '../repositories/EvaluationRepository.js';
import AppError from '../utils/AppError.js';

/**
 * Helpers de control de acceso por pertenencia.
 * Reutilizados por UserService, EvaluationService y GroupService
 * para cerrar los IDORs detectados en la auditoría (H1, H2, H3, H13).
 */

const toIdString = (value) => value?._id?.toString?.() || value?.toString?.() || null;

export const isAdmin = (role) => String(role || '').toLowerCase() === 'admin';

export const resolveTeacherByUserId = async (userId) => {
    const teacher = await teacherRepository.findByUserId(userId);
    if (!teacher) {
        throw new AppError('Perfil de docente no encontrado', 404);
    }
    return teacher;
};

export const resolveStudentByUserId = async (userId) => {
    const student = await studentRepository.findByUserId(userId);
    if (!student) {
        throw new AppError('Perfil de estudiante no encontrado', 404);
    }
    return student;
};

/**
 * ¿El docente tiene al menos una asignación (en cualquier área) dentro del grupo?
 */
export const canTeacherAccessGroup = async (teacherId, groupId) => {
    const assignments = await groupTeacherRepository.findByGroup(groupId);
    return assignments.some((assignment) => toIdString(assignment.teacher_id) === toIdString(teacherId));
};

/**
 * ¿El docente tiene al menos una asignación que use esta área?
 */
export const canTeacherAccessArea = async (teacherId, areaId) => {
    const assignments = await groupTeacherRepository.findByTeacher(teacherId);
    return assignments.some((assignment) => toIdString(assignment.area_id) === toIdString(areaId));
};

/**
 * Verifica que el solicitante pueda acceder a los datos académicos de un estudiante.
 * Permite: admin, el propio estudiante, un acudiente vinculado o un docente con asignación
 * en el grupo del estudiante.
 */
export const assertCanAccessStudentData = async ({ userId, role, studentId }) => {
    if (isAdmin(role)) return;

    const normalizedRole = String(role || '').toLowerCase();

    if (normalizedRole === 'student') {
        const student = await resolveStudentByUserId(userId);
        if (toIdString(student._id) === toIdString(studentId)) return;
        throw new AppError('No tienes permiso para acceder a los datos de este estudiante', 403);
    }

    if (normalizedRole === 'teacher') {
        const teacher = await resolveTeacherByUserId(userId);
        const enrollment = await enrollmentRepository.findActiveByStudent(studentId);
        if (enrollment && await canTeacherAccessGroup(teacher._id, enrollment.group_id)) return;
        throw new AppError('No tienes permiso para acceder a los datos de este estudiante', 403);
    }

    if (normalizedRole === 'parent') {
        const link = await GuardianRepository.findAuthorizedLink(userId, studentId);
        if (link) return;
        throw new AppError('No tienes permiso para acceder a los datos de este estudiante', 403);
    }

    throw new AppError('No tienes permiso para acceder a los datos de este estudiante', 403);
};

/**
 * Verifica que el solicitante pueda acceder a un grupo.
 * Permite: admin o docente con asignación en el grupo.
 */
export const assertCanAccessGroup = async ({ userId, role, groupId }) => {
    if (isAdmin(role)) return;

    const normalizedRole = String(role || '').toLowerCase();
    if (normalizedRole === 'teacher') {
        const teacher = await resolveTeacherByUserId(userId);
        if (await canTeacherAccessGroup(teacher._id, groupId)) return;
        throw new AppError('No tienes permiso para acceder a este grupo', 403);
    }

    throw new AppError('No tienes permiso para acceder a este grupo', 403);
};
