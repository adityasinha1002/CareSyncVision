"""
WSGI Entry Point - at project root for Railway

Gunicorn loads this with: gunicorn main:app
"""

import sys
import os
from typing import Any

# Add backend to path for runtime imports
_backend_path = os.path.join(os.path.dirname(__file__), 'backend')
if _backend_path not in sys.path:
    sys.path.insert(0, _backend_path)

# Import Flask app factory - IDE will resolve backend.app.create_app
from backend.app import create_app

# Create WSGI application
app: Any = create_app()

if __name__ == '__main__':
    app.run(debug=False)