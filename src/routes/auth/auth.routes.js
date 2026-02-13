import { Router } from "express";

const auth_router = Router()

// Obtener crear un usuario
auth_router.post("/register", (req, res) => {
    res.send({
        message: `Estas en la ruta ${req.originalUrl}`
    })
});

// Obtener todos los usuarios
auth_router.patch("/login", (req, res) => {
    res.send({
        message: `Estas en la ruta ${req.originalUrl}`
    })
});

// Obtener todos los usuarios
auth_router.delete("/authentication", (req, res) => {
    res.send({
        message: `Estas en la ruta ${req.originalUrl}`
    })
});

export default auth_router;