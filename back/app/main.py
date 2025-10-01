from fastapi import FastAPI
from app.routers import endpoint_usuario as usuarios
from app.routers import endpoint_grupo_musculares as grupos_musculares
from app.routers import endpoint_ejercicios as ejercicios
from app.routers import endpoint_rutina as rutinas
from app.routers import endpoint_historial as historial

from app.auth import auth
from app.routers import endpoint_login as login


app = FastAPI(title="Sistema de Rutinas de Gimnasio")

# Routers
app.include_router(usuarios.router)
app.include_router(grupos_musculares.router)
app.include_router(ejercicios.router)
app.include_router(rutinas.router)
app.include_router(historial.router)

app.include_router(login.router, prefix="/auth", tags=["auth"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
