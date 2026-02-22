from sqlalchemy import Column, Integer, ForeignKey, Date, String, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.modelos import Base


class Reserva(Base):
    """Reserva variable de un alumno para una fecha especifica."""
    __tablename__ = "reservas"

    id = Column(Integer, primary_key=True, index=True)
    alumno_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    horario_id = Column(Integer, ForeignKey("horarios.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    estado = Column(String(20), default="confirmada", nullable=False)
    notas = Column(String, nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('alumno_id', 'horario_id', 'fecha', name='uq_reserva_unica'),
    )

    alumno = relationship("Usuario", back_populates="reservas")
    horario = relationship("Horario", back_populates="reservas")
