"""
Gunicorn configuration for Railway deployment

Minimal config - relies on app.py at root being easy to find
"""

import os
import sys

# Get project root
project_root = os.path.dirname(os.path.abspath(__file__))

# Ensure project root is in Python path
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Gunicorn config
bind = f"0.0.0.0:{os.environ.get('PORT', 5000)}"
workers = 2
worker_class = "sync"
timeout = 120

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

