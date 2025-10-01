from pydantic import BaseModel

class GrupoMuscularBase(BaseModel):
    nombre: str

class GrupoMuscularOut(GrupoMuscularBase):
    id: int
    class Config:
        orm_mode = True

class EjercicioBase(BaseModel):
    nombre: str
    descripcion: str | None = None
    grupo_id: int

class EjercicioOut(EjercicioBase):
    id: int
    grupo: GrupoMuscularOut
    class Config:
        orm_mode = True
