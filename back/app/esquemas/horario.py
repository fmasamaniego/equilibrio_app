from pydantic import BaseModel
from typing import Optional, List
from datetime import date, time


class HorarioBase(BaseModel):
    hora_inicio: time
    hora_fin: time
    nombre: Optional[str] = None
    capacidad: Optional[int] = None


class HorarioCreate(HorarioBase):
    pass


class HorarioUpdate(BaseModel):
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    nombre: Optional[str] = None
    capacidad: Optional[int] = None
    activo: Optional[bool] = None


class HorarioOut(HorarioBase):
    id: int
    activo: bool

    class Config:
        from_attributes = True


class HorarioConDisponibilidad(HorarioOut):
    """Horario con info de disponibilidad para una fecha."""
    ocupados: int = 0
    disponibles: Optional[int] = None


class DisponibilidadSemanal(BaseModel):
    """Disponibilidad de todos los horarios para un dia."""
    fecha: date
    horarios: List[HorarioConDisponibilidad]
