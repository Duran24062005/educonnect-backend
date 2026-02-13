import { ObjectId } from "mongodb";

/*
    Role Model - Define la estrucutura y validaciones de un rol.
    Responsabilidad: Solo definir la estructura de los datos.
*/
export class RoleModel {
    constructor(data) {
        this._id = data._id || new ObjectId;
        this.title = data.title;
        this.description = data.description;
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    toDatabase() {
        return {
            _id: this._id,
            title: this.title,
            description: this.description,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        }
    }

    validate() {
        const errors = [];

        if (!this.title || this.title.trim().lenght === 0) {
            errors.push('Title is required.')
        }

        if (!this.description || this.description.trim().lenght === 0) {
            errors.push('Description is required.')
        }
    }
}