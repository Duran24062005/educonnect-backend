// @ts-nocheck
import { AppError } from '../utils/error.js';
import AppConf from '../config/config.js';

const EMAIL_API_BASE_URL = AppConf.app.emailApiBase;
const shouldSendEmails = AppConf.app.nodeEnv !== 'test';
const EMAIL_COMPANY = 'EduConnect';
const DEFAULT_FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const getEmailTestAdapter = () => globalThis.__EDUCONNECT_EMAIL_SERVICE__ || null;

type sendWelcomeEmailType = {
    email: string;
    firstName: string;
    templateName: string;
    emailToken?: string;
    subject?: string;
}

type sendAccountStatusEmailType = {
    email: string;
    firstName: string;
}

const sendTemplateEmail = async ({
    recipient,
    subject,
    templateName,
    templateData,
}: {
    recipient: string;
    subject: string;
    templateName: string;
    templateData: Record<string, unknown>;
}) => {
    const testAdapter = getEmailTestAdapter();
    if (testAdapter?.sendTemplateEmail) {
        return await testAdapter.sendTemplateEmail({
            recipient,
            subject,
            template_name: templateName,
            template_data: templateData,
        });
    }

    if (!shouldSendEmails) {
        return { sent: false, skipped: true, reason: 'Email disabled in test environment' };
    }

    const response = await fetch(`${EMAIL_API_BASE_URL}/emails/send`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            recipient,
            subject,
            template_name: templateName,
            template_data: templateData,
            user_id: 3,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Error sending email:', error);
        throw new AppError(
            `Error al enviar email usando plantilla ${templateName}`,
            500
        );
    }

    return await response.json();
};

/**
 * Enviar email usando una plantilla de bienvenida/login.
 * Si se recibe token, se incluye el link de verificación.
 * @param {string} email - Email del usuario
 * @param {string} firstName - Nombre del usuario
 * @param {string} templateName - Nombre de la plantilla
 * @param {string | null} emailToken - Token opcional para verificación
 * @returns {Promise<Object>} Respuesta de la API
 */
export const sendWelcomeEmail = async ({
    email,
    firstName,
    templateName,
    emailToken = null,
    subject = 'Bienvenido a EduConnect - Verifica tu email',
}: sendWelcomeEmailType) => {
    try {
        const templateData: Record<string, unknown> = {
            nombre: firstName,
            empresa: EMAIL_COMPANY,
        };

        if (emailToken) {
            templateData.verification_link = `${DEFAULT_FRONTEND_URL}/verify-email?token=${emailToken}`;
        }

        return await sendTemplateEmail({
            recipient: email,
            subject,
            templateName,
            templateData,
        });
    } catch (error) {
        console.error('Email service error:', error.message);
        // No lanzamos error para que el registro no falle si el email falla
        // Pero lo registramos en logs
        return { error: error.message, sent: false };
    }
};

export const sendInactiveWelcomeEmail = async ({ email, firstName }: sendAccountStatusEmailType) => {
    try {
        return await sendTemplateEmail({
            recipient: email,
            subject: 'Bienvenido a EduConnect - Tu cuenta está pendiente de activación',
            templateName: 'welcome_inactive_count_educonnect.html',
            templateData: {
                nombre: firstName,
                empresa: EMAIL_COMPANY,
            },
        });
    } catch (error) {
        console.error('Email service error:', error.message);
        return { error: error.message, sent: false };
    }
};

export const sendActiveWelcomeEmail = async ({ email, firstName }: sendAccountStatusEmailType) => {
    try {
        return await sendTemplateEmail({
            recipient: email,
            subject: 'Bienvenido a EduConnect - Tu cuenta ya está activa',
            templateName: 'welcome_active_count_educonnect.html',
            templateData: {
                nombre: firstName,
                empresa: EMAIL_COMPANY,
                login_link: `${DEFAULT_FRONTEND_URL}/login`,
            },
        });
    } catch (error) {
        console.error('Email service error:', error.message);
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
    try {
        return await sendTemplateEmail({
            recipient: email,
            subject: 'Tu cuenta en EduConnect ha sido aprobada',
            templateName: 'account_approved.html',
            templateData: {
                nombre: firstName,
                empresa: EMAIL_COMPANY,
                role: role === 'student' ? 'Estudiante' :
                    role === 'teacher' ? 'Docente' :
                        role === 'guardian' || role === 'parent' ? 'Padre/Acudiente' : role,
                login_link: `${DEFAULT_FRONTEND_URL}/login`,
            },
        });
    } catch (error) {
        console.error('Email service error:', error.message);
        return { error: error.message, sent: false };
    }
};

/**
 * Enviar email con el código de recuperación de contraseña
 * @param {string} email - Email del usuario
 * @param {string} firstName - Nombre del usuario
 * @param {string} resetCode - Código de 6 dígitos para resetear contraseña
 * @returns {Promise<Object>} Respuesta de la API
 */
export const sendPasswordResetEmail = async (email, firstName, resetCode) => {
    try {
        return await sendTemplateEmail({
            recipient: email,
            subject: 'Recupera tu contraseña en EduConnect',
            templateName: 'reset_password.html',
            templateData: {
                nombre: firstName,
                empresa: EMAIL_COMPANY,
                codigo: resetCode,
            },
        });
    } catch (error) {
        console.error('Email service error:', error.message);
        return { error: error.message, sent: false };
    }
};

/**
 * Envía el código inicial para que un administrador institucional establezca
 * su contraseña. Reutiliza la plantilla existente para no introducir una
 * dependencia obligatoria en el proveedor de correo durante el MVP.
 */
export const sendInstitutionAdminInvitation = async (email, firstName, resetCode) => {
    try {
        return await sendTemplateEmail({
            recipient: email,
            subject: 'Invitación para administrar tu institución en EduConnect',
            templateName: 'reset_password.html',
            templateData: {
                nombre: firstName,
                empresa: EMAIL_COMPANY,
                codigo: resetCode,
            },
        });
    } catch (error) {
        console.error('Institution invitation email error:', error.message);
        return { error: error.message, sent: false };
    }
};
