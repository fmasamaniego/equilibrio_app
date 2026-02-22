from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.engine import get_db
from app.modelos.usuarios import Usuario
from app.modelos.rutinas import Rutina
from app.modelos.historial_rutinas import HistorialRutina
from app.esquemas.historial_rutina import HistorialRutinaCreate, HistorialRutinaOut
from app.auth.auth import get_current_user
from app.auth.deps import require_profesor_or_admin

router = APIRouter(prefix="/historial", tags=["Historial"])


@router.post("/", response_model=HistorialRutinaOut)
def asignar_rutina(
    historial: HistorialRutinaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_profesor_or_admin),
):
    """Solo profesor/admin pueden asignar rutinas (crear entrada en historial)."""
    rutina = db.query(Rutina).filter(Rutina.id == historial.rutina_id).first()
    if not rutina:
        raise HTTPException(status_code=404, detail="Rutina no encontrada")

    alumno = db.query(Usuario).filter(Usuario.id == historial.alumno_id).first()
    if not alumno or alumno.rol != "alumno":
        raise HTTPException(status_code=400, detail="Alumno no válido")

    registro = HistorialRutina(**historial.model_dump())
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return registro


@router.get("/alumno/{alumno_id}", response_model=List[HistorialRutinaOut])
def obtener_historial(
    alumno_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Alumno ve su propio historial; profesor/admin ve el de cualquiera."""
    if current_user.rol == "alumno" and current_user.id != alumno_id:
        raise HTTPException(status_code=403, detail="Solo puedes ver tu propio historial")

    return db.query(HistorialRutina).filter(HistorialRutina.alumno_id == alumno_id).all()


@router.get("/mi-historial", response_model=List[HistorialRutinaOut])
def obtener_mi_historial(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Atajo para que el alumno vea su propio historial."""
    return db.query(HistorialRutina).filter(HistorialRutina.alumno_id == current_user.id).all()
