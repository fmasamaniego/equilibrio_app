from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.modelos import Base

class Rutina(Base):
    __tablename__ = "rutinas"

    id = Column(Integer, primary_key=True, index=True)
    id_alumno = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    id_profesor = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    id_ejercicio = Column(Integer, ForeignKey("ejercicios.id"), nullable=False)
    fecha_asignacion = Column(DateTime, default=datetime.utcnow)
    series = Column(Integer, nullable=False)
    repeticiones = Column(Integer, nullable=False)
    peso = Column(Integer, nullable=True)

    # relaciones
    alumno = relationship("Usuario", foreign_keys=[id_alumno], back_populates="rutinas_asignadas")
    profesor = relationship("Usuario", foreign_keys=[id_profesor], back_populates="rutinas_creadas")
    ejercicio = relationship("Ejercicio", back_populates="rutinas")
