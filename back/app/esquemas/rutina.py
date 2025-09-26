from pydantic import BaseModel
from datetime import datetime

class RutinaBase(BaseModel):
    id_alumno: int
    id_profesor: int
    id_ejercicio: int
    series: int
    repeticiones: int
    peso: int | None = None

class RutinaCreate(RutinaBase):
    pass

class RutinaOut(RutinaBase):
    id: int
    fecha_asignacion: datetime

    class Config:
        orm_mode = True
