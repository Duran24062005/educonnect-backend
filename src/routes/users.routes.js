import { Router } from "express";

const users_router = Router()

// Obtener todos los usuarios
users_router.get("/all", (req, res) => {
    res.send({
        message: `Estas en la ruta ${req.originalUrl}`
    })
});

// Obtener un usuario por su id
users_router.get("/:id", (req, res) => {
    res.send({
        message: `Estas en la ruta ${req.originalUrl}`
    })
});

// Obtener crear un usuario
users_router.post("/create", (req, res) => {
    res.send({
        message: `Estas en la ruta ${req.originalUrl}`
    })
});

// Obtener todos los usuarios
users_router.patch("/update", (req, res) => {
    res.send({
        message: `Estas en la ruta ${req.originalUrl}`
    })
});

// Obtener todos los usuarios
users_router.delete("/delete", (req, res) => {
    res.send({
        message: `Estas en la ruta ${req.originalUrl}`
    })
});

export default users_router;