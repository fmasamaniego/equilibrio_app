from app.esquemas.usuario import UsuarioBase, UsuarioCreate, UsuarioUpdate, UsuarioOut
from app.esquemas.grupo_muscular import GrupoMuscularBase, GrupoMuscularCreate, GrupoMuscularUpdate, GrupoMuscularOut
from app.esquemas.ejercicios import EjercicioBase, EjercicioCreate, EjercicioUpdate, EjercicioOut
from app.esquemas.rutina import (
    RutinaEjercicioBase, RutinaEjercicioCreate, RutinaEjercicioOut,
    RutinaBase, RutinaCreate, RutinaOut,
)
from app.esquemas.historial_rutina import HistorialRutinaBase, HistorialRutinaCreate, HistorialRutinaOut
from app.esquemas.ejecucion import (
    EjecucionEjercicioCreate, EjecucionEjercicioOut,
    EjecucionRutinaCreate, EjecucionRutinaOut,
    ProgresoEjercicioOut, ProgresoResumenOut,
)
