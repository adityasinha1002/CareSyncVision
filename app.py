"""
Main application entry point - at project root for easy discovery

This creates the Flask app directly without complex imports.
Gunicorn can easily find and load this.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Create the Flask app
from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run()
