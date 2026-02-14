import { asyncHandler } from '../utils/error.js';
import AuthService from '../services/AuthService.js';
import { sendWelcomeEmail } from '../services/EmailService.js';

/**
 * AuthController
 * Capa de presentación (Presentation Layer)
 * Responsabilidad: Manejar requests HTTP y respuestas
 * - Extraer datos del request
 * - Llamar a servicios
 * - Formatear respuestas HTTP
 * - NO contiene lógica de negocio
 */
class AuthController {
    /**
     * POST /api/auth/register
     * Registrar nuevo usuario
     */
    register = asyncHandler(async (req, res) => {
        // Extraer datos del request
        const registerData = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            password: req.body.password,
            password_confirm: req.body.password_confirm,
            birthdate: req.body.birthdate,
            document_number: req.body.document_number,
            requested_role: req.body.requested_role || 'student',
        };

        // Llamar al servicio (contiene la lógica)
        const result = await AuthService.register(registerData);

        if (result) {
            const emaildata = await sendWelcomeEmail(registerData.email, registerData.first_name, result.token)
            // Formatear y retornar respuesta
            res.status(201).json({
                status: 'success',
                email: emaildata,
                message: 'Usuario registrado exitosamente',
                data: result,
            });
        }

        // Formatear y retornar respuesta
        res.status(201).json({
            status: 'success',
            message: 'Usuario registrado exitosamente',
            data: result,
        });
    });

    /**
     * POST /api/auth/login
     * Login de usuario
     */
    login = asyncHandler(async (req, res) => {
        // Extraer datos
        const { email, password } = req.body;

        // Llamar al servicio
        const result = await AuthService.login(email, password);

        // Responder
        res.status(200).json({
            status: 'success',
            message: 'Login exitoso',
            data: result,
        });
    });

    /**
     * GET /api/auth/me
     * Obtener usuario actual
     */
    getCurrentUser = asyncHandler(async (req, res) => {
        // El middleware ya autenticó al usuario
        const user = await AuthService.getCurrentUser(req.userId);

        res.status(200).json({
            status: 'success',
            data: { user },
        });
    });

    /**
     * POST /api/auth/logout
     * Logout (frontend elimina el token)
     */
    logout = asyncHandler(async (req, res) => {
        res.status(200).json({
            status: 'success',
            message: 'Logout exitoso. Por favor elimina el token en el cliente.',
        });
    });

    /**
     * POST /api/auth/change-password
     * Cambiar contraseña
     */
    changePassword = asyncHandler(async (req, res) => {
        // Extraer datos
        const { current_password, new_password, new_password_confirm } = req.body;

        // Llamar al servicio
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