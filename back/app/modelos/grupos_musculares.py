from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.modelos import Base


class GrupoMuscular(Base):
    __tablename__ = "grupos_musculares"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, nullable=False)

    ejercicios = relationship("Ejercicio", back_populates="grupo")
