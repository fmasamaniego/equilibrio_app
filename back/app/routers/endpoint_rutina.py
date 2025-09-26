from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.rutinas import Rutina
from app.models.usuarios import Usuario
from app.models.ejercicios import Ejercicio
from app.schemas.rutinas import RutinaCreate, RutinaOut

router = APIRouter(prefix="/rutinas", tags=["Rutinas"])

@router.post("/", response_model=RutinaOut)
def asignar_rutina(rutina: RutinaCreate, db: Session = Depends(get_db)):
    alumno = db.query(Usuario).filter(Usuario.id == rutina.id_alumno).first()
    profesor = db.query(Usuario).filter(Usuario.id == rutina.id_profesor).first()
    ejercicio = db.query(Ejercicio).filter(Ejercicio.id == rutina.id_ejercicio).first()

    if not alumno or alumno.rol != "alumno":
        raise HTTPException(status_code=400, detail="Alumno no válido")
    if not profesor or profesor.rol not in ["profesor", "admin"]:
        raise HTTPException(status_code=400, detail="Profesor no válido")
    if not ejercicio:
        raise HTTPException(status_code=400, detail="Ejercicio no válido")

    nueva_rutina = Rutina(
        id_alumno=rutina.id_alumno,
        id_profesor=rutina.id_profesor,
        id_ejercicio=rutina.id_ejercicio,
        series=rutina.series,
        repeticiones=rutina.repeticiones,
        peso=rutina.peso
    )
    db.add(nueva_rutina)
    db.commit()
    db.refresh(nueva_rutina)
    return nueva_rutina

@router.get("/alumno/{id_alumno}", response_model=list[RutinaOut])
def ver_rutinas_alumno(id_alumno: int, db: Session = Depends(get_db)):
    return db.query(Rutina).filter(Rutina.id_alumno == id_alumno).all()
