from pydantic import BaseModel
from typing import Optional

class GrupoMuscularBase(BaseModel):
    nombre: str

class GrupoMuscularCreate(GrupoMuscularBase):
    pass

class GrupoMuscularOut(GrupoMuscularBase):
    id: int

    class Config:
        from_attributes = True

class GrupoMuscularUpdate(GrupoMuscularBase):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None

    