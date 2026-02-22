from sqlalchemy.orm import declarative_base

Base = declarative_base()

from app.modelos.usuarios import Usuario
from app.modelos.grupos_musculares import GrupoMuscular
from app.modelos.ejercicios import Ejercicio
from app.modelos.rutinas import Rutina, RutinaEjercicio
from app.modelos.historial_rutinas import HistorialRutina
from app.modelos.ejecuciones import EjecucionRutina, EjecucionEjercicio
from app.modelos.horarios import Horario
from app.modelos.asignaciones import AsignacionFija
from app.modelos.reservas import Reserva
