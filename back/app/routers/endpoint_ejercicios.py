# app/routers/ejercicio.py

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import esquemas, modelos
from ..auth import get_current_active_user
from ..db.engine import get_db

router = APIRouter(
    prefix="/ejercicios",
    tags=["Ejercicios"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Not found"}},
)

# POST que ya tenías
@router.post("/", response_model=esquemas.Ejercicio, status_code=status.HTTP_201_CREATED)
def crear_ejercicio(ejercicio: esquemas.EjercicioCreate, db: Session = Depends(get_db)):
    # Opcional: Verificar que el grupo muscular existe
    db_grupo = db.query(modelos.GrupoMuscular).filter(modelos.GrupoMuscular.id == ejercicio.grupo_muscular_id).first()
    if not db_grupo:
        raise HTTPException(status_code=400, detail="El grupo muscular especificado no existe")

    nuevo_ejercicio = modelos.Ejercicio(**ejercicio.model_dump())
    db.add(nuevo_ejercicio)
    db.commit()
    db.refresh(nuevo_ejercicio)
    return nuevo_ejercicio

# --- MODIFICADO: GET con filtro ---
@router.get("/", response_model=List[esquemas.Ejercicio])
def listar_ejercicios(
    skip: int = 0, 
    limit: int = 100, 
    grupo_muscular_id: Optional[int] = None, # Parámetro de filtro
    db: Session = Depends(get_db)
):
    query = db.query(modelos.Ejercicio)
    
    if grupo_muscular_id:
        query = query.filter(modelos.Ejercicio.grupo_muscular_id == grupo_muscular_id)
        
    ejercicios = query.offset(skip).limit(limit).all()
    return ejercicios

# --- NUEVO: GET por ID ---
@router.get("/{ejercicio_id}", response_model=esquemas.Ejercicio)
def obtener_ejercicio(ejercicio_id: int, db: Session = Depends(get_db)):
    ejercicio = db.query(modelos.Ejercicio).filter(modelos.Ejercicio.id == ejercicio_id).first()
    if not ejercicio:
        raise HTTPException(status_code=404, detail="Ejercicio no encontrado")
    return ejercicio

# --- NUEVO: PUT ---
@router.put("/{ejercicio_id}", response_model=esquemas.Ejercicio)
def actualizar_ejercicio(ejercicio_id: int, ejercicio_update: esquemas.EjercicioUpdate, db: Session = Depends(get_db)):
    db_ejercicio = db.query(modelos.Ejercicio).filter(modelos.Ejercicio.id == ejercicio_id).first()
    if not db_ejercicio:
        raise HTTPException(status_code=404, detail="Ejercicio no encontrado")

    update_data = ejercicio_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_ejercicio, key, value)
    
    db.commit()
    db.refresh(db_ejercicio)
    return db_ejercicio

# --- NUEVO: DELETE ---
@router.delete("/{ejercicio_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_ejercicio(ejercicio_id: int, db: Session = Depends(get_db)):
    db_ejercicio = db.query(modelos.Ejercicio).filter(modelos.Ejercicio.id == ejercicio_id).first()
    if not db_ejercicio:
        raise HTTPException(status_code=404, detail="Ejercicio no encontrado")
    
    db.delete(db_ejercicio)
    db.commit()
    return