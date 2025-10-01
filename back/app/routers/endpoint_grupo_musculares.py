from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.engine import get_db
from app.modelos.ejercicios import GrupoMuscular
from app.esquemas.grupo_muscular import GrupoMuscularCreate, GrupoMuscularOut

router = APIRouter()

@router.post("/", response_model=GrupoMuscularOut)
def crear_grupo(grupo: GrupoMuscularCreate, db: Session = Depends(get_db)):
    existente = db.query(GrupoMuscular).filter(GrupoMuscular.nombre == grupo.nombre).first()
    if existente:
        raise HTTPException(status_code=400, detail="El grupo muscular ya existe")
    nuevo = GrupoMuscular(**grupo.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/", response_model=List[GrupoMuscularOut])
def listar_grupos(db: Session = Depends(get_db)):
    return db.query(GrupoMuscular).all()

@router.delete("/{grupo_id}")
def eliminar_grupo(grupo_id: int, db: Session = Depends(get_db)):
    grupo = db.query(GrupoMuscular).filter(GrupoMuscular.id == grupo_id).first()
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo muscular no encontrado")
    db.delete(grupo)
    db.commit()
    return {"detail": "Grupo muscular eliminado"}
