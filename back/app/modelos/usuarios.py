from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.modelos import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    rol = Column(String, nullable=False, default="alumno")  # admin, profesor, alumno
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

    # relaciones
    rutinas_asignadas = relationship("Rutina", back_populates="alumno", foreign_keys="Rutina.id_alumno")
    rutinas_creadas = relationship("Rutina", back_populates="profesor", foreign_keys="Rutina.id_profesor")
