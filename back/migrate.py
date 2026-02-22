"""
Migración: agrega columnas email y recibir_notificaciones a la tabla usuarios.
Ejecutar una sola vez: python migrate.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from sqlalchemy import text
from app.db.engine import engine


def migrate():
    alterations = [
        (
            "email",
            "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email VARCHAR UNIQUE",
        ),
        (
            "recibir_notificaciones",
            "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS recibir_notificaciones BOOLEAN NOT NULL DEFAULT FALSE",
        ),
    ]

    with engine.connect() as conn:
        for name, sql in alterations:
            try:
                conn.execute(text(sql))
                print(f"  ok  {name}")
            except Exception as e:
                print(f"  --  {name}: {e}")
        conn.commit()

    print("Migración completada.")


if __name__ == "__main__":
    migrate()
