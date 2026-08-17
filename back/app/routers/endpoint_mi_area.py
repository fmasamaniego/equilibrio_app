from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.db.engine import get_db
from app.modelos.usuarios import Usuario
from app.modelos.rutinas import Rutina
from app.modelos.asignaciones import AsignacionFija
from app.esquemas.mi_area import HorarioAlumnoOut
from app.auth.deps import require_profesor

router = APIRouter(prefix="/mi-area", tags=["Mi Area"])


@router.get("/horarios-alumnos", response_model=List[HorarioAlumnoOut])
def horarios_de_mis_alumnos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_profesor),
):
    """Turnos fijos de los alumnos que tienen alguna rutina creada por el profesor actual."""
    alumno_ids = [
        row[0]
        for row in (
            db.query(Rutina.alumno_id)
            .filter(Rutina.profesor_id == current_user.id, Rutina.alumno_id.isnot(None))
            .distinct()
            .all()
        )
    ]
    if not alumno_ids:
        return []

    asignaciones = (
        db.query(AsignacionFija)
        .options(joinedload(AsignacionFija.alumno), joinedload(AsignacionFija.horario))
        .filter(AsignacionFija.alumno_id.in_(alumno_ids))
        .order_by(AsignacionFija.dia_semana, AsignacionFija.horario_id)
        .all()
    )

    return [
        HorarioAlumnoOut(
            alumno_id=a.alumno_id,
            alumno_nombre=a.alumno.nombre,
            alumno_apellido=a.alumno.apellido,
            horario_id=a.horario_id,
            dia_semana=a.dia_semana,
            horario_inicio=a.horario.hora_inicio.strftime("%H:%M"),
            horario_fin=a.horario.hora_fin.strftime("%H:%M"),
        )
        for a in asignaciones
    ]
