from pydantic import BaseModel
from typing import Optional


class GrupoMuscularBase(BaseModel):
    nombre: str


class GrupoMuscularCreate(GrupoMuscularBase):
    pass


class GrupoMuscularUpdate(BaseModel):
    nombre: Optional[str] = None


class GrupoMuscularOut(GrupoMuscularBase):
    id: int

    class Config:
        from_attributes = True
