from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.engine import Base


class HistorialRutina(Base):
    __tablename__ = "historial_rutinas"

    id = Column(Integer, primary_key=True, index=True)
    rutina_id = Column(Integer, ForeignKey("rutinas.id"), nullable=False)
    alumno_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fecha_asignacion = Column(DateTime, default=datetime.utcnow)
    notas = Column(String, nullable=True)

    # Relaciones
    rutina = relationship("Rutina", back_populates="historial")
    alumno = relationship("Usuario", back_populates="historial_rutinas")
