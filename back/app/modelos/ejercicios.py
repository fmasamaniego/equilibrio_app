from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.modelos import Base


class Ejercicio(Base):
    __tablename__ = "ejercicios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    descripcion = Column(String, nullable=True)
    grupo_muscular_id = Column(Integer, ForeignKey("grupos_musculares.id"))

    grupo = relationship("GrupoMuscular", back_populates="ejercicios")
