"""Development server launcher.

Sets PGCLIENTENCODING before uvicorn starts to fix psycopg2 encoding
issues on Windows with non-English locale.
"""
import os
import sys

os.environ["PGCLIENTENCODING"] = "utf-8"

# Also set via CRT for C libraries
if sys.platform == "win32":
    try:
        import ctypes
        ctypes.cdll.msvcrt._putenv(b"PGCLIENTENCODING=utf-8")
    except Exception:
        pass

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8001,
        reload=True,
        reload_dirs=["app"],
    )
