from typing import Optional
from datetime import date, datetime

from pydantic import BaseModel, field_validator

ESTADOS_VALIDOS = {"pendiente", "confirmada", "cancelada", "asistio"}


class ReservaBase(BaseModel):
    horario_id: int
    fecha: date
    notas: Optional[str] = None


class ReservaCreate(ReservaBase):
    pass


class ReservaCreateAdmin(ReservaBase):
    """Admin/profesor crea reserva para cualquier alumno."""
    alumno_id: int


class ReservaUpdate(BaseModel):
    estado: Optional[str] = None
    notas: Optional[str] = None

    @field_validator("estado")
    @classmethod
    def estado_valido(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ESTADOS_VALIDOS:
            raise ValueError(f"Estado inválido. Opciones: {', '.join(sorted(ESTADOS_VALIDOS))}")
        return v


class ReservaOut(ReservaBase):
    id: int
    alumno_id: int
    estado: str
    creado_en: datetime

    class Config:
        from_attributes = True


class ReservaConDetalles(ReservaOut):
    """Reserva con datos del alumno y horario."""
    alumno_nombre: str
    alumno_apellido: str
    horario_inicio: str
    horario_fin: str
