"""
Authentication Routes
Login, token generation, and access control
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import logging
import re
import os
import json as json_lib
import urllib.request
import urllib.error
from sqlalchemy import select
from app.services.auth_service import AuthService
from app.models.patient_model import Patient
from .. import db

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)


def get_db_session():
    """Return the active SQLAlchemy session."""
    return db.session


def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password_strength(password):
    """
    Validate password strength
    Requirements: min 8 chars, at least one uppercase, one lowercase, one digit
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit"
    
    return True, "Password is strong"


@auth_bp.route('/auth/register', methods=['POST'])
def register():
    """
    Register a new patient with email and password
    
    JSON payload:
    {
        "email": "user@example.com",
        "password": "SecurePass123",
        "first_name": "John",
        "last_name": "Doe"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        
        # Validate required fields
        if not email or not password or not first_name or not last_name:
            return jsonify({"error": "Email, password, first_name, and last_name are required"}), 400
        
        # Validate email format
        if not validate_email(email):
            return jsonify({"error": "Invalid email format"}), 400
        
        # Validate password strength
        is_strong, message = validate_password_strength(password)
        if not is_strong:
            return jsonify({"error": message}), 400
        
        # Check if email already exists
        result = get_db_session().execute(select(Patient).where(Patient.email == email))
        existing_patient = result.scalar_one_or_none()
        if existing_patient:
            logger.warning(f"Registration failed: Email {email} already exists")
            return jsonify({"error": "Email already registered"}), 409
        
        # Create new patient
        full_name = f"{first_name} {last_name}"
        patient = Patient(
            email=email,
            name=full_name,
            active=True
        )
        
        # Hash and set password
        patient.set_password(password)
        
        # Save to database
        try:
            session = get_db_session()
            session.add(patient)
            session.commit()
            logger.info(f"New patient registered: {email} (ID: {patient.patient_id})")
        except Exception as e:
            get_db_session().rollback()
            logger.error(f"Error saving patient to database: {str(e)}", exc_info=True)
            return jsonify({"error": "Failed to create account"}), 500
        
        # Generate JWT token for auto-login
        token = AuthService.generate_token(patient.patient_id)
        if not token:
            return jsonify({"error": "Failed to generate token"}), 500
        
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'token': token,
            'patient_id': patient.patient_id,
            'email': patient.email,
            'name': patient.name,
            'expires_in': 86400  # 24 hours in seconds
        }), 201
    
    except Exception as e:
        logger.error(f"Error during registration: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error", "message": str(e)}), 500


@auth_bp.route('/auth/login', methods=['POST'])
def login():
    """
    Authenticate patient and return JWT token
    
    JSON payload:
    {
        "email": "user@example.com",
        "password": "SecurePass123"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        # Support legacy patient_id login for backward compatibility
        patient_id = data.get('patient_id')
        legacy_password = data.get('password')
        
        if not email and not patient_id:
            return jsonify({"error": "Email (or patient_id) and password are required"}), 400
        
        if not password and not legacy_password:
            return jsonify({"error": "Password is required"}), 400
        
        patient = None
        
        # Email-based login (new method)
        if email:
            result = get_db_session().execute(select(Patient).where(Patient.email == email))
            patient = result.scalar_one_or_none()
            if not patient:
                logger.warning(f"Login failed: Patient with email {email} not found")
                return jsonify({"error": "Invalid email or password"}), 401
            
            if not patient.check_password(password):
                logger.warning(f"Login failed: Invalid password for email {email}")
                return jsonify({"error": "Invalid email or password"}), 401
        
        # Legacy patient_id login (for backward compatibility)
        elif patient_id:
            result = get_db_session().execute(select(Patient).where(Patient.patient_id == patient_id))
            patient = result.scalar_one_or_none()
            if not patient:
                logger.warning(f"Login failed: Patient {patient_id} not found")
                return jsonify({"error": "Invalid credentials"}), 401
            
            # Legacy: if patient has a password hash, verify it; otherwise use hardcoded check
            if patient.password_hash:
                if not patient.check_password(legacy_password):
                    logger.warning(f"Login failed: Invalid password for patient {patient_id}")
                    return jsonify({"error": "Invalid credentials"}), 401
            else:
                # Fallback for existing patients without password_hash
                if legacy_password != "password":
                    logger.warning(f"Login failed: Invalid password for patient {patient_id}")
                    return jsonify({"error": "Invalid credentials"}), 401
        
        # Generate JWT token
        token = AuthService.generate_token(patient.patient_id)
        if not token:
            return jsonify({"error": "Failed to generate token"}), 500
        
        logger.info(f"Patient {patient.patient_id} ({patient.email}) logged in successfully")
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'token': token,
            'patient_id': patient.patient_id,
            'email': patient.email,
            'name': patient.name,
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


@auth_bp.route('/auth/google', methods=['POST'])
def google_auth():
    """
    Authenticate with a Google ID token (from Google Identity Services).

    JSON payload:
    {
        "credential": "<Google ID token string>"
    }

    The endpoint verifies the token against Google's tokeninfo API,
    then finds or creates the matching Patient and returns a JWT.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        credential = data.get('credential', '').strip()
        if not credential:
            return jsonify({"error": "Google credential token is required"}), 400

        # ---------------------------------------------------------------
        # Verify the ID token with Google's public tokeninfo endpoint.
        # This works without server-side libraries and without a secret.
        # The token is URL-encoded to prevent URL injection.
        # ---------------------------------------------------------------
        try:
            import urllib.parse as _parse
            url = 'https://oauth2.googleapis.com/tokeninfo?' + _parse.urlencode({'id_token': credential})
            req = urllib.request.Request(url, headers={'Accept': 'application/json'})
            with urllib.request.urlopen(req, timeout=10) as response:
                idinfo = json_lib.loads(response.read().decode())
        except urllib.error.HTTPError as http_err:
            logger.warning(f"Google token verification HTTP error {http_err.code}")
            return jsonify({"error": "Invalid Google token"}), 401
        except Exception as e:
            logger.error(f"Google token verification error: {str(e)}", exc_info=True)
            return jsonify({"error": "Failed to verify Google token"}), 401

        # Optionally enforce that the token was issued for this application.
        google_client_id = os.getenv('GOOGLE_CLIENT_ID')
        if google_client_id and idinfo.get('aud') != google_client_id:
            logger.warning("Google token audience mismatch — token not intended for this app")
            return jsonify({"error": "Token not issued for this application"}), 401

        # Require a verified email from Google.
        # The tokeninfo endpoint may return email_verified as a boolean or a string.
        email_verified = idinfo.get('email_verified', False)
        if not (email_verified is True or str(email_verified).lower() == 'true'):
            return jsonify({"error": "Google account email is not verified"}), 401

        email = idinfo.get('email', '').strip()
        name = idinfo.get('name') or email
        if not email:
            return jsonify({"error": "Email not provided by Google"}), 400

        # ---------------------------------------------------------------
        # Find or create the patient record.
        # ---------------------------------------------------------------
        result = get_db_session().execute(select(Patient).where(Patient.email == email))
        patient = result.scalar_one_or_none()

        if not patient:
            patient = Patient(email=email, name=name, active=True)
            try:
                session = get_db_session()
                session.add(patient)
                session.commit()
                logger.info(f"New patient created via Google OAuth: {email} (ID: {patient.patient_id})")
            except Exception as e:
                get_db_session().rollback()
                logger.error(f"Error creating patient from Google auth: {str(e)}", exc_info=True)
                return jsonify({"error": "Failed to create account"}), 500
        else:
            logger.info(f"Existing patient logged in via Google OAuth: {email}")

        # Generate JWT token.
        token = AuthService.generate_token(patient.patient_id)
        if not token:
            return jsonify({"error": "Failed to generate token"}), 500

        return jsonify({
            'success': True,
            'message': 'Login successful',
            'token': token,
            'patient_id': patient.patient_id,
            'email': patient.email,
            'name': patient.name,
            'expires_in': 86400,
        }), 200

    except Exception as e:
        logger.error(f"Error during Google auth: {str(e)}", exc_info=True)
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
