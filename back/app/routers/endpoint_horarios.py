from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
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

    resultado = []
    for h in horarios:
        fijos = db.query(AsignacionFija).filter(
            AsignacionFija.horario_id == h.id,
            AsignacionFija.dia_semana == dia_semana
        ).count()

        reservas = db.query(Reserva).filter(
            Reserva.horario_id == h.id,
            Reserva.fecha == fecha,
            Reserva.estado != "cancelada"
        ).count()

        ocupados = fijos + reservas
        disponibles = None if h.capacidad is None else max(0, h.capacidad - ocupados)

        resultado.append(HorarioConDisponibilidad(
            id=h.id,
            hora_inicio=h.hora_inicio,
            hora_fin=h.hora_fin,
            nombre=h.nombre,
            capacidad=h.capacidad,
            activo=h.activo,
            ocupados=ocupados,
            disponibles=disponibles
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

    resultado = []
    for i in range(6):  # Lun a Sab
        fecha = fecha_inicio + timedelta(days=i)
        dia_semana = fecha.weekday()

        horarios_dia = []
        for h in horarios:
            fijos = db.query(AsignacionFija).filter(
                AsignacionFija.horario_id == h.id,
                AsignacionFija.dia_semana == dia_semana
            ).count()

            reservas = db.query(Reserva).filter(
                Reserva.horario_id == h.id,
                Reserva.fecha == fecha,
                Reserva.estado != "cancelada"
            ).count()

            ocupados = fijos + reservas
            disponibles = None if h.capacidad is None else max(0, h.capacidad - ocupados)

            horarios_dia.append(HorarioConDisponibilidad(
                id=h.id,
                hora_inicio=h.hora_inicio,
                hora_fin=h.hora_fin,
                nombre=h.nombre,
                capacidad=h.capacidad,
                activo=h.activo,
                ocupados=ocupados,
                disponibles=disponibles
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
