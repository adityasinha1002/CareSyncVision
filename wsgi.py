"""
Root WSGI entry point for Gunicorn

Directly creates the Flask app - no imports from backend package.
This is the simplest, most reliable approach for PaaS.
"""

import os
import sys
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure environment before creating app
os.environ.setdefault('FLASK_ENV', os.environ.get('FLASK_ENV', 'production'))

# Add backend to path and import the app factory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from app import create_app
    logger.info("✅ Imported create_app from backend.app")
except ImportError as e:
    logger.error(f"❌ Failed to import create_app: {e}")
    raise

# Create the Flask application
try:
    app = create_app()
    logger.info("✅ Flask app created successfully")
    logger.info(f"✅ Registered {len(list(app.url_map.iter_rules()))} routes")
except Exception as e:
    logger.error(f"❌ Failed to create app: {e}", exc_info=True)
    raise

# Expose app for Gunicorn
if __name__ != '__main__':
    logger.info("✅ WSGI app ready for Gunicorn")



