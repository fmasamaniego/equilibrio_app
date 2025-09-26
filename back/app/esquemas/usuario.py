from pydantic import BaseModel
from datetime import datetime

class UsuarioBase(BaseModel):
    nombre: str
    apellido: str
    rol: str  # admin, profesor, alumno


class UsuarioCreate(UsuarioBase):
    password: str


class UsuarioOut(UsuarioBase):
    id: int
    fecha_creacion: datetime

    class Config:
        orm_mode = True
        

