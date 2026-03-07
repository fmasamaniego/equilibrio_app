from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.engine import get_db
from app.modelos.usuarios import Usuario
from app.modelos.rutinas import Rutina
from app.modelos.ejercicios import Ejercicio
from app.modelos.ejecuciones import EjecucionRutina, EjecucionEjercicio
from app.esquemas.ejecucion import (
    EjecucionRutinaCreate,
    EjecucionRutinaOut,
    ProgresoEjercicioOut,
    ProgresoResumenOut,
    ActividadAlumnoOut,
)
from app.auth.auth import get_current_user
from app.auth.deps import require_profesor_or_admin

router = APIRouter(prefix="/ejecuciones", tags=["Ejecuciones"])


@router.post("/", response_model=EjecucionRutinaOut, status_code=status.HTTP_201_CREATED)
def registrar_ejecucion(
    ejecucion: EjecucionRutinaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Registra una sesión de entrenamiento. El alumno registra su propia ejecución."""
    if current_user.rol != "alumno":
        raise HTTPException(status_code=400, detail="Solo alumnos pueden registrar ejecuciones")

    rutina = db.query(Rutina).filter(Rutina.id == ejecucion.rutina_id).first()
    if not rutina:
        raise HTTPException(status_code=404, detail="Rutina no encontrada")
    if rutina.alumno_id != current_user.id:
        raise HTTPException(status_code=403, detail="Esta rutina no te pertenece")

    for det in ejecucion.detalles:
        ejercicio = db.query(Ejercicio).filter(Ejercicio.id == det.ejercicio_id).first()
        if not ejercicio:
            raise HTTPException(
                status_code=400,
                detail=f"Ejercicio con id {det.ejercicio_id} no existe",
            )

    nueva_ejecucion = EjecucionRutina(
        rutina_id=ejecucion.rutina_id,
        alumno_id=current_user.id,
        dia=ejecucion.dia,
        notas=ejecucion.notas,
        completada=ejecucion.completada,
    )
    db.add(nueva_ejecucion)
    db.flush()

    for det in ejecucion.detalles:
        db.add(EjecucionEjercicio(
            ejecucion_id=nueva_ejecucion.id,
            ejercicio_id=det.ejercicio_id,
            series_completadas=det.series_completadas,
            repeticiones_realizadas=det.repeticiones_realizadas,
            peso_usado=det.peso_usado,
        ))

    db.commit()
    db.refresh(nueva_ejecucion)
    return nueva_ejecucion


@router.get("/mis-ejecuciones", response_model=List[EjecucionRutinaOut])
def listar_mis_ejecuciones(
    rutina_id: Optional[int] = Query(None, description="Filtrar por rutina"),
    dias: Optional[int] = Query(None, ge=1, le=365, description="Últimos N días"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Alumno ve su historial de ejecuciones."""
    if current_user.rol != "alumno":
        raise HTTPException(status_code=400, detail="Este endpoint es solo para alumnos")

    query = db.query(EjecucionRutina).filter(EjecucionRutina.alumno_id == current_user.id)

    if rutina_id:
        query = query.filter(EjecucionRutina.rutina_id == rutina_id)
    if dias:
        fecha_desde = datetime.utcnow() - timedelta(days=dias)
        query = query.filter(EjecucionRutina.fecha >= fecha_desde)

    return query.order_by(EjecucionRutina.fecha.desc()).offset(skip).limit(limit).all()


@router.get("/alumno/{alumno_id}", response_model=List[EjecucionRutinaOut])
def listar_ejecuciones_alumno(
    alumno_id: int,
    rutina_id: Optional[int] = Query(None),
    dias: Optional[int] = Query(None, ge=1, le=365, description="Últimos N días"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_profesor_or_admin),
):
    """Profesor/admin ve el historial de ejecuciones de un alumno."""
    query = db.query(EjecucionRutina).filter(EjecucionRutina.alumno_id == alumno_id)

    if rutina_id:
        query = query.filter(EjecucionRutina.rutina_id == rutina_id)
    if dias:
        fecha_desde = datetime.utcnow() - timedelta(days=dias)
        query = query.filter(EjecucionRutina.fecha >= fecha_desde)

    return query.order_by(EjecucionRutina.fecha.desc()).offset(skip).limit(limit).all()


@router.get("/actividad-alumnos", response_model=List[ActividadAlumnoOut])
def actividad_alumnos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_profesor_or_admin),
):
    """Resumen de actividad de todos los alumnos activos."""
    alumnos = db.query(Usuario).filter(Usuario.rol == "alumno", Usuario.activo == True).all()

    ahora = datetime.utcnow()
    inicio_semana = ahora - timedelta(days=7)
    inicio_mes = ahora - timedelta(days=30)

    resultado = []
    for alumno in alumnos:
        ultima = (
            db.query(func.max(EjecucionRutina.fecha))
            .filter(EjecucionRutina.alumno_id == alumno.id)
            .scalar()
        )
        semana = (
            db.query(func.count(EjecucionRutina.id))
            .filter(EjecucionRutina.alumno_id == alumno.id, EjecucionRutina.fecha >= inicio_semana)
            .scalar()
        )
        mes = (
            db.query(func.count(EjecucionRutina.id))
            .filter(EjecucionRutina.alumno_id == alumno.id, EjecucionRutina.fecha >= inicio_mes)
            .scalar()
        )
        resultado.append(ActividadAlumnoOut(
            alumno_id=alumno.id,
            nombre=alumno.nombre,
            apellido=alumno.apellido,
            ultima_sesion=ultima,
            sesiones_semana=semana or 0,
            sesiones_mes=mes or 0,
        ))

    return resultado


