from typing import Optional

from pydantic import BaseModel, field_validator


class UsuarioBase(BaseModel):
    usuario: str            # alias de login (único)
    nombre: str             # nombre real para mostrar y buscar
    apellido: str
    rol: str = "alumno"  # admin, profesor, alumno


class UsuarioCreate(UsuarioBase):
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("La contraseña debe tener al menos 6 caracteres")
        return v


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
