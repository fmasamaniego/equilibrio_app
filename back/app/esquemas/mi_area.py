from pydantic import BaseModel


class HorarioAlumnoOut(BaseModel):
    """Turno fijo de un alumno que tiene alguna rutina creada por el profesor actual."""
    alumno_id: int
    alumno_nombre: str
    alumno_apellido: str
    horario_id: int
    dia_semana: int
    horario_inicio: str
    horario_fin: str
