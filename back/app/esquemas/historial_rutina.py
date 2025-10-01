from pydantic import BaseModel
from datetime import datetime

class HistorialRutinaBase(BaseModel):
    rutina_id: int
    alumno_id: int
    notas: str | None = None

class HistorialRutinaCreate(HistorialRutinaBase):
    pass

class HistorialRutinaOut(HistorialRutinaBase):
    id: int
    fecha_asignacion: datetime

    class Config:
        orm_mode = True
