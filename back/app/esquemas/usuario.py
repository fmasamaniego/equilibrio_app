from pydantic import BaseModel
from typing import Optional


class UsuarioBase(BaseModel):
    nombre: str
    apellido: str
    rol: str = "alumno"  # admin, profesor, alumno


class UsuarioCreate(UsuarioBase):
    password: str


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    rol: Optional[str] = None
    observaciones: Optional[str] = None
    activo: Optional[bool] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class PerfilUpdate(BaseModel):
    email: Optional[str] = None
    recibir_notificaciones: Optional[bool] = None


class UsuarioOut(UsuarioBase):
    id: int
    observaciones: Optional[str] = None
    activo: bool
    email: Optional[str] = None
    recibir_notificaciones: bool = False

    class Config:
        from_attributes = True
