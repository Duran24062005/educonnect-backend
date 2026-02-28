import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import validator from 'validator';

/**
 * User Model
 * Gestiona las credenciales de autenticación.
 * person_id es opcional: se asocia después del registro inicial,
 * cuando el usuario completa su perfil personal.
 */
const userSchema = new mongoose.Schema(
    {
        person_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Person',
            default: null,
            // Sin unique: true aquí porque null no debe ser único
        },
        email: {
            type: String,
            required: [true, 'El email es requerido'],
            unique: true,
            lowercase: true,
            trim: true,
            validate: [validator.isEmail, 'Email inválido'],
            maxlength: [150, 'Máximo 150 caracteres'],
        },
        hash_password: {
            type: String,
            required: [true, 'La contraseña es requerida'],
            minlength: [8, 'Mínimo 8 caracteres'],
            select: false,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// Hash password antes de guardar
userSchema.pre('save', async function (next) {
    if (!this.isModified('hash_password')) return next();
    const salt = await bcryptjs.genSalt(10);
    this.hash_password = await bcryptjs.hash(this.hash_password, salt);
    next();
});

// Comparar contraseña
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcryptjs.compare(enteredPassword, this.hash_password);
};

// Sin contraseña en toJSON
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.hash_password;
    return obj;
};

// Índice único para email. Para person_id usamos sparse
// para que múltiples nulls no violen la unicidad
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ person_id: 1 }, { unique: true, sparse: true });

export default mongoose.model('User', userSchema);