"""
Migraciones acumuladas — idempotentes, se pueden correr múltiples veces:
  1. email + recibir_notificaciones
  2. usuario (alias de login): agrega columna, copia nombre→usuario,
     agrega UNIQUE en usuario, quita UNIQUE de nombre.
Ejecutar: python migrate.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from sqlalchemy import text
from app.db.engine import engine


def migrate():
    steps = [
        # ── Migración 1: email y notificaciones ──────────────────────────────
        ("email",
         "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email VARCHAR UNIQUE"),
        ("recibir_notificaciones",
         "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS recibir_notificaciones BOOLEAN NOT NULL DEFAULT FALSE"),

        # ── Migración 2: campo usuario (alias de login) ───────────────────────
        # 1. Añadir columna nullable (para no fallar en filas existentes)
        ("usuario (add column)",
         "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS usuario VARCHAR"),
        # 2. Copiar nombre → usuario en filas donde usuario aún está vacío
        ("usuario (backfill)",
         "UPDATE usuarios SET usuario = nombre WHERE usuario IS NULL"),
        # 3. Añadir índice único en usuario (IF NOT EXISTS para idempotencia)
        ("usuario (unique index)",
         "CREATE UNIQUE INDEX IF NOT EXISTS usuarios_usuario_key ON usuarios (usuario)"),
        # 4. Quitar constraint unique de nombre (nombre pasa a ser solo nombre real)
        ("nombre (drop unique)",
         "ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_nombre_key"),

        # ── Migración 3: dias_activos en horarios ─────────────────────────────
        ("horarios.dias_activos",
         "ALTER TABLE horarios ADD COLUMN IF NOT EXISTS dias_activos JSONB NOT NULL DEFAULT '[0,1,2,3,4,5]'"),
    ]

    with engine.connect() as conn:
        for name, sql in steps:
            try:
                conn.execute(text(sql))
                print(f"  ok  {name}")
            except Exception as e:
                print(f"  --  {name}: {e}")
        conn.commit()

    print("Migración completada.")


if __name__ == "__main__":
    migrate()
