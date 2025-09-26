from pydantic import BaseModel

class GrupoMuscularBase(BaseModel):
    nombre: str

class GrupoMuscularCreate(GrupoMuscularBase):
    pass

class GrupoMuscularOut(GrupoMuscularBase):
    id: int

    class Config:
        orm_mode = True
