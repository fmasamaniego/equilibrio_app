from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.engine import get_db
from app.modelos.ejercicios import Ejercicio
from app.modelos.grupos_musculares import GrupoMuscular
from app.esquemas.ejercicios import EjercicioCreate, EjercicioUpdate, EjercicioOut
from app.auth.auth import get_current_user
from app.auth.deps import require_profesor_or_admin

router = APIRouter(prefix="/ejercicios", tags=["Ejercicios"])


@router.post("/", response_model=EjercicioOut, status_code=status.HTTP_201_CREATED)
def crear_ejercicio(
    ejercicio: EjercicioCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_profesor_or_admin),
):
    """Solo profesor o admin pueden crear ejercicios."""
    db_grupo = db.query(GrupoMuscular).filter(GrupoMuscular.id == ejercicio.grupo_muscular_id).first()
    if not db_grupo:
        raise HTTPException(status_code=400, detail="El grupo muscular especificado no existe")

    nuevo_ejercicio = Ejercicio(**ejercicio.model_dump())
    db.add(nuevo_ejercicio)
    db.commit()
    db.refresh(nuevo_ejercicio)
    return nuevo_ejercicio


@router.get("/", response_model=List[EjercicioOut])
def listar_ejercicios(
    skip: int = 0,
    limit: int = 100,
    grupo_muscular_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Cualquier usuario autenticado puede listar ejercicios."""
    query = db.query(Ejercicio)
    if grupo_muscular_id:
        query = query.filter(Ejercicio.grupo_muscular_id == grupo_muscular_id)
    return query.offset(skip).limit(limit).all()


@router.get("/{ejercicio_id}", response_model=EjercicioOut)
def obtener_ejercicio(
    ejercicio_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    ejercicio = db.query(Ejercicio).filter(Ejercicio.id == ejercicio_id).first()
    if not ejercicio:
        raise HTTPException(status_code=404, detail="Ejercicio no encontrado")
    return ejercicio


@router.put("/{ejercicio_id}", response_model=EjercicioOut)
def actualizar_ejercicio(
    ejercicio_id: int,
    ejercicio_update: EjercicioUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_profesor_or_admin),
):
    """Solo profesor o admin pueden actualizar ejercicios."""
    db_ejercicio = db.query(Ejercicio).filter(Ejercicio.id == ejercicio_id).first()
    if not db_ejercicio:
        raise HTTPException(status_code=404, detail="Ejercicio no encontrado")

    update_data = ejercicio_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_ejercicio, key, value)

    db.commit()
    db.refresh(db_ejercicio)
    return db_ejercicio


@router.delete("/{ejercicio_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_ejercicio(
    ejercicio_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_profesor_or_admin),
):
    """Solo profesor o admin pueden eliminar ejercicios."""
    db_ejercicio = db.query(Ejercicio).filter(Ejercicio.id == ejercicio_id).first()
    if not db_ejercicio:
        raise HTTPException(status_code=404, detail="Ejercicio no encontrado")
    db.delete(db_ejercicio)
    db.commit()
    return
