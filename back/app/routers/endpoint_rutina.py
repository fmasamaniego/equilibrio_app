from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.engine import get_db
from app.modelos.usuarios import Usuario
from app.modelos.rutinas import Rutina, RutinaEjercicio
from app.modelos.ejercicios import Ejercicio
from app.esquemas.rutina import RutinaCreate, RutinaOut, RutinaEjercicioOut, RutinaDuplicar
from app.auth.auth import get_current_user
from app.auth.deps import require_profesor_or_admin

router = APIRouter(prefix="/rutinas", tags=["Rutinas"])


@router.post("/", response_model=RutinaOut, status_code=status.HTTP_201_CREATED)
def crear_rutina(
    rutina: RutinaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_profesor_or_admin),
):
    """Solo profesor o admin pueden crear rutinas."""
    alumno = db.query(Usuario).filter(Usuario.id == rutina.alumno_id).first()
    if not alumno or alumno.rol != "alumno":
        raise HTTPException(status_code=400, detail="Alumno no válido")

    for ej in rutina.ejercicios:
        ejercicio = db.query(Ejercicio).filter(Ejercicio.id == ej.ejercicio_id).first()
        if not ejercicio:
            raise HTTPException(
                status_code=400,
                detail=f"Ejercicio con id {ej.ejercicio_id} no existe",
            )

    nueva_rutina = Rutina(nombre=rutina.nombre, alumno_id=rutina.alumno_id)
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
    """Actualiza nombre y reemplaza los ejercicios de la rutina."""
    rutina = db.query(Rutina).filter(Rutina.id == rutina_id).first()
    if not rutina:
        raise HTTPException(status_code=404, detail="Rutina no encontrada")

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


@router.get("/", response_model=List[RutinaOut])
def listar_rutinas(
    alumno_id: Optional[int] = Query(None, description="Filtrar por alumno"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Lista rutinas. Alumnos solo ven las suyas; profesores/admin ven todas."""
    query = db.query(Rutina)

    if current_user.rol == "alumno":
        query = query.filter(Rutina.alumno_id == current_user.id)
    elif alumno_id:
        query = query.filter(Rutina.alumno_id == alumno_id)

    return query.offset(skip).limit(limit).all()


@router.get("/{rutina_id}", response_model=RutinaOut)
def obtener_rutina(
    rutina_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    rutina = db.query(Rutina).filter(Rutina.id == rutina_id).first()
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

    nueva_rutina = Rutina(nombre=nombre, alumno_id=datos.alumno_id)
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
