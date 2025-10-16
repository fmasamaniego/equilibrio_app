# app/routers/grupo_muscular.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import esquemas, modelos
from ..auth import get_current_active_user
from ..db.engine import get_db

router = APIRouter(
    prefix="/grupos-musculares",
    tags=["Grupos Musculares"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Not found"}},
)

# POST y GET (list) que ya tenías
@router.post("/", response_model=esquemas.GrupoMuscular, status_code=status.HTTP_201_CREATED)
def crear_grupo_muscular(grupo: esquemas.GrupoMuscularCreate, db: Session = Depends(get_db)):
    nuevo_grupo = modelos.GrupoMuscular(**grupo.model_dump())
    db.add(nuevo_grupo)
    db.commit()
    db.refresh(nuevo_grupo)
    return nuevo_grupo

@router.get("/", response_model=List[esquemas.GrupoMuscular])
def listar_grupos_musculares(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    grupos = db.query(modelos.GrupoMuscular).offset(skip).limit(limit).all()
    return grupos

# --- NUEVO: GET por ID ---
@router.get("/{grupo_id}", response_model=esquemas.GrupoMuscular)
def obtener_grupo_muscular(grupo_id: int, db: Session = Depends(get_db)):
    grupo = db.query(modelos.GrupoMuscular).filter(modelos.GrupoMuscular.id == grupo_id).first()
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo muscular no encontrado")
    return grupo

# --- NUEVO: PUT ---
@router.put("/{grupo_id}", response_model=esquemas.GrupoMuscular)
def actualizar_grupo_muscular(grupo_id: int, grupo_update: esquemas.GrupoMuscularUpdate, db: Session = Depends(get_db)):
    db_grupo = db.query(modelos.GrupoMuscular).filter(modelos.GrupoMuscular.id == grupo_id).first()
    if not db_grupo:
        raise HTTPException(status_code=404, detail="Grupo muscular no encontrado")

    update_data = grupo_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_grupo, key, value)
    
    db.commit()
    db.refresh(db_grupo)
    return db_grupo

# --- NUEVO: DELETE ---
@router.delete("/{grupo_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_grupo_muscular(grupo_id: int, db: Session = Depends(get_db)):
    db_grupo = db.query(modelos.GrupoMuscular).filter(modelos.GrupoMuscular.id == grupo_id).first()
    if not db_grupo:
        raise HTTPException(status_code=404, detail="Grupo muscular no encontrado")
    
    # Nota: Si intentas borrar un grupo que tiene ejercicios asociados,
    # PostgreSQL dará un error de "foreign key constraint".
    # Deberías manejar esto en tu lógica (ej: impedir borrar si tiene ejercicios).
    db.delete(db_grupo)
    db.commit()
    return