from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.engine import get_db
from app.modelos.grupos_musculares import GrupoMuscular
from app.esquemas.grupo_muscular import GrupoMuscularCreate, GrupoMuscularUpdate, GrupoMuscularOut
from app.auth.auth import get_current_user
from app.auth.deps import require_profesor_or_admin

router = APIRouter(prefix="/grupos-musculares", tags=["Grupos Musculares"])


@router.post("/", response_model=GrupoMuscularOut, status_code=status.HTTP_201_CREATED)
def crear_grupo_muscular(
    grupo: GrupoMuscularCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_profesor_or_admin),
):
    """Solo profesor o admin pueden crear grupos musculares."""
    nuevo_grupo = GrupoMuscular(**grupo.model_dump())
    db.add(nuevo_grupo)
    db.commit()
    db.refresh(nuevo_grupo)
    return nuevo_grupo


@router.get("/", response_model=List[GrupoMuscularOut])
def listar_grupos_musculares(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Cualquier usuario autenticado puede listar grupos musculares."""
    return db.query(GrupoMuscular).offset(skip).limit(limit).all()


@router.get("/{grupo_id}", response_model=GrupoMuscularOut)
def obtener_grupo_muscular(
    grupo_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    grupo = db.query(GrupoMuscular).filter(GrupoMuscular.id == grupo_id).first()
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo muscular no encontrado")
    return grupo


@router.put("/{grupo_id}", response_model=GrupoMuscularOut)
def actualizar_grupo_muscular(
    grupo_id: int,
    grupo_update: GrupoMuscularUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_profesor_or_admin),
):
    """Solo profesor o admin pueden actualizar grupos musculares."""
    db_grupo = db.query(GrupoMuscular).filter(GrupoMuscular.id == grupo_id).first()
    if not db_grupo:
        raise HTTPException(status_code=404, detail="Grupo muscular no encontrado")

    update_data = grupo_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_grupo, key, value)

    db.commit()
    db.refresh(db_grupo)
    return db_grupo


@router.delete("/{grupo_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_grupo_muscular(
    grupo_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_profesor_or_admin),
):
    """Solo profesor o admin pueden eliminar grupos musculares."""
    db_grupo = db.query(GrupoMuscular).filter(GrupoMuscular.id == grupo_id).first()
    if not db_grupo:
        raise HTTPException(status_code=404, detail="Grupo muscular no encontrado")
    db.delete(db_grupo)
    db.commit()
    return
