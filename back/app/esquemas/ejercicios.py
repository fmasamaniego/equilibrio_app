# app/esquemas/ejercicio.py

from pydantic import BaseModel
from typing import Optional

# Propiedades compartidas
class EjercicioBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    grupo_muscular_id: int

# Propiedades para la creación (ya lo tenías)
class EjercicioCreate(EjercicioBase):
    pass

# --- NUEVO ---
# Propiedades para la actualización
class EjercicioUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    grupo_muscular_id: Optional[int] = None

# Propiedades para devolver al cliente (ya lo tenías)
class Ejercicio(EjercicioBase):
    id: int

    class Config:
        from_attributes = True