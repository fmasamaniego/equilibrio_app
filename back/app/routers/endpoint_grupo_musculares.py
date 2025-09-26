from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.modelos.grupos_musculares import GrupoMuscular
from app.esquemas.grupo_muscular import GrupoMuscularCreate, GrupoMuscularOut

router = APIRouter(prefix="/grupos", tags=["Grupos Musculares"])

@router.post("/", response_model=GrupoMuscularOut)
def crear_grupo(grupo: GrupoMuscularCreate, db: Session = Depends(get_db)):
    db_grupo = db.query(GrupoMuscular).filter(GrupoMuscular.nombre == grupo.nombre).first()
    if db_grupo:
        raise HTTPException(status_code=400, detail="El grupo muscular ya existe")

    nuevo_grupo = GrupoMuscular(nombre=grupo.nombre)
    db.add(nuevo_grupo)
    db.commit()
    db.refresh(nuevo_grupo)
    return nuevo_grupo

@router.get("/", response_model=list[GrupoMuscularOut])
def listar_grupos(db: Session = Depends(get_db)):
    return db.query(GrupoMuscular).all()
