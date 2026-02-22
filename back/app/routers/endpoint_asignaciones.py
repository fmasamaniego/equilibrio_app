from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.engine import get_db
from app.modelos.usuarios import Usuario
from app.modelos.horarios import Horario
from app.modelos.asignaciones import AsignacionFija
from app.esquemas.asignacion import (
    AsignacionFijaCreate,
    AsignacionFijaOut,
    AsignacionFijaConDetalles,
    AsignacionFijaBulkCreate
)
from app.auth.auth import get_current_user
from app.auth.deps import require_profesor_or_admin

router = APIRouter(prefix="/asignaciones", tags=["Asignaciones Fijas"])


@router.post("/", response_model=AsignacionFijaOut, status_code=status.HTTP_201_CREATED)
def crear_asignacion(
    asignacion: AsignacionFijaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_profesor_or_admin),
):
    """Asigna un alumno a un horario fijo semanal."""
    alumno = db.query(Usuario).filter(Usuario.id == asignacion.alumno_id).first()
    if not alumno or alumno.rol != "alumno":
        raise HTTPException(status_code=400, detail="Alumno no valido")

    horario = db.query(Horario).filter(Horario.id == asignacion.horario_id).first()
    if not horario or not horario.activo:
        raise HTTPException(status_code=400, detail="Horario no valido o inactivo")

    existente = db.query(AsignacionFija).filter(
        AsignacionFija.alumno_id == asignacion.alumno_id,
        AsignacionFija.horario_id == asignacion.horario_id,
        AsignacionFija.dia_semana == asignacion.dia_semana
    ).first()
    if existente:
        raise HTTPException(status_code=400, detail="Esta asignacion ya existe")

    if horario.capacidad:
        actuales = db.query(AsignacionFija).filter(
            AsignacionFija.horario_id == asignacion.horario_id,
            AsignacionFija.dia_semana == asignacion.dia_semana
        ).count()
        if actuales >= horario.capacidad:
            raise HTTPException(status_code=400, detail="Horario lleno para este dia")

    nueva = AsignacionFija(**asignacion.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.post("/bulk", response_model=List[AsignacionFijaOut], status_code=status.HTTP_201_CREATED)
def crear_asignaciones_bulk(
    datos: AsignacionFijaBulkCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_profesor_or_admin),
):
    """Crea multiples asignaciones para un alumno de una vez."""
    alumno = db.query(Usuario).filter(Usuario.id == datos.alumno_id).first()
    if not alumno or alumno.rol != "alumno":
        raise HTTPException(status_code=400, detail="Alumno no valido")

    nuevas = []
    for asig in datos.asignaciones:
        horario = db.query(Horario).filter(Horario.id == asig.get("horario_id")).first()
        if not horario or not horario.activo:
            continue

        existente = db.query(AsignacionFija).filter(
            AsignacionFija.alumno_id == datos.alumno_id,
            AsignacionFija.horario_id == asig.get("horario_id"),
            AsignacionFija.dia_semana == asig.get("dia_semana")
        ).first()
        if existente:
            continue

        nueva = AsignacionFija(
            alumno_id=datos.alumno_id,
            horario_id=asig.get("horario_id"),
            dia_semana=asig.get("dia_semana")
        )
        db.add(nueva)
        nuevas.append(nueva)

    db.commit()
    for n in nuevas:
        db.refresh(n)
    return nuevas


@router.get("/", response_model=List[AsignacionFijaConDetalles])
def listar_asignaciones(
    alumno_id: Optional[int] = Query(None),
    horario_id: Optional[int] = Query(None),
    dia_semana: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_profesor_or_admin),
):
    """Lista asignaciones con filtros opcionales."""
    query = db.query(AsignacionFija)

    if alumno_id:
        query = query.filter(AsignacionFija.alumno_id == alumno_id)
    if horario_id:
        query = query.filter(AsignacionFija.horario_id == horario_id)
    if dia_semana is not None:
        query = query.filter(AsignacionFija.dia_semana == dia_semana)

    asignaciones = query.all()

    resultado = []
    for a in asignaciones:
        resultado.append(AsignacionFijaConDetalles(
            id=a.id,
            alumno_id=a.alumno_id,
            horario_id=a.horario_id,
            dia_semana=a.dia_semana,
            alumno_nombre=a.alumno.nombre,
            alumno_apellido=a.alumno.apellido,
            horario_inicio=a.horario.hora_inicio.strftime("%H:%M"),
            horario_fin=a.horario.hora_fin.strftime("%H:%M")
        ))

    return resultado


@router.get("/alumno/{alumno_id}", response_model=List[AsignacionFijaConDetalles])
def obtener_asignaciones_alumno(
    alumno_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Obtiene todas las asignaciones de un alumno especifico."""
    if current_user.rol == "alumno" and current_user.id != alumno_id:
        raise HTTPException(status_code=403, detail="No tienes acceso a estas asignaciones")

    asignaciones = db.query(AsignacionFija).filter(AsignacionFija.alumno_id == alumno_id).all()

    resultado = []
    for a in asignaciones:
        resultado.append(AsignacionFijaConDetalles(
            id=a.id,
            alumno_id=a.alumno_id,
            horario_id=a.horario_id,
            dia_semana=a.dia_semana,
            alumno_nombre=a.alumno.nombre,
            alumno_apellido=a.alumno.apellido,
            horario_inicio=a.horario.hora_inicio.strftime("%H:%M"),
            horario_fin=a.horario.hora_fin.strftime("%H:%M")
        ))

    return resultado


@router.delete("/{asignacion_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_asignacion(
    asignacion_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_profesor_or_admin),
):
    asignacion = db.query(AsignacionFija).filter(AsignacionFija.id == asignacion_id).first()
    if not asignacion:
        raise HTTPException(status_code=404, detail="Asignacion no encontrada")
    db.delete(asignacion)
    db.commit()
    return
