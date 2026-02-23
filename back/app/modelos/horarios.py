from sqlalchemy import Column, Integer, String, Time, Boolean, JSON
from sqlalchemy.orm import relationship
from app.modelos import Base


class Horario(Base):
    """Representa un turno/slot horario del gimnasio."""
    __tablename__ = "horarios"

    id = Column(Integer, primary_key=True, index=True)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    nombre = Column(String(100), nullable=True)
    capacidad = Column(Integer, nullable=True, default=None)
    activo = Column(Boolean, default=True, nullable=False)
    # Días en que aplica este turno: 0=Lun … 5=Sáb (todos por defecto)
    dias_activos = Column(JSON, nullable=False, server_default='[0,1,2,3,4,5]')

    # Relationships
    asignaciones_fijas = relationship("AsignacionFija", back_populates="horario", cascade="all, delete-orphan")
    reservas = relationship("Reserva", back_populates="horario", cascade="all, delete-orphan")
