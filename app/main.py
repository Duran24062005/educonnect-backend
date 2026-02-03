from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="EduConnect API", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    """Endpoint raíz de bienvenida"""
    return {
        "message": "Bienvenido a EduConnect API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    """Verificar estado de la aplicación"""
    return {"status": "healthy"}

@app.get("/api/hello")
def hello():
    """Ejemplo de endpoint en /api"""
    return {"message": "Hello from EduConnect API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