@router.get("/{ejecucion_id}", response_model=EjecucionRutinaOut)
def obtener_ejecucion(
    ejecucion_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    ejecucion = db.query(EjecucionRutina).filter(EjecucionRutina.id == ejecucion_id).first()
    if not ejecucion:
        raise HTTPException(status_code=404, detail="Ejecución no encontrada")

    if current_user.rol == "alumno" and ejecucion.alumno_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta ejecución")

    return ejecucion


@router.get("/progreso/mi-progreso", response_model=List[ProgresoResumenOut])
def obtener_mi_progreso(
    dias: int = Query(30, ge=1, le=365, description="Período en días"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Obtiene el progreso del alumno por ejercicio en los últimos N días."""
    if current_user.rol != "alumno":
        raise HTTPException(status_code=400, detail="Este endpoint es solo para alumnos")

    return _calcular_progreso(db, current_user.id, dias)


@router.get("/progreso/alumno/{alumno_id}", response_model=List[ProgresoResumenOut])
def obtener_progreso_alumno(
    alumno_id: int,
    dias: int = Query(30, ge=1, le=365, description="Período en días"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_profesor_or_admin),
):
    """Profesor/admin ve el progreso de un alumno."""
    alumno = db.query(Usuario).filter(Usuario.id == alumno_id).first()
    if not alumno:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    return _calcular_progreso(db, alumno_id, dias)


def _calcular_progreso(db: Session, alumno_id: int, dias: int) -> List[ProgresoResumenOut]:
    fecha_desde = datetime.utcnow() - timedelta(days=dias)

    detalles = (
        db.query(EjecucionEjercicio, EjecucionRutina.fecha, Ejercicio.nombre)
        .join(EjecucionRutina, EjecucionEjercicio.ejecucion_id == EjecucionRutina.id)
        .join(Ejercicio, EjecucionEjercicio.ejercicio_id == Ejercicio.id)
        .filter(
            EjecucionRutina.alumno_id == alumno_id,
            EjecucionRutina.fecha >= fecha_desde,
        )
        .order_by(Ejercicio.id, EjecucionRutina.fecha)
        .all()
    )

    progreso_map = {}
    for detalle, fecha, nombre_ejercicio in detalles:
        ej_id = detalle.ejercicio_id
        if ej_id not in progreso_map:
            progreso_map[ej_id] = {
                "ejercicio_id": ej_id,
                "ejercicio_nombre": nombre_ejercicio,
                "historial": [],
            }
        progreso_map[ej_id]["historial"].append(
            ProgresoEjercicioOut(
                fecha=fecha,
                peso_usado=detalle.peso_usado,
                repeticiones_realizadas=detalle.repeticiones_realizadas,
                series_completadas=detalle.series_completadas,
            )
        )

    return [ProgresoResumenOut(**data) for data in progreso_map.values()]
