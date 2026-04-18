"""
Root-level WSGI entry point for Gunicorn on Railway/Render

Imports Flask app from backend package
"""

# Import the Flask app from the backend package
from backend.wsgi import app

# Ensure app is available at module level for Gunicorn
__all__ = ['app']


