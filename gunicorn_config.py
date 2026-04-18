"""
Gunicorn configuration for Railway deployment

This config file ensures proper working directory and Python path setup
"""

import os
import sys

# Get the project root directory
project_root = os.path.dirname(os.path.abspath(__file__))

# Ensure project root is in Python path so 'wsgi' module can be found
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Gunicorn configuration
bind = f"0.0.0.0:{os.environ.get('PORT', 5000)}"
workers = 2
worker_class = "sync"
timeout = 120
keepalive = 5

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Process naming
proc_name = "caresynvision"
