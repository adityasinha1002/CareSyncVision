"""
Root-level WSGI entry point for Gunicorn on Railway/Render

This file is at the project root so Gunicorn can find it easily.
It imports and exposes the Flask app from backend/wsgi.py
"""

import sys
import os

# Add backend directory to Python path
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.insert(0, backend_path)

# Import the app from backend/wsgi.py (not from this wsgi.py to avoid circular import)
# We need to reference the actual backend wsgi module
import importlib.util
backend_wsgi_path = os.path.join(backend_path, 'wsgi.py')
spec = importlib.util.spec_from_file_location("backend_wsgi", backend_wsgi_path)
backend_wsgi = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backend_wsgi)

# Get the app from backend wsgi module
app = backend_wsgi.app

# Gunicorn looks for 'app' at module level
__all__ = ['app']

