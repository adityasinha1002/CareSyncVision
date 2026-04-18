"""
CareSyncVision Flask Application Factory
"""

from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import logging
import os
import tempfile
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize SQLAlchemy
db = SQLAlchemy()

# Configure logging
logging.basicConfig(
    level=logging.getLevelName(os.getenv('LOG_LEVEL', 'INFO')),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_app(config=None):
    """
    Application factory function
    Creates and configures the Flask app
    """
    app = Flask(__name__)
    
    # Configuration
    app.config.update(
        DEBUG=os.getenv('FLASK_DEBUG', 'False') == 'True',
        TESTING=os.getenv('TESTING', 'False') == 'True',
        SECRET_KEY=os.getenv('FLASK_SECRET_KEY', 'dev-secret-key-change-in-production'),
        MAX_CONTENT_LENGTH=int(os.getenv('MAX_IMAGE_SIZE', 5242880)),  # 5MB default
        UPLOAD_FOLDER=os.path.join(os.path.dirname(__file__), '../uploads'),
        JSON_SORT_KEYS=False,
        JSONIFY_PRETTYPRINT_REGULAR=False,
        # Database configuration
        SQLALCHEMY_DATABASE_URI=os.getenv(
            'DATABASE_URL',
            'postgresql://caresynvision:caresynvision@localhost:5432/caresynvision'
        ),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )
    
    # Override config with passed dict if provided
    if config:
        app.config.update(config)
    
    # Create upload folder if it doesn't exist
    # Use /tmp in production (Render), local in development
    if os.getenv('FLASK_ENV') == 'production':
        app.config['UPLOAD_FOLDER'] = os.path.join(tempfile.gettempdir(), 'caresynvision_uploads')
    else:
        app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), '../uploads')
    
    try:
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        logger.info(f"Upload folder ready: {app.config['UPLOAD_FOLDER']}")
    except Exception as e:
        logger.warning(f"Could not create upload folder: {e}")
    
    # Enable CORS with environment-based origins
    cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
    cors_origins = [origin.strip() for origin in cors_origins if origin.strip()]  # Clean whitespace
    logger.info(f"CORS origins configured: {cors_origins}")
    CORS(app, origins=cors_origins, supports_credentials=True, allow_headers=['Content-Type', 'Authorization'])
    
    # Initialize database
    db.init_app(app)
    
    # Register blueprints (routes)
    from app.routes.health import health_bp
    from app.routes.patient import patient_bp
    from app.routes.medication import medication_bp
    from app.routes.auth import auth_bp
    
    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(patient_bp, url_prefix='/api')
    app.register_blueprint(medication_bp, url_prefix='/api')
    
    # Create database tables and initialize DB
    with app.app_context():
        try:
            # Import models to register them with SQLAlchemy
            from app.models.patient_model import Patient
            from app.models.health_record_model import HealthRecord
            from app.models.medication_model import Medication
            from app.models.session_alert_model import Session, Alert
            
            # Create all tables
            db.create_all()
            logger.info("Database tables created/verified successfully")
        except ImportError as e:
            logger.error(f"Failed to import models: {str(e)}")
            if os.getenv('FLASK_ENV') == 'production':
                raise
        except Exception as e:
            logger.error(f"Database initialization error: {str(e)}", exc_info=True)
            if os.getenv('FLASK_ENV') == 'production':
                raise
            else:
                logger.warning("Continuing in development mode despite database error")
    
    logger.info(f"CareSyncVision Flask app initialized (env={os.getenv('FLASK_ENV', 'development')})")
    
    return app


# Export for module-level access
__all__ = ['create_app', 'db']
