"""
WSGI Entry Point for production servers (Gunicorn)
"""

import os
import sys

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import and create the Flask application
from app import create_app

# Create the application instance for Gunicorn
app = create_app()

# Ensure app is available at module level for Gunicorn
__all__ = ['app']

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
