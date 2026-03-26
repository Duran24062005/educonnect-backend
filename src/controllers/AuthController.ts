import { asyncHandler } from '../utils/error.js';
import AuthService from '../services/AuthService.js';
import { sendInactiveWelcomeEmail, sendWelcomeEmail } from '../services/EmailService.js';
import AppError from '../utils/AppError.js';

/**
 * AuthController
 * Manejo HTTP de autenticación en dos pasos:
 *   POST /api/auth/register          → solo email + contraseña
 *   POST /api/auth/complete-profile  → datos personales (requiere token)
 */
class AuthController {
    /**
     * POST /api/auth/register
     * Registro inicial: solo email y contraseña.
     * Devuelve token inmediatamente para que el cliente
     * pueda llamar a /complete-profile en el siguiente paso.
     */
    register = asyncHandler(async (req, res) => {
        const registerData = {
            email: req.body.email,
            password: req.body.password,
            password_confirm: req.body.password_confirm,
        };

        const result = await AuthService.register(registerData);

        res.status(201).json({
            status: 'success',
            message: 'Cuenta creada. Por favor completa tu perfil personal.',
            data: result,
        });
    });

    /**
     * POST /api/auth/complete-profile
     * Paso 2: el usuario autenticado envía sus datos personales.
     * Requiere token JWT (middleware protect).
     */
    completeProfile = asyncHandler(async (req, res) => {
        const profileData = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            born_date: req.body.born_date,
            document_type: req.body.document_type,
            document_number: req.body.document_number,
            phone: req.body.phone,
            requested_role: req.body.requested_role || 'Student',
        };

        const result = await AuthService.completeProfile(req.userId, profileData);

        const authenticatedUserEmail = typeof req.user?.email === 'string' ? req.user.email : null;

        if (!authenticatedUserEmail) {
            throw new AppError('Usuario autenticado sin email asociado', 500);
        }

        // Enviar email de bienvenida ahora que tenemos nombre y email
        const emailResult = await sendInactiveWelcomeEmail({
            email: authenticatedUserEmail,
            firstName: result.person.first_name,
        });

        res.status(200).json({
            status: 'success',
            email: emailResult,
            message: 'Perfil completado exitosamente. Tu cuenta está pendiente de aprobación.',
            data: result,
        });
    });

    /**
     * POST /api/auth/login
     */
    login = asyncHandler(async (req, res) => {
        const { email, password } = req.body;

        const result = await AuthService.login(email, password);

        if (result) {
            // Solo enviar email de bienvenida si el perfil está completo y tenemos nombre
            let emailData = null;
            const loginUserEmail = typeof result.user?.email === 'string' ? result.user.email : null;

            if (result.profile_complete && result.person && loginUserEmail) {
                emailData = await sendWelcomeEmail({
                    email: loginUserEmail,
                    firstName: result.person.first_name,
                    templateName: 'login_educonnect.html',
                });
            }

        }
        res.status(200).json({
            status: 'success',
            message: 'Login exitoso',
            data: result,
        });
    });

    /**
     * GET /api/auth/me
     */
    getCurrentUser = asyncHandler(async (req, res) => {
        const result = await AuthService.getCurrentUser(req.userId);

        res.status(200).json({
            status: 'success',
            data: result,
        });
    });

    /**
     * GET /api/auth/profile-status
     */
    getProfileStatus = asyncHandler(async (req, res) => {
        const result = await AuthService.getProfileCompletionStatus(req.userId);

        res.status(200).json({
            status: 'success',
            data: result,
        });
    });

    /**
     * POST /api/auth/logout
     */
    logout = asyncHandler(async (req, res) => {
        res.status(200).json({
            status: 'success',
            message: 'Logout exitoso. Por favor elimina el token en el cliente.',
        });
    });

    /**
     * POST /api/auth/change-password
     */
    changePassword = asyncHandler(async (req, res) => {
        const { current_password, new_password, new_password_confirm } = req.body;

        const result = await AuthService.changePassword(
            req.userId,
            current_password,
            new_password,
            new_password_confirm
        );

        res.status(200).json({
            status: 'success',
            message: result.message,
        });
    });
}

export default new AuthController();
