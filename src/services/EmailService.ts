// @ts-nocheck
import { AppError } from '../utils/error.js';
import AppConf from '../config/config.js';

const EMAIL_API_BASE_URL = AppConf.app.emailApiBase;
const shouldSendEmails = AppConf.app.nodeEnv !== 'test';

type sendWelcomeEmailType = {
    email: string;
    firstName: string;
    templateName: string;
    emailToken?: string;
}

/**
 * Enviar email usando una plantilla de bienvenida/login.
 * Si se recibe token, se incluye el link de verificación.
 * @param {string} email - Email del usuario
 * @param {string} firstName - Nombre del usuario
 * @param {string} templateName - Nombre de la plantilla
 * @param {string | null} emailToken - Token opcional para verificación
 * @returns {Promise<Object>} Respuesta de la API
 */
export const sendWelcomeEmail = async ({email, firstName, templateName, emailToken = null}: sendWelcomeEmailType) => {
    if (!shouldSendEmails) {
        return { sent: false, skipped: true, reason: 'Email disabled in test environment' };
    }

    try {
        const templateData = {
            nombre: firstName,
            empresa: 'EduConnect',
        };

        if (emailToken) {
            templateData.verification_link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${emailToken}`;
        }

        const response = await fetch(`${EMAIL_API_BASE_URL}/emails/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipient: email,
                subject: 'Bienvenido a EduConnect - Verifica tu email',
                template_name: templateName,
                template_data: templateData,
                user_id:3
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error sending email:', error);
            throw new AppError(
                'Error al enviar email de bienvenida',
                500
            );
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Email service error:', error.message);
        // No lanzamos error para que el registro no falle si el email falla
        // Pero lo registramos en logs
        return { error: error.message, sent: false };
    }
};

/**
 * Enviar email de aprobación de cuenta (Admin aprueba usuario)
 * @param {string} email - Email del usuario
 * @param {string} firstName - Nombre del usuario
 * @param {string} role - Rol asignado
 * @returns {Promise<Object>} Respuesta de la API
 */
export const sendApprovalEmail = async (email, firstName, role) => {
    if (!shouldSendEmails) {
        return { sent: false, skipped: true, reason: 'Email disabled in test environment' };
    }

    try {
        const response = await fetch(`${EMAIL_API_BASE_URL}/emails/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipient: email,
                subject: 'Tu cuenta en EduConnect ha sido aprobada',
                template_name: 'account_approved.html',
                template_data: {
                    nombre: firstName,
                    empresa: 'EduConnect',
                    role: role === 'student' ? 'Estudiante' :
                        role === 'teacher' ? 'Docente' :
                            role === 'guardian' || role === 'parent' ? 'Padre/Acudiente' : role,
                    login_link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error sending approval email:', error);
            throw new AppError(
                'Error al enviar email de aprobación',
                500
            );
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Email service error:', error.message);
        return { error: error.message, sent: false };
    }
};

/**
 * Enviar email de cambio de contraseña
 * @param {string} email - Email del usuario
 * @param {string} firstName - Nombre del usuario
 * @param {string} resetToken - Token para resetear contraseña
 * @returns {Promise<Object>} Respuesta de la API
 */
export const sendPasswordResetEmail = async (email, firstName, resetToken) => {
    if (!shouldSendEmails) {
        return { sent: false, skipped: true, reason: 'Email disabled in test environment' };
    }

    try {
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        const response = await fetch(`${EMAIL_API_BASE_URL}/emails/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipient: email,
                subject: 'Recupera tu contraseña en EduConnect',
                template_name: 'password_reset',
                template_data: {
                    nombre: firstName,
                    empresa: 'EduConnect',
                    reset_link: resetLink,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error sending password reset email:', error);
            throw new AppError(
                'Error al enviar email de recuperación de contraseña',
                500
            );
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Email service error:', error.message);
        return { error: error.message, sent: false };
    }
};
