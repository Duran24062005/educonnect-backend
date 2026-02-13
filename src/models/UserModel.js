import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import validator from 'validator';

/**
 * Schema de Usuario
 * Define la estructura y validaciones a nivel de base de datos
 * Responsabilidad: SOLO estructura de datos (no debe contener lógica de negocio)
 * La lógica debe estar en services/ y repositories/
 */
const userSchema = new mongoose.Schema(
    {
        first_name: {
            type: String,
            required: [true, 'Por favor proporciona un nombre'],
            trim: true,
            minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        },
        last_name: {
            type: String,
            required: [true, 'Por favor proporciona un apellido'],
            trim: true,
            minlength: [2, 'El apellido debe tener al menos 2 caracteres'],
        },
        email: {
            type: String,
            required: [true, 'Por favor proporciona un email'],
            unique: true,
            lowercase: true,
            validate: [validator.isEmail, 'Por favor proporciona un email válido'],
        },
        password: {
            type: String,
            required: [true, 'Por favor proporciona una contraseña'],
            minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
            select: false, // No retornar contraseña en queries por defecto
        },
        birthdate: {
            type: Date,
            required: [true, 'Por favor proporciona tu fecha de nacimiento'],
        },
        document_number: {
            type: String,
            unique: true,
            sparse: true, // Permite null para valores únicos opcionales
            validate: {
                validator: function (value) {
                    if (!value) return true; // Permitir null
                    return /^[0-9]{6,15}$/.test(value); // Validar formato
                },
                message: 'El número de documento debe contener 6-15 dígitos',
            },
        },
        role: {
            type: String,
            enum: ['student', 'teacher', 'admin', 'guardian'],
            default: 'student',
            required: true,
        },
        is_admin: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ['active', 'pending', 'inactive', 'blocked'],
            default: 'pending',
        },
        email_verified: {
            type: Boolean,
            default: false,
        },
        last_login: {
            type: Date,
            default: null,
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        updated_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password antes de guardar
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
});

// Método para comparar contraseñas
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcryptjs.compare(enteredPassword, this.password);
};

// Método para obtener usuario sin campos sensibles
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

// Índices para optimizar queries
userSchema.index({ email: 1 });
userSchema.index({ document_number: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

export default mongoose.model('User', userSchema);