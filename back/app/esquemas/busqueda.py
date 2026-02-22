from pydantic import BaseModel
from typing import Optional, List
from datetime import date, time


class AlumnoBusquedaOut(BaseModel):
    """Resultado de busqueda de alumnos."""
    id: int
    nombre: str
    apellido: str
    activo: bool
    tiene_horario_fijo: bool
    proxima_reserva: Optional[date] = None

    class Config:
        from_attributes = True


class AlumnoEnHorarioOut(BaseModel):
    """Alumno esperado en un horario."""
    alumno_id: int
    nombre: str
    apellido: str
    tipo: str  # "fijo" o "reserva"
    estado: Optional[str] = None
    asignacion_id: Optional[int] = None
    reserva_id: Optional[int] = None
    rutina_id: Optional[int] = None


class DashboardHorarioActual(BaseModel):
    """Vista de quien viene ahora/proximo."""
    horario_id: int
    hora_inicio: time
    hora_fin: time
    nombre: Optional[str] = None
    capacidad: Optional[int] = None
    alumnos: List[AlumnoEnHorarioOut]
    total_alumnos: int
