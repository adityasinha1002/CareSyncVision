"""
WSGI Entry Point for production servers (Gunicorn)
"""

import os
import sys
import logging

# Configure logging before app creation
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

logger.info("WSGI: Starting application factory...")

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

logger.info(f"WSGI: Python path includes {os.path.dirname(os.path.abspath(__file__))}")

# Import and create the Flask application
try:
    from app import create_app
    logger.info("WSGI: Successfully imported create_app")
except Exception as e:
    logger.error(f"WSGI: Failed to import create_app: {e}")
    raise

# Create the application instance for Gunicorn
try:
    app = create_app()
    logger.info("WSGI: Flask app successfully created")
    
    # List all registered routes
    with app.app_context():
        rules = [f"{rule.rule} -> {rule.endpoint}" for rule in app.url_map.iter_rules()]
        logger.info(f"WSGI: Registered routes: {rules}")
except Exception as e:
    logger.error(f"WSGI: Failed to create Flask app: {e}", exc_info=True)
    raise

# Ensure app is available at module level for Gunicorn
__all__ = ['app']

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
