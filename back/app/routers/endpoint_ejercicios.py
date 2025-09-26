from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.modelos.ejercicios import Ejercicio
from app.esquemas.ejercicios import EjercicioCreate, EjercicioOut

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

@router.get("/", response_model=list[EjercicioOut])
def listar_ejercicios(db: Session = Depends(get_db)):
    return db.query(Ejercicio).all()
