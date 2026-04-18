"""
Application Configuration
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration"""
    DEBUG = False
    TESTING = False
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'dev-key-change-this')
    
    # Database settings
    database_url = os.getenv(
        'DATABASE_URL',
        'postgresql://caresynvision:caresynvision@localhost:5432/caresynvision'
    )
    # Convert postgresql:// to postgresql+psycopg:// for psycopg v3 driver
    if database_url and database_url.startswith('postgresql://'):
        database_url = database_url.replace('postgresql://', 'postgresql+psycopg://', 1)
    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Connection pool settings for production stability
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 5,
        'pool_recycle': 299,  # Recycle connections every 5 minutes (300s - 1s buffer)
        'pool_pre_ping': True,  # Test connections before using them
        'pool_timeout': 30,
        'max_overflow': 10,  # Allow up to 15 total connections (5 + 10)
    }
    
    # Upload settings
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '../uploads')
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_IMAGE_SIZE', 5242880))  # 5MB
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif'}
    
    # Session settings
    SESSION_TIMEOUT = int(os.getenv('SESSION_TIMEOUT', 3600))  # 1 hour
    MAX_SESSIONS_PER_PATIENT = int(os.getenv('MAX_SESSIONS_PER_PATIENT', 3))
    
    # Health thresholds
    RISK_LOW_THRESHOLD = int(os.getenv('RISK_LOW_THRESHOLD', 30))
    RISK_HIGH_THRESHOLD = int(os.getenv('RISK_HIGH_THRESHOLD', 60))
    
    # Pipeline phases
    PHASE_1_VERIFICATION_ONLY = True
    PHASE_2_MEDICATION_ENGINE_ENABLED = False
    PHASE_3_RESPONSE_ENGINE_ENABLED = False


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False


class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    SQLALCHEMY_ECHO = False
    
    # Convert postgresql:// to postgresql+psycopg:// for psycopg v3 driver
    @property
    def SQLALCHEMY_DATABASE_URI(self):
        db_url = os.getenv('DATABASE_URL', '')
        if db_url and db_url.startswith('postgresql://'):
            db_url = db_url.replace('postgresql://', 'postgresql+psycopg://', 1)
        return db_url


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
