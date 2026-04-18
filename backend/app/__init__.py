"""
CareSyncVision Flask Application Factory
"""

from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import logging
import os
import tempfile
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize SQLAlchemy
db = SQLAlchemy()

# Initialize Migrate
migrate = Migrate()

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
    from app.config import config as config_dict
    
    app = Flask(__name__)
    
    # Determine environment and load config
    env = os.getenv('FLASK_ENV', 'development')
    ConfigClass = config_dict.get(env, config_dict['default'])
    app.config.from_object(ConfigClass)
    
    # Override with environment variables - Railway provides DATABASE_URL automatically
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        # Fallback to config if available
        db_url = app.config.get('SQLALCHEMY_DATABASE_URI')
    
    # Convert postgresql:// to postgresql+psycopg:// for psycopg v3 driver
    if db_url and db_url.startswith('postgresql://'):
        db_url = db_url.replace('postgresql://', 'postgresql+psycopg://', 1)
    
    # Log database configuration status
    if db_url:
        app.config['SQLALCHEMY_DATABASE_URI'] = db_url
        logger.info(f"Database URL configured: {db_url[:30]}...")
    else:
        logger.warning("DATABASE_URL environment variable not set - database operations will fail")
    
    app.config.update(
        SECRET_KEY=os.getenv('FLASK_SECRET_KEY', app.config.get('SECRET_KEY')),
        MAX_CONTENT_LENGTH=int(os.getenv('MAX_IMAGE_SIZE', 5242880)),
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
    
    # Initialize database - non-blocking, won't crash if DB unavailable
    try:
        if db_url:
            db.init_app(app)
            migrate.init_app(app, db)
            logger.info("✅ Database and migrations initialized successfully")
        else:
            logger.error("❌ DATABASE_URL not set - database operations will fail!")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {str(e)}", exc_info=True)
        # App will still start, database requests will fail with clear error
    
    # Add root route for health check (accessible at /)
    @app.route('/', methods=['GET'])
    def api_root():
        return jsonify({
            "message": "CareSyncVision API",
            "status": "running",
            "version": "1.0.0"
        }), 200
    
    # Register blueprints (routes)
    try:
        logger.info("Importing blueprints...")
        from app.routes.health import health_bp
        from app.routes.patient import patient_bp
        from app.routes.medication import medication_bp
        from app.routes.auth import auth_bp
        from app.routes.esp_device import esp_bp
        logger.info("Blueprints imported successfully")
    except ImportError as e:
        logger.error(f"Failed to import blueprints: {e}")
        raise
    
    try:
        logger.info("Registering blueprints with /api prefix...")
        app.register_blueprint(health_bp, url_prefix='/api')
        logger.info("health_bp registered")
        app.register_blueprint(auth_bp, url_prefix='/api')
        logger.info("auth_bp registered")
        app.register_blueprint(patient_bp, url_prefix='/api')
        logger.info("patient_bp registered")
        app.register_blueprint(medication_bp, url_prefix='/api')
        logger.info("medication_bp registered")
        app.register_blueprint(esp_bp, url_prefix='/api')
        logger.info("esp_bp registered")
    except Exception as e:
        logger.error(f"Failed to register blueprints: {e}")
        raise
    
    # Initialize models and database
    with app.app_context():
        try:
            # Import models to register them with SQLAlchemy
            # This allows alembic to detect schema changes
            from app.models.patient_model import Patient
            from app.models.health_record_model import HealthRecord
            from app.models.medication_model import Medication
            from app.models.session_alert_model import Session, Alert
            
            logger.info("Database models loaded successfully")
            
            # With Flask-Migrate, tables are created via 'flask db upgrade' command
            # This is called in render.yaml startCommand or during local setup
            # We only verify tables exist if migration was already run
            try:
                # Just verify connection is possible by getting a test connection
                with db.engine.connect() as conn:
                    logger.info("Database connection verified")
            except Exception as conn_err:
                logger.warning(f"Database not yet initialized (expected during first deploy): {str(conn_err)}")
                
        except ImportError as e:
            logger.error(f"Failed to import models: {str(e)}")
            if os.getenv('FLASK_ENV') == 'production':
                raise
        except Exception as e:
            logger.warning(f"Database initialization note: {str(e)}")
            # Don't raise - migrations will handle db setup on deploy
    
    
    # Register teardown for session cleanup (Flask-SQLAlchemy 3.0 compatibility)
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        """Clean up database session after request"""
        db.session.remove()
    
    logger.info(f"CareSyncVision Flask app initialized (env={os.getenv('FLASK_ENV', 'development')})")
    
    return app


# Export for module-level access
__all__ = ['create_app', 'db', 'migrate']
