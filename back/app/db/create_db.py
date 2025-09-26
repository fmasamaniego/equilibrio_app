from app.modelos import Base  # esto importa también __init__.py, que debe importar TODO
from app.db.engine import engine
from app import modelos  # ⬅️ este import es clave para que se carguen las tablas


def crear_tablas():
    print("Creando tablas en la base de datos...")
    Base.metadata.create_all(bind=engine)
    print("Tablas creadas exitosamente.")

if __name__ == "__main__":
    crear_tablas()
    print("Base de datos inicializada correctamente.")
