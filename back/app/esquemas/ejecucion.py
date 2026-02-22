from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


class EjecucionEjercicioBase(BaseModel):
    ejercicio_id: int
    series_completadas: int
    repeticiones_realizadas: int
    peso_usado: Optional[float] = None


class EjecucionEjercicioCreate(EjecucionEjercicioBase):
    pass


class EjecucionEjercicioOut(EjecucionEjercicioBase):
    id: int

    class Config:
        from_attributes = True


class EjecucionRutinaBase(BaseModel):
    rutina_id: int
    dia: int
    notas: Optional[str] = None
    completada: bool = False


class EjecucionRutinaCreate(EjecucionRutinaBase):
    detalles: List[EjecucionEjercicioCreate]


class EjecucionRutinaOut(EjecucionRutinaBase):
    id: int
    alumno_id: int
    fecha: datetime
    detalles: List[EjecucionEjercicioOut] = []

    class Config:
        from_attributes = True


class ProgresoEjercicioOut(BaseModel):
    fecha: datetime
    peso_usado: Optional[float] = None
    repeticiones_realizadas: int
    series_completadas: int


class ProgresoResumenOut(BaseModel):
    ejercicio_id: int
    ejercicio_nombre: str
    historial: List[ProgresoEjercicioOut]


class ActividadAlumnoOut(BaseModel):
    alumno_id: int
    nombre: str
    apellido: str
    ultima_sesion: Optional[datetime] = None
    sesiones_semana: int
    sesiones_mes: int
