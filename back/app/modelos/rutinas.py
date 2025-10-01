from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship
from app.modelos import Base

class Rutina(Base):
    __tablename__ = "rutinas"

    id = Column(Integer, primary_key=True, index=True)
    alumno_id = Column(Integer, ForeignKey("alumnos.id"))
    nombre = Column(String, nullable=False)

    alumno = relationship("Alumno", back_populates="rutinas")
    ejercicios = relationship("RutinaEjercicio", back_populates="rutina")
    historial = relationship("HistorialRutina", back_populates="rutina")


class RutinaEjercicio(Base):
    __tablename__ = "rutina_ejercicios"

    id = Column(Integer, primary_key=True, index=True)
    rutina_id = Column(Integer, ForeignKey("rutinas.id"))
    ejercicio_id = Column(Integer, ForeignKey("ejercicios.id"))
    repeticiones = Column(Integer, nullable=False)
    peso = Column(Integer, nullable=True)

    # Nuevo campo: día de la rutina
    dia = Column(Integer, nullable=False)  # 1 = Día 1, 2 = Día 2, etc.

    rutina = relationship("Rutina", back_populates="ejercicios")
    ejercicio = relationship("Ejercicio")
