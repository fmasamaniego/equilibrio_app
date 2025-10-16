from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List 

from app.db.engine import get_db
from app.modelos.historial_rutinas import HistorialRutina
from app.esquemas.historial_rutina import HistorialRutinaCreate, HistorialRutinaOut

router = APIRouter()

@router.post("/", response_model=HistorialRutinaOut)
def asignar_rutina(historial: HistorialRutinaCreate, db: Session = Depends(get_db)):
    registro = HistorialRutina(**historial.dict())
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return registro

@router.get("/alumno/{alumno_id}", response_model=List[HistorialRutinaOut])
def obtener_historial(alumno_id: int, db: Session = Depends(get_db)):
    historial = db.query(HistorialRutina).filter(HistorialRutina.alumno_id == alumno_id).all()
    if not historial:
        raise HTTPException(status_code=404, detail="No se encontró historial para este alumno")
    return historial
