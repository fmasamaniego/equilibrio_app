from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class HistorialRutinaBase(BaseModel):
    rutina_id: int
    alumno_id: int
    notas: Optional[str] = None


class HistorialRutinaCreate(HistorialRutinaBase):
    pass


class HistorialRutinaOut(HistorialRutinaBase):
    id: int
    fecha_asignacion: datetime

    class Config:
        from_attributes = True
