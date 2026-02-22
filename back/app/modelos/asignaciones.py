from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.modelos import Base


class AsignacionFija(Base):
    """Asignacion fija semanal de un alumno a un horario."""
    __tablename__ = "asignaciones_fijas"

    id = Column(Integer, primary_key=True, index=True)
    alumno_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    horario_id = Column(Integer, ForeignKey("horarios.id"), nullable=False)
    dia_semana = Column(Integer, nullable=False)  # 0=Lunes, 6=Domingo

    __table_args__ = (
        UniqueConstraint('alumno_id', 'horario_id', 'dia_semana', name='uq_asignacion_unica'),
    )

    alumno = relationship("Usuario", back_populates="asignaciones_fijas")
    horario = relationship("Horario", back_populates="asignaciones_fijas")
