from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.modelos.ejercicios import Ejercicio
from app.modelos.grupos_musculares import GrupoMuscular
from app.esquemas.ejercicios import EjercicioBase, EjercicioOut

router = APIRouter(prefix="/ejercicios", tags=["Ejercicios"])

@router.post("/", response_model=EjercicioOut)
def crear_ejercicio(ejercicio: EjercicioCreate, db: Session = Depends(get_db)):
    nuevo_ejercicio = Ejercicio(
        nombre=ejercicio.nombre,
        descripcion=ejercicio.descripcion,
        id_grupo=ejercicio.id_grupo
    )
    db.add(nuevo_ejercicio)
    db.commit()
    db.refresh(nuevo_ejercicio)
    return nuevo_ejercicio

@router.get("/", response_model=List[EjercicioOut])
def listar_ejercicios(grupo: str | None = Query(None), db: Session = Depends(get_db)):
    """
    Lista ejercicios.
    Si se pasa ?grupo=nombre, filtra por grupo muscular.
    """
    query = db.query(Ejercicio)

    if grupo:
        grupo_db = db.query(GrupoMuscular).filter(GrupoMuscular.nombre.ilike(f"%{grupo}%")).first()
        if not grupo_db:
            raise HTTPException(status_code=404, detail="Grupo muscular no encontrado")
        query = query.filter(Ejercicio.grupo_id == grupo_db.id)

    return query.all()