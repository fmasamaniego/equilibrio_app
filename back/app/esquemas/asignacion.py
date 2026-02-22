from pydantic import BaseModel, field_validator
from typing import List


class AsignacionFijaBase(BaseModel):
    alumno_id: int
    horario_id: int
    dia_semana: int

    @field_validator('dia_semana')
    @classmethod
    def validate_dia_semana(cls, v):
        if not 0 <= v <= 6:
            raise ValueError('dia_semana debe estar entre 0 (Lunes) y 6 (Domingo)')
        return v


class AsignacionFijaCreate(AsignacionFijaBase):
    pass


class AsignacionFijaBulkCreate(BaseModel):
    """Crear multiples asignaciones para un alumno."""
    alumno_id: int
    asignaciones: List[dict]


class AsignacionFijaOut(AsignacionFijaBase):
    id: int

    class Config:
        from_attributes = True


class AsignacionFijaConDetalles(AsignacionFijaOut):
    """Asignacion con datos del alumno y horario."""
    alumno_nombre: str
    alumno_apellido: str
    horario_inicio: str
    horario_fin: str
