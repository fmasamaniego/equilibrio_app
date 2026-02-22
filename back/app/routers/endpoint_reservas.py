from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.db.engine import get_db
from app.modelos.usuarios import Usuario
from app.modelos.horarios import Horario
from app.modelos.asignaciones import AsignacionFija
from app.modelos.reservas import Reserva
from app.esquemas.reserva import ReservaCreate, ReservaOut, ReservaUpdate, ReservaConDetalles, ReservaCreateAdmin
from app.auth.auth import get_current_user
from app.auth.deps import require_profesor_or_admin
from app.utils.email import send_email

router = APIRouter(prefix="/reservas", tags=["Reservas"])


def _verificar_disponibilidad(db: Session, horario: Horario, fecha: date) -> bool:
    """Verifica si hay capacidad disponible."""
    if horario.capacidad is None:
        return True

    dia_semana = fecha.weekday()

    fijos = db.query(AsignacionFija).filter(
        AsignacionFija.horario_id == horario.id,
        AsignacionFija.dia_semana == dia_semana
    ).count()

    reservas = db.query(Reserva).filter(
        Reserva.horario_id == horario.id,
        Reserva.fecha == fecha,
        Reserva.estado != "cancelada"
    ).count()

    return (fijos + reservas) < horario.capacidad


@router.post("/", response_model=ReservaOut, status_code=status.HTTP_201_CREATED)
def crear_reserva(
    reserva: ReservaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Alumno crea una reserva para si mismo."""
    if current_user.rol != "alumno":
        raise HTTPException(status_code=400, detail="Solo alumnos pueden crear reservas")

    if reserva.fecha < date.today():
        raise HTTPException(status_code=400, detail="No se puede reservar en fechas pasadas")

    horario = db.query(Horario).filter(Horario.id == reserva.horario_id).first()
    if not horario or not horario.activo:
        raise HTTPException(status_code=400, detail="Horario no valido o inactivo")

    existente = db.query(Reserva).filter(
        Reserva.alumno_id == current_user.id,
        Reserva.horario_id == reserva.horario_id,
        Reserva.fecha == reserva.fecha,
        Reserva.estado != "cancelada"
    ).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya tienes una reserva para este horario")

    if not _verificar_disponibilidad(db, horario, reserva.fecha):
        raise HTTPException(status_code=400, detail="No hay cupo disponible para este horario")

    nueva = Reserva(
        alumno_id=current_user.id,
        horario_id=reserva.horario_id,
        fecha=reserva.fecha,
        notas=reserva.notas
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    if current_user.email and current_user.recibir_notificaciones:
        send_email(
            to_email=current_user.email,
            subject="Reserva confirmada — Equilibrio",
            body=(
                f"Hola {current_user.nombre},\n\n"
                f"Tu reserva para el {nueva.fecha} ha sido confirmada.\n"
                f"Horario: {horario.hora_inicio.strftime('%H:%M')} — {horario.hora_fin.strftime('%H:%M')}\n\n"
                f"Equipo Equilibrio"
            ),
        )

    return nueva


@router.post("/admin", response_model=ReservaOut, status_code=status.HTTP_201_CREATED)
def crear_reserva_admin(
    reserva: ReservaCreateAdmin,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_profesor_or_admin),
):
    """Profesor/admin crea reserva para cualquier alumno."""
    alumno = db.query(Usuario).filter(Usuario.id == reserva.alumno_id).first()
    if not alumno or alumno.rol != "alumno":
        raise HTTPException(status_code=400, detail="Alumno no valido")

    horario = db.query(Horario).filter(Horario.id == reserva.horario_id).first()
    if not horario or not horario.activo:
        raise HTTPException(status_code=400, detail="Horario no valido o inactivo")

    existente = db.query(Reserva).filter(
        Reserva.alumno_id == reserva.alumno_id,
        Reserva.horario_id == reserva.horario_id,
        Reserva.fecha == reserva.fecha,
        Reserva.estado != "cancelada"
    ).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe una reserva para este alumno en este horario")

    nueva = Reserva(**reserva.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.get("/mis-reservas", response_model=List[ReservaConDetalles])
def listar_mis_reservas(
    desde: Optional[date] = Query(None),
    hasta: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Alumno ve sus reservas."""
    if current_user.rol != "alumno":
        raise HTTPException(status_code=400, detail="Este endpoint es solo para alumnos")

    query = db.query(Reserva).filter(Reserva.alumno_id == current_user.id)

    if desde:
        query = query.filter(Reserva.fecha >= desde)
    if hasta:
        query = query.filter(Reserva.fecha <= hasta)

    reservas = query.order_by(Reserva.fecha.desc()).all()

    resultado = []
    for r in reservas:
        resultado.append(ReservaConDetalles(
            id=r.id,
            alumno_id=r.alumno_id,
            horario_id=r.horario_id,
            fecha=r.fecha,
            estado=r.estado,
            notas=r.notas,
            creado_en=r.creado_en,
            alumno_nombre=r.alumno.nombre,
            alumno_apellido=r.alumno.apellido,
            horario_inicio=r.horario.hora_inicio.strftime("%H:%M"),
            horario_fin=r.horario.hora_fin.strftime("%H:%M")
        ))

    return resultado


@router.get("/", response_model=List[ReservaConDetalles])
def listar_reservas(
    fecha: Optional[date] = Query(None),
    alumno_id: Optional[int] = Query(None),
    horario_id: Optional[int] = Query(None),
    estado: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_profesor_or_admin),
):
    """Profesor/admin lista todas las reservas con filtros."""
    query = db.query(Reserva)

    if fecha:
        query = query.filter(Reserva.fecha == fecha)
    if alumno_id:
        query = query.filter(Reserva.alumno_id == alumno_id)
    if horario_id:
        query = query.filter(Reserva.horario_id == horario_id)
    if estado:
        query = query.filter(Reserva.estado == estado)

    reservas = query.order_by(Reserva.fecha.desc()).all()

    resultado = []
    for r in reservas:
        resultado.append(ReservaConDetalles(
            id=r.id,
            alumno_id=r.alumno_id,
            horario_id=r.horario_id,
            fecha=r.fecha,
            estado=r.estado,
            notas=r.notas,
            creado_en=r.creado_en,
            alumno_nombre=r.alumno.nombre,
            alumno_apellido=r.alumno.apellido,
            horario_inicio=r.horario.hora_inicio.strftime("%H:%M"),
            horario_fin=r.horario.hora_fin.strftime("%H:%M")
        ))

    return resultado


@router.patch("/{reserva_id}", response_model=ReservaOut)
def actualizar_reserva(
    reserva_id: int,
    reserva_update: ReservaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Actualizar estado o notas de una reserva."""
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    if current_user.rol == "alumno" and reserva.alumno_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta reserva")

    update_data = reserva_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(reserva, key, value)

    db.commit()
    db.refresh(reserva)
    return reserva


@router.delete("/{reserva_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancelar_reserva(
    reserva_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Cancelar una reserva (marca como cancelada, no elimina)."""
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    if current_user.rol == "alumno" and reserva.alumno_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta reserva")

    reserva.estado = "cancelada"
    db.commit()
    return
