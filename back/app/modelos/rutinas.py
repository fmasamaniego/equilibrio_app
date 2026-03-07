from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship
from app.modelos import Base


class Rutina(Base):
    __tablename__ = "rutinas"

    id = Column(Integer, primary_key=True, index=True)
    alumno_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    nombre = Column(String, nullable=False)

    alumno = relationship("Usuario", back_populates="rutinas_asignadas")
    ejercicios = relationship("RutinaEjercicio", back_populates="rutina", cascade="all, delete-orphan")
    historial = relationship("HistorialRutina", back_populates="rutina", cascade="all, delete-orphan")


class RutinaEjercicio(Base):
    __tablename__ = "rutina_ejercicios"

    id = Column(Integer, primary_key=True, index=True)
    rutina_id = Column(Integer, ForeignKey("rutinas.id"), nullable=False)
    ejercicio_id = Column(Integer, ForeignKey("ejercicios.id"), nullable=False)
    series = Column(Integer, nullable=False, server_default='3')
    repeticiones = Column(Integer, nullable=False)
    peso = Column(Integer, nullable=True)
    dia = Column(Integer, nullable=False)  # 1 = Día 1, 2 = Día 2, etc.
    notas = Column(String, nullable=True)

    rutina = relationship("Rutina", back_populates="ejercicios")
    ejercicio = relationship("Ejercicio")

    @property
    def ejercicio_nombre(self):
        return self.ejercicio.nombre if self.ejercicio else None
