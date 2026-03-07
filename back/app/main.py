import logging
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

logger = logging.getLogger("uvicorn.error")

from app.config import CORS_ORIGINS

_debug = os.getenv("DEBUG", "false").lower() == "true"

limiter = Limiter(key_func=get_remote_address)
from app.routers import endpoint_usuario as usuarios
from app.routers import endpoint_grupo_musculares as grupos_musculares
from app.routers import endpoint_ejercicios as ejercicios
from app.routers import endpoint_rutina as rutinas
from app.routers import endpoint_historial as historial
from app.routers import endpoint_ejecuciones as ejecuciones
from app.auth import auth
from app.routers import endpoint_login as login
from app.routers import endpoint_horarios as horarios
from app.routers import endpoint_asignaciones as asignaciones
from app.routers import endpoint_reservas as reservas
from app.routers import endpoint_dashboard_horarios as dashboard_horarios

app = FastAPI(
    title="Sistema de Rutinas de Gimnasio",
    docs_url="/docs" if _debug else None,
    redoc_url="/redoc" if _debug else None,
    openapi_url="/openapi.json" if _debug else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Global exception handlers ---

@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    return JSONResponse(
        status_code=409,
        content={"detail": "Conflicto de integridad en la base de datos. Posible duplicado o referencia inválida."},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor"},
    )


# --- Routers ---

app.include_router(login.router, prefix="/auth", tags=["Auth"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(usuarios.router)
app.include_router(grupos_musculares.router)
app.include_router(ejercicios.router)
app.include_router(rutinas.router)
app.include_router(historial.router)
app.include_router(ejecuciones.router)
app.include_router(horarios.router)
app.include_router(asignaciones.router)
app.include_router(reservas.router)
app.include_router(dashboard_horarios.router)
