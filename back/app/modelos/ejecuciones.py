from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from app.modelos import Base


class EjecucionRutina(Base):
    """Represents a single training session where a student performs their routine."""
    __tablename__ = "ejecuciones_rutina"

    id = Column(Integer, primary_key=True, index=True)
    rutina_id = Column(Integer, ForeignKey("rutinas.id"), nullable=False, index=True)
    alumno_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    fecha = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    dia = Column(Integer, nullable=False)  # Which day of the routine was performed
    notas = Column(String, nullable=True)
    completada = Column(Boolean, default=False, nullable=False)

    rutina = relationship("Rutina")
    alumno = relationship("Usuario")
    detalles = relationship("EjecucionEjercicio", back_populates="ejecucion", cascade="all, delete-orphan")


class EjecucionEjercicio(Base):
    """Tracks actual performance for each exercise within a session."""
    __tablename__ = "ejecuciones_ejercicio"

    id = Column(Integer, primary_key=True, index=True)
    ejecucion_id = Column(Integer, ForeignKey("ejecuciones_rutina.id"), nullable=False)
    ejercicio_id = Column(Integer, ForeignKey("ejercicios.id"), nullable=False)
    series_completadas = Column(Integer, nullable=False)
    repeticiones_realizadas = Column(Integer, nullable=False)
    peso_usado = Column(Float, nullable=True)

    ejecucion = relationship("EjecucionRutina", back_populates="detalles")
    ejercicio = relationship("Ejercicio")
