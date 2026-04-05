"""
Authentication Service
JWT token generation, validation, and user management
"""

import logging
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import os
from app import db

logger = logging.getLogger(__name__)

# Secret key for JWT signing
JWT_SECRET = os.getenv('FLASK_SECRET_KEY', 'dev-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24


class AuthService:
    """
    Service layer for authentication operations
    """
    
    @staticmethod
    def generate_token(patient_id, expires_in=JWT_EXPIRATION_HOURS):
        """
        Generate JWT token for patient
        
        Args:
            patient_id (str): Patient UUID
            expires_in (int): Hours until token expires
        
        Returns:
            str: JWT token
        """
        try:
            payload = {
                'patient_id': patient_id,
                'iat': datetime.utcnow(),
                'exp': datetime.utcnow() + timedelta(hours=expires_in)
            }
            
            token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
            logger.info(f"Generated token for patient {patient_id}")
            
            return token
        
        except Exception as e:
            logger.error(f"Error generating token: {str(e)}", exc_info=True)
            return None
    
    @staticmethod
    def verify_token(token):
        """
        Verify and decode JWT token
        
        Args:
            token (str): JWT token
        
        Returns:
            dict: Token payload or None if invalid
        """
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            logger.debug(f"Token verified for patient {payload.get('patient_id')}")
            return payload
        
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            return None
        except jwt.InvalidTokenError:
            logger.warning("Invalid token")
            return None
        except Exception as e:
            logger.error(f"Error verifying token: {str(e)}", exc_info=True)
            return None
    
    @staticmethod
    def hash_password(password):
        """Hash password using werkzeug"""
        return generate_password_hash(password, method='pbkdf2:sha256')
    
    @staticmethod
    def check_password(hashed_password, password):
        """Verify password against hash"""
        return check_password_hash(hashed_password, password)


def token_required(f):
    """
    Decorator to require valid JWT token
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                logger.warning("Invalid authorization header format")
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            logger.warning("No token provided")
            return jsonify({'error': 'Token is missing'}), 401
        
        # Verify token
        payload = AuthService.verify_token(token)
        if not payload:
            logger.warning("Token verification failed")
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Add patient_id to request context
        request.patient_id = payload.get('patient_id')
        
        return f(*args, **kwargs)
    
    return decorated
