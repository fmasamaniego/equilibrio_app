import os
import sys

# Fix psycopg2 encoding issue on Windows with non-English locale.
# On Windows, os.environ only updates Win32 env, not the C runtime env
# that libpq (psycopg2) reads via getenv(). We must also update the CRT env.
if sys.platform == "win32":
    os.environ["PGCLIENTENCODING"] = "utf-8"
    try:
        import ctypes
        ctypes.cdll.msvcrt._putenv(b"PGCLIENTENCODING=utf-8")
    except Exception:
        pass

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/gim_equilibrio")
SECRET_KEY: str = os.getenv("SECRET_KEY", "clave-por-defecto-solo-desarrollo")
ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176").split(",")
