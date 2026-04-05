"""
Script para agregar índices a la base de datos existente.
Ejecutar una sola vez: python add_indexes.py
Los índices son idempotentes (IF NOT EXISTS).
"""
from app.db.engine import engine
from sqlalchemy import text

INDEXES = [
    "CREATE INDEX IF NOT EXISTS ix_rutinas_alumno_id ON rutinas (alumno_id)",
    "CREATE INDEX IF NOT EXISTS ix_rutina_ejercicios_rutina_id ON rutina_ejercicios (rutina_id)",
    "CREATE INDEX IF NOT EXISTS ix_ejecuciones_rutina_alumno_id ON ejecuciones_rutina (alumno_id)",
    "CREATE INDEX IF NOT EXISTS ix_ejecuciones_rutina_rutina_id ON ejecuciones_rutina (rutina_id)",
    "CREATE INDEX IF NOT EXISTS ix_ejecuciones_rutina_fecha ON ejecuciones_rutina (fecha)",
    "CREATE INDEX IF NOT EXISTS ix_reservas_alumno_id ON reservas (alumno_id)",
    "CREATE INDEX IF NOT EXISTS ix_reservas_horario_id ON reservas (horario_id)",
    "CREATE INDEX IF NOT EXISTS ix_reservas_fecha ON reservas (fecha)",
    "CREATE INDEX IF NOT EXISTS ix_asignaciones_fijas_alumno_id ON asignaciones_fijas (alumno_id)",
    "CREATE INDEX IF NOT EXISTS ix_asignaciones_fijas_horario_id ON asignaciones_fijas (horario_id)",
    # Índice compuesto para queries frecuentes de disponibilidad
    "CREATE INDEX IF NOT EXISTS ix_asignaciones_fijas_horario_dia ON asignaciones_fijas (horario_id, dia_semana)",
    "CREATE INDEX IF NOT EXISTS ix_reservas_horario_fecha ON reservas (horario_id, fecha)",
]

if __name__ == "__main__":
    with engine.connect() as conn:
        for sql in INDEXES:
            print(f"Ejecutando: {sql}")
            conn.execute(text(sql))
        conn.commit()
    print("Índices creados exitosamente.")
