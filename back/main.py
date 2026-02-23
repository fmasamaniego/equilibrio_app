# Entry point for production (Render).
# Adds back/ to sys.path so 'app' package is always found,
# regardless of the working directory Render uses.
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app  # noqa: F401
