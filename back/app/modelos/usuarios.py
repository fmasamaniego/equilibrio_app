from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.modelos import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    usuario = Column(String, nullable=False, unique=True)   # alias para login
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    rol = Column(String, nullable=False, default="alumno")  # admin, profesor, alumno
    observaciones = Column(String, nullable=True)
    activo = Column(Boolean, default=True, nullable=False)
    email = Column(String, nullable=True, unique=True)
    recibir_notificaciones = Column(Boolean, server_default="false", nullable=False)

    rutinas_asignadas = relationship("Rutina", back_populates="alumno")
    historial_rutinas = relationship("HistorialRutina", back_populates="alumno")
    asignaciones_fijas = relationship("AsignacionFija", back_populates="alumno", cascade="all, delete-orphan")
    reservas = relationship("Reserva", back_populates="alumno", cascade="all, delete-orphan")
