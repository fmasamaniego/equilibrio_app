from pydantic import BaseModel
from typing import Optional


class EjercicioBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    grupo_muscular_id: int


class EjercicioCreate(EjercicioBase):
    pass


class EjercicioUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    grupo_muscular_id: Optional[int] = None


class EjercicioOut(EjercicioBase):
    id: int

    class Config:
        from_attributes = True
