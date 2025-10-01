from pydantic import BaseModel
from typing import List, Optional

class RutinaEjercicioBase(BaseModel):
    ejercicio_id: int
    repeticiones: int
    peso: Optional[int]
    dia: int  # Día dentro de la rutina

class RutinaEjercicioCreate(RutinaEjercicioBase):
    pass

class RutinaEjercicio(RutinaEjercicioBase):
    id: int
    class Config:
        orm_mode = True


class RutinaBase(BaseModel):
    nombre: str
    alumno_id: int

class RutinaCreate(RutinaBase):
    ejercicios: List[RutinaEjercicioCreate]

class Rutina(RutinaBase):
    id: int
    ejercicios: List[RutinaEjercicio]
    class Config:
        orm_mode = True

