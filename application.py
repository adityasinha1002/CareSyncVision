"""
Application entry point - at project root for Railway deployment

This creates the Flask app directly.
Gunicorn loads this with: gunicorn application:app
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Create the Flask app from backend.app module
from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run()
