"""
Authentication Routes
Login, token generation, and access control
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import logging
from app.services.auth_service import AuthService
from app.models.patient_model import Patient

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/auth/login', methods=['POST'])
def login():
    """
    Authenticate patient and return JWT token
    
    JSON payload:
    {
        "patient_id": "string",
        "password": "string"
    }
    
    For MVP: Simple authentication using patient_id
    Production: Use proper credential database
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        patient_id = data.get('patient_id')
        password = data.get('password')
        
        if not patient_id or not password:
            return jsonify({"error": "patient_id and password are required"}), 400
        
        # Verify patient exists
        patient = Patient.query.get(patient_id)
        if not patient:
            logger.warning(f"Login failed: Patient {patient_id} not found")
            return jsonify({"error": "Invalid credentials"}), 401
        
        # For MVP: Simple authentication
        # Production: Check hashed password from database
        if password != "password":  # Placeholder validation
            logger.warning(f"Login failed: Invalid password for patient {patient_id}")
            return jsonify({"error": "Invalid credentials"}), 401
        
        # Generate JWT token
        token = AuthService.generate_token(patient_id)
        if not token:
            return jsonify({"error": "Failed to generate token"}), 500
        
        logger.info(f"Patient {patient_id} logged in successfully")
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'token': token,
            'patient_id': patient_id,
            'expires_in': 86400  # 24 hours in seconds
        }), 200
    
    except Exception as e:
        logger.error(f"Error during login: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error", "message": str(e)}), 500


@auth_bp.route('/auth/verify', methods=['GET'])
def verify_token():
    """
    Verify JWT token validity
    
    Headers required:
    - Authorization: Bearer <token>
    """
    try:
        token = None
        
        # Extract token from Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        # Verify token
        payload = AuthService.verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        return jsonify({
            'success': True,
            'valid': True,
            'patient_id': payload.get('patient_id'),
            'expires_at': payload.get('exp')
        }), 200
    
    except Exception as e:
        logger.error(f"Error verifying token: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error"}), 500


@auth_bp.route('/auth/refresh', methods=['POST'])
def refresh_token():
    """
    Refresh expired JWT token
    
    Headers required:
    - Authorization: Bearer <token>
    """
    try:
        token = None
        
        # Extract token from Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        # Verify token (even if expired, decode it)
        try:
            import jwt
            payload = jwt.decode(token, '', algorithms=['HS256'], options={"verify_signature": False})
        except:
            return jsonify({'error': 'Invalid token'}), 401
        
        patient_id = payload.get('patient_id')
        if not patient_id:
            return jsonify({'error': 'Invalid token payload'}), 401
        
        # Generate new token
        new_token = AuthService.generate_token(patient_id)
        if not new_token:
            return jsonify({"error": "Failed to generate new token"}), 500
        
        logger.info(f"Token refreshed for patient {patient_id}")
        
        return jsonify({
            'success': True,
            'message': 'Token refreshed',
            'token': new_token,
            'patient_id': patient_id,
            'expires_in': 86400  # 24 hours
        }), 200
    
    except Exception as e:
        logger.error(f"Error refreshing token: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error"}), 500


@auth_bp.route('/auth/logout', methods=['POST'])
def logout():
    """
    Logout patient (for frontend to clear token)
    """
    try:
        # In a stateless JWT system, logout is just frontend clearing the token
        # For production, implement token blacklist if needed
        
        return jsonify({
            'success': True,
            'message': 'Logout successful'
        }), 200
    
    except Exception as e:
        logger.error(f"Error during logout: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error"}), 500
