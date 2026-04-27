from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class RutinaEjercicioBase(BaseModel):
    ejercicio_id: int
    series: int = 3
    repeticiones: int
    peso: Optional[int] = None
    dia: int
    notas: Optional[str] = None


class RutinaEjercicioCreate(RutinaEjercicioBase):
    pass


class RutinaEjercicioOut(RutinaEjercicioBase):
    id: int
    ejercicio_nombre: Optional[str] = None

    class Config:
        from_attributes = True


class RutinaBase(BaseModel):
    nombre: str
    alumno_id: int


class RutinaCreate(RutinaBase):
    ejercicios: List[RutinaEjercicioCreate]


class RutinaOut(RutinaBase):
    id: int
    creado_en: Optional[datetime] = None
    ejercicios: List[RutinaEjercicioOut] = []

    class Config:
        from_attributes = True


class RutinaDuplicar(BaseModel):
    alumno_id: int
    nombre: Optional[str] = None
