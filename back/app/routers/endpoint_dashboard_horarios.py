from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from typing import List
from datetime import date, datetime

from app.db.engine import get_db
from app.modelos.usuarios import Usuario
from app.modelos.horarios import Horario
from app.modelos.asignaciones import AsignacionFija
from app.modelos.reservas import Reserva
from app.modelos.rutinas import Rutina
from app.esquemas.busqueda import AlumnoBusquedaOut, AlumnoEnHorarioOut, DashboardHorarioActual
from app.auth.auth import get_current_user
from app.auth.deps import require_profesor_or_admin

router = APIRouter(prefix="/dashboard", tags=["Dashboard Horarios"])


@router.get("/buscar-alumnos", response_model=List[AlumnoBusquedaOut])
def buscar_alumnos(
    q: str = Query(..., min_length=1, description="Termino de busqueda"),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_profesor_or_admin),
):
    """Busqueda rapida de alumnos por nombre o apellido."""
    termino = f"%{q.lower()}%"

    alumnos = db.query(Usuario).filter(
        Usuario.rol == "alumno",
        or_(
            func.lower(Usuario.nombre).like(termino),
            func.lower(Usuario.apellido).like(termino)
        )
    ).limit(limit).all()

    resultado = []
    hoy = date.today()
    alumno_ids = [a.id for a in alumnos]

    # Bulk load en lugar de N queries individuales
    asignaciones_ids = {
        af.alumno_id
        for af in db.query(AsignacionFija.alumno_id)
        .filter(AsignacionFija.alumno_id.in_(alumno_ids))
        .distinct()
        .all()
    }

    proximas_map: dict = {}
    for r in (
        db.query(Reserva.alumno_id, Reserva.fecha)
        .filter(
            Reserva.alumno_id.in_(alumno_ids),
            Reserva.fecha >= hoy,
            Reserva.estado == "confirmada",
        )
        .order_by(Reserva.alumno_id, Reserva.fecha)
        .all()
    ):
        if r.alumno_id not in proximas_map:
            proximas_map[r.alumno_id] = r.fecha

    for alumno in alumnos:
        resultado.append(AlumnoBusquedaOut(
            id=alumno.id,
            nombre=alumno.nombre,
            apellido=alumno.apellido,
            activo=alumno.activo,
            tiene_horario_fijo=alumno.id in asignaciones_ids,
            proxima_reserva=proximas_map.get(alumno.id),
        ))

    return resultado


@router.get("/quien-viene-ahora", response_model=DashboardHorarioActual)
def quien_viene_ahora(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_profesor_or_admin),
):
    """Obtiene los alumnos esperados en el horario actual o proximo."""
    ahora = datetime.now().time()
    hoy = date.today()
    dia_semana = hoy.weekday()

    # Buscar horario actual
    horario_actual = db.query(Horario).filter(
        Horario.activo == True,
        Horario.hora_inicio <= ahora,
        Horario.hora_fin > ahora
    ).first()

    # Si no hay actual, buscar el proximo
    if not horario_actual:
        horario_actual = db.query(Horario).filter(
            Horario.activo == True,
            Horario.hora_inicio > ahora
        ).order_by(Horario.hora_inicio).first()

    if not horario_actual:
        raise HTTPException(status_code=404, detail="No hay horarios disponibles")

    # Obtener alumnos con asignacion fija
    fijos = (
        db.query(AsignacionFija)
        .options(joinedload(AsignacionFija.alumno))
        .filter(AsignacionFija.horario_id == horario_actual.id, AsignacionFija.dia_semana == dia_semana)
        .all()
    )

    # Obtener reservas para hoy
    reservas = (
        db.query(Reserva)
        .options(joinedload(Reserva.alumno))
        .filter(Reserva.horario_id == horario_actual.id, Reserva.fecha == hoy, Reserva.estado != "cancelada")
        .all()
    )

    alumnos = []
    alumnos_ids = set()

    for f in fijos:
        if f.alumno_id not in alumnos_ids:
            alumnos_ids.add(f.alumno_id)
            alumnos.append(AlumnoEnHorarioOut(
                alumno_id=f.alumno_id,
                nombre=f.alumno.nombre,
                apellido=f.alumno.apellido,
                tipo="fijo",
                estado=None
            ))

    for r in reservas:
        if r.alumno_id not in alumnos_ids:
            alumnos_ids.add(r.alumno_id)
            alumnos.append(AlumnoEnHorarioOut(
                alumno_id=r.alumno_id,
                nombre=r.alumno.nombre,
                apellido=r.alumno.apellido,
                tipo="reserva",
                estado=r.estado
            ))

    return DashboardHorarioActual(
        horario_id=horario_actual.id,
        hora_inicio=horario_actual.hora_inicio,
        hora_fin=horario_actual.hora_fin,
        nombre=horario_actual.nombre,
        capacidad=horario_actual.capacidad,
        alumnos=alumnos,
        total_alumnos=len(alumnos)
    )


@router.get("/horario/{horario_id}/fecha/{fecha}", response_model=List[AlumnoEnHorarioOut])
def alumnos_en_horario(
    horario_id: int,
    fecha: date,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_profesor_or_admin),
):
    """Obtiene todos los alumnos esperados en un horario para una fecha."""
    horario = db.query(Horario).filter(Horario.id == horario_id).first()
    if not horario:
        raise HTTPException(status_code=404, detail="Horario no encontrado")

    dia_semana = fecha.weekday()

    fijos = (
        db.query(AsignacionFija)
        .options(joinedload(AsignacionFija.alumno))
        .filter(AsignacionFija.horario_id == horario_id, AsignacionFija.dia_semana == dia_semana)
        .all()
    )

    reservas = (
        db.query(Reserva)
        .options(joinedload(Reserva.alumno))
        .filter(Reserva.horario_id == horario_id, Reserva.fecha == fecha, Reserva.estado != "cancelada")
        .all()
    )

    # Bulk load rutinas para todos los alumnos involucrados
    todos_alumno_ids = {f.alumno_id for f in fijos} | {r.alumno_id for r in reservas}
    rutinas_map = {
        r.alumno_id: r.id
        for r in db.query(Rutina.alumno_id, Rutina.id)
        .filter(Rutina.alumno_id.in_(todos_alumno_ids))
        .all()
    }

    alumnos = []
    alumnos_ids: set = set()

    for f in fijos:
        if f.alumno_id not in alumnos_ids:
            alumnos_ids.add(f.alumno_id)
            alumnos.append(AlumnoEnHorarioOut(
                alumno_id=f.alumno_id,
                nombre=f.alumno.nombre,
                apellido=f.alumno.apellido,
                tipo="fijo",
                estado=None,
                asignacion_id=f.id,
                rutina_id=rutinas_map.get(f.alumno_id),
            ))

    for r in reservas:
        if r.alumno_id not in alumnos_ids:
            alumnos_ids.add(r.alumno_id)
            alumnos.append(AlumnoEnHorarioOut(
                alumno_id=r.alumno_id,
                nombre=r.alumno.nombre,
                apellido=r.alumno.apellido,
                tipo="reserva",
                estado=r.estado,
                reserva_id=r.id,
                rutina_id=rutinas_map.get(r.alumno_id),
            ))

    return alumnos
