"""
Crea el usuario administrador inicial en la base de datos.
Ejecutar: python seed_admin.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from sqlalchemy.orm import Session
from app.db.engine import engine
from app.modelos.usuarios import Usuario
from app.auth.auth import get_password_hash


def seed():
    with Session(engine) as db:
        existente = db.query(Usuario).filter(Usuario.usuario == "Adminequilibrio").first()
        if existente:
            print("El administrador ya existe.")
            return

        admin = Usuario(
            usuario="Adminequilibrio",
            nombre="Admin",
            apellido="Equilibrio",
            password_hash=get_password_hash("equilibrioparana2026"),
            rol="admin",
            activo=True,
        )
        db.add(admin)
        db.commit()
        print("Administrador creado exitosamente.")
        print("  Alias:      Adminequilibrio")
        print("  Contraseña: equilibrioparana2026")


if __name__ == "__main__":
    seed()
