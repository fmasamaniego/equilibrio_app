from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

from app.modelos.usuarios import Usuario
from app.modelos.ejercicios import Ejercicio
from app.modelos.grupos_musculares import GrupoMuscular
from app.modelos.rutinas import Rutina
