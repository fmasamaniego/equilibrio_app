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
    alumno_id: Optional[int] = None  # None = plantilla sin alumno asignado todavía


class RutinaCreate(RutinaBase):
    profesor_id: Optional[int] = None  # solo lo puede fijar un admin; si crea un profesor, se ignora
    ejercicios: List[RutinaEjercicioCreate]


class RutinaOut(RutinaBase):
    id: int
    profesor_id: Optional[int] = None
    creado_en: Optional[datetime] = None
    ejercicios: List[RutinaEjercicioOut] = []

    class Config:
        from_attributes = True


class RutinaDuplicar(BaseModel):
    alumno_id: int
    nombre: Optional[str] = None


class RutinaAsignarProfesor(BaseModel):
    """Body para PATCH /rutinas/{id}/profesor. Un admin puede mandar cualquier profesor_id
    (o None para desasignar); un profesor que llama este endpoint solo puede reclamar
    rutinas sin dueño, y el body se ignora (se fuerza a sí mismo)."""
    profesor_id: Optional[int] = None


class RutinaAsignarProfesorBulk(BaseModel):
    """Body para POST /rutinas/asignar-profesor-bulk (solo admin)."""
    rutina_ids: List[int]
    profesor_id: Optional[int] = None
