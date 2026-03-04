import mongoose from 'mongoose';

/**
 * Person Model
 * Entidad central del sistema - almacena info personal de todos los usuarios.
 * Tiene referencia a User (user_id) para relación bidireccional:
 *   User.person_id → Person
 *   Person.user_id → User
 */
const personSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El usuario es requerido'],
            unique: true,
        },
        first_name: {
            type: String,
            required: [true, 'El nombre es requerido'],
            trim: true,
            minlength: [1, 'Mínimo 1 caracter'],
            maxlength: [100, 'Máximo 100 caracteres'],
        },
        last_name: {
            type: String,
            required: [true, 'El apellido es requerido'],
            trim: true,
            minlength: [1, 'Mínimo 1 caracter'],
            maxlength: [100, 'Máximo 100 caracteres'],
        },
        phone: {
            type: String,
            trim: true,
            maxlength: [20, 'Máximo 20 caracteres'],
            default: null,
        },
        role: {
            type: String,
            enum: ['Student', 'Teacher', 'Admin', 'Guardian'],
            required: [true, 'El rol es requerido'],
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'pending', 'blocked', 'egresado'],
            default: 'pending',
        },
        born_date: {
            type: Date,
            default: null,
        },
        document_type: {
            type: String,
            enum: ['CC', 'RC', 'CE'],
            required: [true, 'El tipo de documento es requerido'],
        },
        document_number: {
            type: String,
            required: [true, 'El número de documento es requerido'],
            unique: true,
            trim: true,
            match: [/^[0-9A-Za-z-]+$/, 'Formato de documento inválido'],
            minlength: [4, 'Mínimo 4 caracteres'],
            maxlength: [20, 'Máximo 20 caracteres'],
        },
        profile_photo_url: {
            type: String,
            trim: true,
            maxlength: [300, 'Máximo 300 caracteres'],
            default: null,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// Índices
personSchema.index({ user_id: 1 }, { unique: true });
personSchema.index({ document_number: 1 }, { unique: true });
personSchema.index({ role: 1 });
personSchema.index({ status: 1 });

export default mongoose.model('Person', personSchema);
