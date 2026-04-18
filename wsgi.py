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

# Import the app from backend/wsgi.py
from wsgi import app

# Gunicorn looks for 'app' at module level
__all__ = ['app']
