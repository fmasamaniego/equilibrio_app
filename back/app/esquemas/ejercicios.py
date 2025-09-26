from pydantic import BaseModel

class EjercicioBase(BaseModel):
    nombre: str
    descripcion: str | None = None
    id_grupo: int

class EjercicioCreate(EjercicioBase):
    pass

class EjercicioOut(EjercicioBase):
    id: int

    class Config:
        orm_mode = True
