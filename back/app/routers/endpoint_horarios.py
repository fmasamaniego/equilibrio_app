from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import date, timedelta

from app.db.engine import get_db
from app.modelos.usuarios import Usuario
from app.modelos.horarios import Horario
from app.modelos.asignaciones import AsignacionFija
from app.modelos.reservas import Reserva
from app.esquemas.horario import HorarioCreate, HorarioOut, HorarioUpdate, HorarioConDisponibilidad, DisponibilidadSemanal
from app.auth.auth import get_current_user
from app.auth.deps import require_admin

router = APIRouter(prefix="/horarios", tags=["Horarios"])


@router.post("/", response_model=HorarioOut, status_code=status.HTTP_201_CREATED)
def crear_horario(
    horario: HorarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Solo admin puede crear horarios."""
    nuevo = Horario(**horario.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=List[HorarioOut])
def listar_horarios(
    activo: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Listar todos los horarios."""
    query = db.query(Horario)
    if activo is not None:
        query = query.filter(Horario.activo == activo)
    return query.order_by(Horario.hora_inicio).all()


@router.get("/disponibilidad", response_model=List[HorarioConDisponibilidad])
def obtener_disponibilidad(
    fecha: date = Query(..., description="Fecha a consultar"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Obtener horarios con disponibilidad para una fecha."""
    dia_semana = fecha.weekday()

    horarios = db.query(Horario).filter(Horario.activo == True).order_by(Horario.hora_inicio).all()
    horario_ids = [h.id for h in horarios]

    # Bulk count asignaciones fijas para todos los horarios del día
    fijos_counts = dict(
        db.query(AsignacionFija.horario_id, func.count(AsignacionFija.id))
        .filter(AsignacionFija.horario_id.in_(horario_ids), AsignacionFija.dia_semana == dia_semana)
        .group_by(AsignacionFija.horario_id)
        .all()
    )

    # Bulk count reservas para todos los horarios de la fecha
    reservas_counts = dict(
        db.query(Reserva.horario_id, func.count(Reserva.id))
        .filter(Reserva.horario_id.in_(horario_ids), Reserva.fecha == fecha, Reserva.estado != "cancelada")
        .group_by(Reserva.horario_id)
        .all()
    )

    resultado = []
    for h in horarios:
        dias = h.dias_activos if h.dias_activos is not None else [0, 1, 2, 3, 4, 5]
        if dia_semana not in dias:
            continue

        ocupados = fijos_counts.get(h.id, 0) + reservas_counts.get(h.id, 0)
        disponibles = None if h.capacidad is None else max(0, h.capacidad - ocupados)

        resultado.append(HorarioConDisponibilidad(
            id=h.id,
            hora_inicio=h.hora_inicio,
            hora_fin=h.hora_fin,
            nombre=h.nombre,
            capacidad=h.capacidad,
            activo=h.activo,
            dias_activos=dias,
            ocupados=ocupados,
            disponibles=disponibles,
        ))

    return resultado


@router.get("/disponibilidad-semanal", response_model=List[DisponibilidadSemanal])
def obtener_disponibilidad_semanal(
    fecha_inicio: date = Query(..., description="Lunes de la semana"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Obtener disponibilidad de todos los horarios para una semana (Lun-Sab)."""
    horarios = db.query(Horario).filter(Horario.activo == True).order_by(Horario.hora_inicio).all()
    horario_ids = [h.id for h in horarios]

    fecha_fin = fecha_inicio + timedelta(days=5)

    # Bulk count asignaciones fijas para toda la semana (agrupado por horario y día)
    fijos_por_dia = {}
    for horario_id, dia, count in (
        db.query(AsignacionFija.horario_id, AsignacionFija.dia_semana, func.count(AsignacionFija.id))
        .filter(AsignacionFija.horario_id.in_(horario_ids), AsignacionFija.dia_semana.in_(range(6)))
        .group_by(AsignacionFija.horario_id, AsignacionFija.dia_semana)
        .all()
    ):
        fijos_por_dia[(horario_id, dia)] = count

    # Bulk count reservas para toda la semana (agrupado por horario y fecha)
    reservas_por_fecha = {}
    for horario_id, fecha_r, count in (
        db.query(Reserva.horario_id, Reserva.fecha, func.count(Reserva.id))
        .filter(
            Reserva.horario_id.in_(horario_ids),
            Reserva.fecha >= fecha_inicio,
            Reserva.fecha <= fecha_fin,
            Reserva.estado != "cancelada",
        )
        .group_by(Reserva.horario_id, Reserva.fecha)
        .all()
    ):
        reservas_por_fecha[(horario_id, fecha_r)] = count

    resultado = []
    for i in range(6):  # Lun a Sab
        fecha = fecha_inicio + timedelta(days=i)
        dia_semana = fecha.weekday()

        horarios_dia = []
        for h in horarios:
            dias = h.dias_activos if h.dias_activos is not None else [0, 1, 2, 3, 4, 5]
            if dia_semana not in dias:
                continue

            ocupados = (
                fijos_por_dia.get((h.id, dia_semana), 0)
                + reservas_por_fecha.get((h.id, fecha), 0)
            )
            disponibles = None if h.capacidad is None else max(0, h.capacidad - ocupados)

            horarios_dia.append(HorarioConDisponibilidad(
                id=h.id,
                hora_inicio=h.hora_inicio,
                hora_fin=h.hora_fin,
                nombre=h.nombre,
                capacidad=h.capacidad,
                activo=h.activo,
                dias_activos=dias,
                ocupados=ocupados,
                disponibles=disponibles,
            ))

        resultado.append(DisponibilidadSemanal(fecha=fecha, horarios=horarios_dia))

    return resultado


@router.get("/{horario_id}", response_model=HorarioOut)
def obtener_horario(
    horario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    horario = db.query(Horario).filter(Horario.id == horario_id).first()
    if not horario:
        raise HTTPException(status_code=404, detail="Horario no encontrado")
    return horario


@router.put("/{horario_id}", response_model=HorarioOut)
def actualizar_horario(
    horario_id: int,
    horario_update: HorarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Solo admin puede actualizar horarios."""
    horario = db.query(Horario).filter(Horario.id == horario_id).first()
    if not horario:
        raise HTTPException(status_code=404, detail="Horario no encontrado")

    update_data = horario_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(horario, key, value)

    db.commit()
    db.refresh(horario)
    return horario


@router.delete("/{horario_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_horario(
    horario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    horario = db.query(Horario).filter(Horario.id == horario_id).first()
    if not horario:
        raise HTTPException(status_code=404, detail="Horario no encontrado")
    db.delete(horario)
    db.commit()
    return
