"""
Seed script — Llena la base de datos con datos de prueba.

Uso:
    cd back
    python seed.py

Crea las tablas si no existen y luego inserta:
  - 3 usuarios (admin, profesor, alumno)
  - 6 grupos musculares
  - 12 ejercicios
  - 2 rutinas con ejercicios multi-día
  - Historial y ejecuciones de ejemplo
"""

from datetime import datetime, timedelta

from app.db.engine import engine, SessionLocal
from app.modelos import (
    Base,
    Usuario,
    GrupoMuscular,
    Ejercicio,
    Rutina,
    RutinaEjercicio,
    HistorialRutina,
    EjecucionRutina,
    EjecucionEjercicio,
)
from app.auth.auth import get_password_hash


def seed():
    # Crear todas las tablas
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Si ya hay usuarios, no duplicar
        if db.query(Usuario).first():
            print("La base de datos ya tiene datos. Abortando seed.")
            print("Si quieres reiniciar, elimina las tablas manualmente o borra la DB.")
            return

        # ── Usuarios ──────────────────────────────────────────────
        admin = Usuario(
            nombre="admin",
            apellido="Sistema",
            password_hash=get_password_hash("admin123"),
            rol="admin",
            activo=True,
        )
        profesor = Usuario(
            nombre="carlos",
            apellido="Lopez",
            password_hash=get_password_hash("profesor123"),
            rol="profesor",
            activo=True,
        )
        alumno1 = Usuario(
            nombre="maria",
            apellido="Garcia",
            password_hash=get_password_hash("alumno123"),
            rol="alumno",
            activo=True,
        )
        alumno2 = Usuario(
            nombre="juan",
            apellido="Martinez",
            password_hash=get_password_hash("alumno123"),
            rol="alumno",
            activo=True,
        )
        db.add_all([admin, profesor, alumno1, alumno2])
        db.flush()  # Para obtener los IDs

        print(f"Usuarios creados:")
        print(f"  admin   / admin123    (id={admin.id})")
        print(f"  carlos  / profesor123 (id={profesor.id})")
        print(f"  maria   / alumno123   (id={alumno1.id})")
        print(f"  juan    / alumno123   (id={alumno2.id})")

        # ── Grupos musculares ─────────────────────────────────────
        grupos = {}
        for nombre in ["Pecho", "Espalda", "Piernas", "Hombros", "Brazos", "Core"]:
            g = GrupoMuscular(nombre=nombre)
            db.add(g)
            db.flush()
            grupos[nombre] = g

        print(f"Grupos musculares creados: {list(grupos.keys())}")

        # ── Ejercicios ────────────────────────────────────────────
        ejercicios_data = [
            ("Press banca", "Pecho", "Press plano con barra"),
            ("Aperturas con mancuernas", "Pecho", "Aperturas en banco plano"),
            ("Remo con barra", "Espalda", "Remo inclinado con barra"),
            ("Jalón al pecho", "Espalda", "Polea alta agarre abierto"),
            ("Sentadilla", "Piernas", "Sentadilla libre con barra"),
            ("Prensa de piernas", "Piernas", "Prensa 45 grados"),
            ("Press militar", "Hombros", "Press con barra sentado"),
            ("Elevaciones laterales", "Hombros", "Con mancuernas"),
            ("Curl de bíceps", "Brazos", "Con barra recta"),
            ("Tríceps en polea", "Brazos", "Extensión en polea alta"),
            ("Plancha", "Core", "Isométrico de core"),
            ("Crunch abdominal", "Core", "En banco declinado"),
        ]

        ejercicios = {}
        for nombre, grupo_nombre, desc in ejercicios_data:
            ej = Ejercicio(
                nombre=nombre,
                descripcion=desc,
                grupo_muscular_id=grupos[grupo_nombre].id,
            )
            db.add(ej)
            db.flush()
            ejercicios[nombre] = ej

        print(f"Ejercicios creados: {len(ejercicios)}")

        # ── Rutina para María (3 días) ───────────────────────────
        rutina_maria = Rutina(
            nombre="Full Body Principiante",
            alumno_id=alumno1.id,
        )
        db.add(rutina_maria)
        db.flush()

        rutina_maria_ejercicios = [
            # Día 1 — Pecho + Tríceps + Core
            ("Press banca", 12, 30, 1),
            ("Aperturas con mancuernas", 15, 8, 1),
            ("Tríceps en polea", 12, 15, 1),
            ("Plancha", 30, 0, 1),
            # Día 2 — Espalda + Bíceps
            ("Remo con barra", 12, 25, 2),
            ("Jalón al pecho", 12, 30, 2),
            ("Curl de bíceps", 12, 10, 2),
            ("Crunch abdominal", 15, 0, 2),
            # Día 3 — Piernas + Hombros
            ("Sentadilla", 10, 40, 3),
            ("Prensa de piernas", 12, 60, 3),
            ("Press militar", 10, 15, 3),
            ("Elevaciones laterales", 15, 5, 3),
        ]

        for nombre_ej, reps, peso, dia in rutina_maria_ejercicios:
            db.add(RutinaEjercicio(
                rutina_id=rutina_maria.id,
                ejercicio_id=ejercicios[nombre_ej].id,
                repeticiones=reps,
                peso=peso if peso > 0 else None,
                dia=dia,
            ))

        print(f"Rutina '{rutina_maria.nombre}' creada para maria (3 días, {len(rutina_maria_ejercicios)} ejercicios)")

        # ── Rutina para Juan (2 días) ────────────────────────────
        rutina_juan = Rutina(
            nombre="Tren Superior / Inferior",
            alumno_id=alumno2.id,
        )
        db.add(rutina_juan)
        db.flush()

        rutina_juan_ejercicios = [
            # Día 1 — Tren superior
            ("Press banca", 10, 40, 1),
            ("Remo con barra", 10, 30, 1),
            ("Press militar", 10, 20, 1),
            ("Curl de bíceps", 12, 12, 1),
            ("Tríceps en polea", 12, 18, 1),
            # Día 2 — Tren inferior + Core
            ("Sentadilla", 8, 50, 2),
            ("Prensa de piernas", 10, 80, 2),
            ("Plancha", 30, 0, 2),
            ("Crunch abdominal", 20, 0, 2),
        ]

        for nombre_ej, reps, peso, dia in rutina_juan_ejercicios:
            db.add(RutinaEjercicio(
                rutina_id=rutina_juan.id,
                ejercicio_id=ejercicios[nombre_ej].id,
                repeticiones=reps,
                peso=peso if peso > 0 else None,
                dia=dia,
            ))

        print(f"Rutina '{rutina_juan.nombre}' creada para juan (2 días, {len(rutina_juan_ejercicios)} ejercicios)")

        # ── Historial de rutinas ──────────────────────────────────
        db.add(HistorialRutina(
            rutina_id=rutina_maria.id,
            alumno_id=alumno1.id,
            fecha_asignacion=datetime.utcnow() - timedelta(days=14),
            notas="Rutina inicial asignada",
        ))
        db.add(HistorialRutina(
            rutina_id=rutina_juan.id,
            alumno_id=alumno2.id,
            fecha_asignacion=datetime.utcnow() - timedelta(days=7),
            notas="Primera rutina",
        ))

        # ── Ejecuciones de ejemplo (María, últimos 7 días) ───────
        for days_ago in [7, 5, 3, 1]:
            fecha = datetime.utcnow() - timedelta(days=days_ago)
            dia = (days_ago % 3) + 1  # Alterna entre día 1, 2, 3

            ejecucion = EjecucionRutina(
                rutina_id=rutina_maria.id,
                alumno_id=alumno1.id,
                fecha=fecha,
                dia=dia,
                notas=f"Sesión día {dia}",
                completada=True,
            )
            db.add(ejecucion)
            db.flush()

            # Agregar detalles de los ejercicios de ese día
            ejercicios_del_dia = [
                (nombre_ej, reps, peso)
                for nombre_ej, reps, peso, d in rutina_maria_ejercicios
                if d == dia
            ]
            for nombre_ej, reps, peso in ejercicios_del_dia:
                db.add(EjecucionEjercicio(
                    ejecucion_id=ejecucion.id,
                    ejercicio_id=ejercicios[nombre_ej].id,
                    series_completadas=3,
                    repeticiones_realizadas=reps,
                    peso_usado=float(peso) if peso > 0 else None,
                ))

        print(f"Ejecuciones de ejemplo creadas para maria (4 sesiones)")

        # ── Ejecuciones de ejemplo (Juan, últimos 5 días) ────────
        for days_ago in [5, 3, 1]:
            fecha = datetime.utcnow() - timedelta(days=days_ago)
            dia = (days_ago % 2) + 1

            ejecucion = EjecucionRutina(
                rutina_id=rutina_juan.id,
                alumno_id=alumno2.id,
                fecha=fecha,
                dia=dia,
                notas=f"Sesión día {dia}",
                completada=True,
            )
            db.add(ejecucion)
            db.flush()

            ejercicios_del_dia = [
                (nombre_ej, reps, peso)
                for nombre_ej, reps, peso, d in rutina_juan_ejercicios
                if d == dia
            ]
            for nombre_ej, reps, peso in ejercicios_del_dia:
                db.add(EjecucionEjercicio(
                    ejecucion_id=ejecucion.id,
                    ejercicio_id=ejercicios[nombre_ej].id,
                    series_completadas=3,
                    repeticiones_realizadas=reps,
                    peso_usado=float(peso) if peso > 0 else None,
                ))

        print(f"Ejecuciones de ejemplo creadas para juan (3 sesiones)")

        # ── Commit ────────────────────────────────────────────────
        db.commit()
        print("\n--- Seed completado exitosamente ---")
        print("\nCredenciales de prueba:")
        print("  Admin:    admin    / admin123")
        print("  Profesor: carlos   / profesor123")
        print("  Alumno 1: maria    / alumno123")
        print("  Alumno 2: juan     / alumno123")

    except Exception as e:
        db.rollback()
        print(f"\nError durante seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
