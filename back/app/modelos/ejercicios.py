from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.modelos import Base

class Ejercicio(Base):
    __tablename__ = "ejercicios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    descripcion = Column(String, nullable=True)
    id_grupo = Column(Integer, ForeignKey("grupos_musculares.id"))

    # relación
    grupo = relationship("GrupoMuscular", back_populates="ejercicios")
    rutinas = relationship("Rutina", back_populates="ejercicio")
