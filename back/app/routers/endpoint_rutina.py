from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, selectinload
from typing import List, Optional

from app.db.engine import get_db
from app.modelos.usuarios import Usuario
from app.modelos.rutinas import Rutina, RutinaEjercicio
from app.modelos.ejercicios import Ejercicio
from app.esquemas.rutina import (
    RutinaCreate,
    RutinaOut,
    RutinaEjercicioOut,
    RutinaDuplicar,
    RutinaAsignarProfesor,
    RutinaAsignarProfesorBulk,
)
from app.auth.auth import get_current_user
from app.auth.deps import require_profesor_or_admin, require_admin

router = APIRouter(prefix="/rutinas", tags=["Rutinas"])


@router.post("/", response_model=RutinaOut, status_code=status.HTTP_201_CREATED)
def crear_rutina(
    rutina: RutinaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_profesor_or_admin),
):
    """Solo profesor o admin pueden crear rutinas. alumno_id es opcional (rutina "plantilla")."""
    if rutina.alumno_id is not None:
        alumno = db.query(Usuario).filter(Usuario.id == rutina.alumno_id).first()
        if not alumno or alumno.rol != "alumno":
            raise HTTPException(status_code=400, detail="Alumno no válido")

    if current_user.rol == "profesor":
        # El profesor no puede atribuirse la rutina a otro: se fuerza al creador real.
        profesor_id = current_user.id
    else:
        profesor_id = None
        if rutina.profesor_id is not None:
            profesor = db.query(Usuario).filter(Usuario.id == rutina.profesor_id).first()
            if not profesor or profesor.rol != "profesor":
                raise HTTPException(status_code=400, detail="Profesor no válido")
            profesor_id = rutina.profesor_id

    for ej in rutina.ejercicios:
        ejercicio = db.query(Ejercicio).filter(Ejercicio.id == ej.ejercicio_id).first()
        if not ejercicio:
            raise HTTPException(
                status_code=400,
                detail=f"Ejercicio con id {ej.ejercicio_id} no existe",
            )

    nueva_rutina = Rutina(nombre=rutina.nombre, alumno_id=rutina.alumno_id, profesor_id=profesor_id)
    db.add(nueva_rutina)
    db.flush()

    for ej in rutina.ejercicios:
        db.add(RutinaEjercicio(
            rutina_id=nueva_rutina.id,
            ejercicio_id=ej.ejercicio_id,
            series=ej.series,
            repeticiones=ej.repeticiones,
            peso=ej.peso,
            dia=ej.dia,
            notas=ej.notas,
        ))

    db.commit()
    db.refresh(nueva_rutina)
    return nueva_rutina


@router.put("/{rutina_id}", response_model=RutinaOut)
def actualizar_rutina(
    rutina_id: int,
    rutina_data: RutinaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_profesor_or_admin),
):
    """Actualiza nombre y reemplaza los ejercicios de la rutina. alumno_id opcional (permite
    dejarla como plantilla o asignarle un alumno). No modifica profesor_id (creador original)."""
    rutina = db.query(Rutina).filter(Rutina.id == rutina_id).first()
    if not rutina:
        raise HTTPException(status_code=404, detail="Rutina no encontrada")

    if rutina_data.alumno_id is not None:
        alumno = db.query(Usuario).filter(Usuario.id == rutina_data.alumno_id).first()
        if not alumno or alumno.rol != "alumno":
            raise HTTPException(status_code=400, detail="Alumno no válido")

    for ej in rutina_data.ejercicios:
        ejercicio = db.query(Ejercicio).filter(Ejercicio.id == ej.ejercicio_id).first()
        if not ejercicio:
            raise HTTPException(
                status_code=400,
                detail=f"Ejercicio con id {ej.ejercicio_id} no existe",
            )

    rutina.nombre = rutina_data.nombre
    rutina.alumno_id = rutina_data.alumno_id

    # Delete existing exercises and replace with new ones
    db.query(RutinaEjercicio).filter(RutinaEjercicio.rutina_id == rutina_id).delete()

    for ej in rutina_data.ejercicios:
        db.add(RutinaEjercicio(
            rutina_id=rutina_id,
            ejercicio_id=ej.ejercicio_id,
            series=ej.series,
            repeticiones=ej.repeticiones,
            peso=ej.peso,
            dia=ej.dia,
            notas=ej.notas,
        ))

    db.commit()
    db.refresh(rutina)
    return rutina


@router.patch("/{rutina_id}/profesor", response_model=RutinaOut)
def asignar_profesor(
    rutina_id: int,
    datos: RutinaAsignarProfesor,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_profesor_or_admin),
):
    """Asigna un profesor a una rutina existente (para rutinas históricas sin dueño).

    Un profesor solo puede reclamar rutinas que todavía no tienen profesor asignado,
    y siempre para sí mismo (el body se ignora). Un admin puede asignar cualquier
    profesor_id válido a cualquier rutina, incluso reasignar una ya asignada.
    """
    rutina = db.query(Rutina).filter(Rutina.id == rutina_id).first()
    if not rutina:
        raise HTTPException(status_code=404, detail="Rutina no encontrada")

    if current_user.rol == "profesor":
        if rutina.profesor_id is not None:
            raise HTTPException(status_code=403, detail="Esta rutina ya tiene un profesor asignado")
        rutina.profesor_id = current_user.id
    else:
        if datos.profesor_id is not None:
            profesor = db.query(Usuario).filter(Usuario.id == datos.profesor_id).first()
            if not profesor or profesor.rol != "profesor":
                raise HTTPException(status_code=400, detail="Profesor no válido")
        rutina.profesor_id = datos.profesor_id

    db.commit()
    db.refresh(rutina)
    return rutina


