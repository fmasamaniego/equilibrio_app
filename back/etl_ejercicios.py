"""
ETL: data.db (SQLite) → Supabase (PostgreSQL)
Migra grupos musculares y ejercicios.

Lógica:
  - Normaliza nombres para comparación (sin tildes, lowercase, sin espacios extra)
  - Mapea grupos SQLite a grupos existentes en Supabase por nombre normalizado
  - Crea grupos nuevos en Supabase si no existen
  - Omite ejercicios ya existentes (mismo nombre normalizado + mismo grupo)
  - Maneja encoding latin-1 del SQLite antiguo
  - Reporta al final cuánto se insertó y cuánto se omitió
"""
import os
import sys
import sqlite3
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from sqlalchemy import text
from app.db.engine import engine

SQLITE_PATH = os.path.join(os.path.dirname(__file__), "app", "utils", "data.db")


# ── Helpers ────────────────────────────────────────────────────────────────────

def normalizar(s: str) -> str:
    """Normaliza para comparación: sin tildes, lowercase, espacios colapsados."""
    if not s:
        return ""
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return " ".join(s.lower().split())


def limpiar_nombre(s: str) -> str:
    """Limpia nombre para inserción: strip + espacios colapsados. Mantiene tildes."""
    if not s:
        return s
    return " ".join(s.strip().split())


def leer_sqlite():
    """Lee groups y exercises del SQLite con fallback de encoding latin-1."""
    conn = sqlite3.connect(SQLITE_PATH)
    conn.text_factory = lambda b: b.decode("utf-8", errors="replace")

    cur = conn.cursor()

    # Grupos (solo activos)
    cur.execute("SELECT _id, description FROM activity_types WHERE disabled = 0")
    grupos_raw = cur.fetchall()

    # Ejercicios (solo activos) con su grupo
    cur.execute("""
        SELECT a._id, a.description, a.type_id
        FROM activities a
        JOIN activity_types t ON a.type_id = t._id
        WHERE a.disabled = 0 AND t.disabled = 0
    """)
    ejercicios_raw = cur.fetchall()

    conn.close()
    return grupos_raw, ejercicios_raw


def cargar_grupos_supabase(conn):
    """Devuelve dict normalizado→{id, nombre} de grupos en Supabase."""
    rows = conn.execute(text("SELECT id, nombre FROM grupos_musculares")).fetchall()
    return {normalizar(r[1]): {"id": r[0], "nombre": r[1]} for r in rows}


def cargar_ejercicios_supabase(conn):
    """Devuelve set de (nombre_norm, grupo_id) existentes en Supabase."""
    rows = conn.execute(text("SELECT nombre, grupo_muscular_id FROM ejercicios")).fetchall()
    return {(normalizar(r[0]), r[1]) for r in rows}


# ── ETL principal ──────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("ETL: data.db -> Supabase")
    print("=" * 60)

    # 1. EXTRAER desde SQLite
    grupos_sqlite, ejercicios_sqlite = leer_sqlite()
    print(f"\n[EXTRACT] {len(grupos_sqlite)} grupos, {len(ejercicios_sqlite)} ejercicios desde SQLite")

    with engine.connect() as conn:

        # 2. GRUPOS — mapear o crear
        print("\n[TRANSFORM / LOAD] Grupos musculares...")
        grupos_supabase = cargar_grupos_supabase(conn)

        # sqlite_id → supabase_id (mapa de referencia para ejercicios)
        mapa_grupo: dict[int, int] = {}
        grupos_creados = 0
        grupos_mapeados = 0

        for sqlite_id, nombre_raw in grupos_sqlite:
            nombre = limpiar_nombre(nombre_raw)
            norm = normalizar(nombre)

            if norm in grupos_supabase:
                mapa_grupo[sqlite_id] = grupos_supabase[norm]["id"]
                grupos_mapeados += 1
                print(f"  = mapea  '{nombre}' → id {grupos_supabase[norm]['id']} ('{grupos_supabase[norm]['nombre']}')")
            else:
                # Crear grupo nuevo
                result = conn.execute(
                    text("INSERT INTO grupos_musculares (nombre) VALUES (:nombre) RETURNING id"),
                    {"nombre": nombre}
                )
                new_id = result.fetchone()[0]
                mapa_grupo[sqlite_id] = new_id
                # Actualizar mapa local para detectar dups en la misma corrida
                grupos_supabase[norm] = {"id": new_id, "nombre": nombre}
                grupos_creados += 1
                print(f"  + creado '{nombre}' → id {new_id}")

        conn.commit()
        print(f"\n  Grupos: {grupos_mapeados} mapeados, {grupos_creados} creados")

        # 3. EJERCICIOS — deduplicar y cargar
        print("\n[TRANSFORM / LOAD] Ejercicios...")
        ejercicios_existentes = cargar_ejercicios_supabase(conn)

        # Deduplicar dentro del propio SQLite (mismo nombre normalizado + mismo grupo)
        vistos_sqlite: set[tuple[str, int]] = set()
        ejercicios_unicos = []
        dups_sqlite = 0

        for sqlite_id, nombre_raw, type_id in ejercicios_sqlite:
            nombre = limpiar_nombre(nombre_raw)
            if not nombre:
                continue
            grupo_supabase_id = mapa_grupo.get(type_id)
            if grupo_supabase_id is None:
                continue
            key = (normalizar(nombre), grupo_supabase_id)
            if key in vistos_sqlite:
                dups_sqlite += 1
                continue
            vistos_sqlite.add(key)
            ejercicios_unicos.append((nombre, grupo_supabase_id, key))

        print(f"  SQLite: {len(ejercicios_sqlite)} raw → {len(ejercicios_unicos)} únicos ({dups_sqlite} dups internos)")

        # Insertar solo los que no existen en Supabase
        insertados = 0
        omitidos = 0

        for nombre, grupo_id, key in ejercicios_unicos:
            if key in ejercicios_existentes:
                omitidos += 1
                continue
            conn.execute(
                text("INSERT INTO ejercicios (nombre, grupo_muscular_id) VALUES (:nombre, :gid)"),
                {"nombre": nombre, "gid": grupo_id}
            )
            ejercicios_existentes.add(key)
            insertados += 1

        conn.commit()
        print(f"  Ejercicios: {insertados} insertados, {omitidos} ya existían en Supabase")

    # 4. REPORTE FINAL
    print("\n" + "=" * 60)
    print("RESUMEN")
    print("=" * 60)
    print(f"  Grupos mapeados:    {grupos_mapeados}")
    print(f"  Grupos creados:     {grupos_creados}")
    print(f"  Ejercicios nuevos:  {insertados}")
    print(f"  Ejercicios omitidos (ya existían): {omitidos}")
    print(f"  Dups internos SQLite descartados:  {dups_sqlite}")
    print("=" * 60)
    print("ETL completado sin errores.")


if __name__ == "__main__":
    main()
