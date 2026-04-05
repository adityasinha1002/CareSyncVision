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


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