@router.get("/", response_model=List[RutinaOut])
def listar_rutinas(
    alumno_id: Optional[int] = Query(None, description="Filtrar por alumno"),
    profesor_id: Optional[int] = Query(None, description="Filtrar por profesor creador"),
    sin_profesor: Optional[bool] = Query(None, description="Si es true, solo rutinas sin profesor asignado"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Lista rutinas. Alumnos solo ven las suyas; profesores/admin ven todas (con filtros opcionales)."""
    query = db.query(Rutina).options(
        selectinload(Rutina.ejercicios).selectinload(RutinaEjercicio.ejercicio)
    )

    if current_user.rol == "alumno":
        query = query.filter(Rutina.alumno_id == current_user.id)
    else:
        if alumno_id:
            query = query.filter(Rutina.alumno_id == alumno_id)
        if profesor_id:
            query = query.filter(Rutina.profesor_id == profesor_id)
        if sin_profesor:
            query = query.filter(Rutina.profesor_id.is_(None))

    return query.offset(skip).limit(limit).all()


@router.post("/asignar-profesor-bulk")
def asignar_profesor_bulk(
    datos: RutinaAsignarProfesorBulk,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Asigna (o desasigna, con profesor_id=null) un profesor a varias rutinas de una vez.
    Pensado para poner al día el historial de rutinas creadas antes de que existiera profesor_id."""
    if datos.profesor_id is not None:
        profesor = db.query(Usuario).filter(Usuario.id == datos.profesor_id).first()
        if not profesor or profesor.rol != "profesor":
            raise HTTPException(status_code=400, detail="Profesor no válido")

    if not datos.rutina_ids:
        return {"actualizadas": 0}

    actualizadas = (
        db.query(Rutina)
        .filter(Rutina.id.in_(datos.rutina_ids))
        .update({Rutina.profesor_id: datos.profesor_id}, synchronize_session=False)
    )
    db.commit()
    return {"actualizadas": actualizadas}


@router.get("/{rutina_id}", response_model=RutinaOut)
def obtener_rutina(
    rutina_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    rutina = (
        db.query(Rutina)
        .options(selectinload(Rutina.ejercicios).selectinload(RutinaEjercicio.ejercicio))
        .filter(Rutina.id == rutina_id)
        .first()
    )
    if not rutina:
        raise HTTPException(status_code=404, detail="Rutina no encontrada")

    if current_user.rol == "alumno" and rutina.alumno_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta rutina")

    return rutina


@router.get("/{rutina_id}/dia/{dia}", response_model=List[RutinaEjercicioOut])
def obtener_ejercicios_del_dia(
    rutina_id: int,
    dia: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Obtiene los ejercicios de un día específico de la rutina."""
    rutina = db.query(Rutina).filter(Rutina.id == rutina_id).first()
    if not rutina:
        raise HTTPException(status_code=404, detail="Rutina no encontrada")

    if current_user.rol == "alumno" and rutina.alumno_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta rutina")

    ejercicios = (
        db.query(RutinaEjercicio)
        .filter(RutinaEjercicio.rutina_id == rutina_id, RutinaEjercicio.dia == dia)
        .all()
    )
    return ejercicios


@router.get("/mi-rutina/hoy", response_model=RutinaOut)
def obtener_mi_rutina(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Obtiene la rutina activa del alumno actual (la más reciente)."""
    if current_user.rol != "alumno":
        raise HTTPException(status_code=400, detail="Este endpoint es solo para alumnos")

    rutina = (
        db.query(Rutina)
        .options(selectinload(Rutina.ejercicios).selectinload(RutinaEjercicio.ejercicio))
        .filter(Rutina.alumno_id == current_user.id)
        .order_by(Rutina.id.desc())
        .first()
    )
    if not rutina:
        raise HTTPException(status_code=404, detail="No tienes una rutina asignada")
    return rutina


@router.post("/{rutina_id}/duplicar", response_model=RutinaOut, status_code=status.HTTP_201_CREATED)
def duplicar_rutina(
    rutina_id: int,
    datos: RutinaDuplicar,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_profesor_or_admin),
):
    """Duplica una rutina existente para otro alumno (o el mismo)."""
    rutina_original = db.query(Rutina).filter(Rutina.id == rutina_id).first()
    if not rutina_original:
        raise HTTPException(status_code=404, detail="Rutina no encontrada")

    alumno = db.query(Usuario).filter(Usuario.id == datos.alumno_id).first()
    if not alumno or alumno.rol != "alumno":
        raise HTTPException(status_code=400, detail="Alumno no válido")

    nombre = datos.nombre or f"{rutina_original.nombre} (copia)"

    # El profesor que duplica queda como creador de la copia; si duplica un admin,
    # se conserva la atribución original.
    profesor_id = current_user.id if current_user.rol == "profesor" else rutina_original.profesor_id

    nueva_rutina = Rutina(nombre=nombre, alumno_id=datos.alumno_id, profesor_id=profesor_id)
    db.add(nueva_rutina)
    db.flush()

    for ej in rutina_original.ejercicios:
        db.add(RutinaEjercicio(
            rutina_id=nueva_rutina.id,
            ejercicio_id=ej.ejercicio_id,
            series=ej.series,
            repeticiones=ej.repeticiones,
            peso=ej.peso,
            dia=ej.dia,
            notas=ej.notas,
        ))

    db.commit()
    db.refresh(nueva_rutina)
    return nueva_rutina


@router.delete("/{rutina_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_rutina(
    rutina_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_profesor_or_admin),
):
    rutina = db.query(Rutina).filter(Rutina.id == rutina_id).first()
    if not rutina:
        raise HTTPException(status_code=404, detail="Rutina no encontrada")
    db.delete(rutina)
    db.commit()
    return
