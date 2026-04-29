"""
Authentication Routes
Login, token generation, and access control
"""

from flask import Blueprint, request, jsonify, session, redirect
from datetime import datetime
import logging
import re
import os
import requests
from sqlalchemy import select
from backend.app.services.auth_service import AuthService
from backend.app.models.patient_model import Patient
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
            session_obj = get_db_session()
            session_obj.add(patient)
            session_obj.commit()
            logger.info(f"New patient registered: {email} (ID: {patient.patient_id})")
        except Exception as e:
            get_db_session().rollback()
            logger.error(f"Error saving patient to database: {str(e)}", exc_info=True)
            return jsonify({"error": "Failed to create account"}), 500
        
        # CRITICAL: Ensure patient has required attributes
        if not patient or not hasattr(patient, 'patient_id') or not patient.patient_id:
            logger.error(f"Patient object invalid after creation: {patient}")
            return jsonify({"error": "Failed to create account - invalid patient"}), 500
        
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
        
        # CRITICAL: Ensure patient exists before accessing attributes
        if patient is None:
            logger.error("Patient is None after authentication logic - should not reach here")
            return jsonify({"error": "Authentication failed"}), 401
        
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


@auth_bp.route('/auth/oauth/start', methods=['POST'])
def oauth_start():
    """
    Start Google OAuth flow by returning authorization URL
    
    Returns:
    {
        "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
        "state": "random_state_token"
    }
    """
    try:
        # Get OAuth credentials from environment
        client_id = os.getenv('GOOGLE_CLIENT_ID')
        client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        redirect_uri = os.getenv('GOOGLE_REDIRECT_URI')
        
        if not all([client_id, client_secret, redirect_uri]):
            logger.error("Missing Google OAuth credentials in environment")
            return jsonify({"error": "OAuth not configured"}), 500
        
        # Generate authorization URL
        import secrets
        state = secrets.token_urlsafe(32)
        
        # Build the authorization URL manually
        authorization_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope=openid%20email%20profile&"
            f"state={state}&"
            f"access_type=offline&"
            f"include_granted_scopes=true"
        )
        
        # Store state in session for verification
        session['oauth_state'] = state
        session.permanent = True
        
        logger.info(f"OAuth flow started with state: {state}")
        
        return jsonify({
            'success': True,
            'authorization_url': authorization_url,
            'state': state
        }), 200
    
    except Exception as e:
        logger.error(f"Error starting OAuth flow: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to start OAuth flow"}), 500


@auth_bp.route('/auth/oauth/callback', methods=['GET'])
def oauth_callback():
    """
    Handle Google OAuth callback (server-side)
    Google redirects here with authorization code
    
    Query parameters:
    - code: Authorization code from Google
    - state: State token for CSRF protection
    - error: Error code if authentication failed
    """
    try:
        # Check for OAuth errors
        error = request.args.get('error')
        if error:
            error_description = request.args.get('error_description', error)
            logger.warning(f"OAuth error from Google: {error_description}")
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
            return redirect(f"{frontend_url}/login?oauth_error={error_description}")
        
        # Extract authorization code
        code = request.args.get('code')
        if not code:
            logger.error("No authorization code received from Google")
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
            return redirect(f"{frontend_url}/login?oauth_error=No authorization code received")
        
        # Get OAuth credentials from environment
        client_id = os.getenv('GOOGLE_CLIENT_ID')
        client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        redirect_uri = os.getenv('GOOGLE_REDIRECT_URI')
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        
        if not all([client_id, client_secret, redirect_uri, frontend_url]):
            logger.error("Missing OAuth configuration in environment")
            return redirect(f"{frontend_url}/login?oauth_error=Server configuration error")
        
        # Exchange authorization code for access token
        logger.info("Exchanging authorization code for token")
        
        token_response = requests.post(
            'https://oauth2.googleapis.com/token',
            data={
                'client_id': client_id,
                'client_secret': client_secret,
                'code': code,
                'grant_type': 'authorization_code',
                'redirect_uri': redirect_uri
            },
            timeout=10
        )
        
        if token_response.status_code != 200:
            logger.error(f"Token exchange failed: {token_response.text}")
            return redirect(f"{frontend_url}/login?oauth_error=Failed to exchange authorization code")
        
        token_data = token_response.json()
        access_token = token_data.get('access_token')
        
        if not access_token:
            logger.error("No access token in response")
            return redirect(f"{frontend_url}/login?oauth_error=Failed to obtain access token")
        
        # Get user info from Google
        logger.info("Fetching user info from Google")
        user_response = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {access_token}'},
            timeout=10
        )
        
        if user_response.status_code != 200:
            logger.error(f"User info fetch failed: {user_response.text}")
            return redirect(f"{frontend_url}/login?oauth_error=Failed to fetch user information")
        
        user_info = user_response.json()
        
        # Extract user information
        email = user_info.get('email')
        name = user_info.get('name', 'Google User')
        
        if not email:
            logger.error("No email in Google user info")
            return redirect(f"{frontend_url}/login?oauth_error=Email is required from Google")
        
        logger.info(f"OAuth callback: Got user info for {email}")
        
        # Check if patient exists, if not create one
        db_session = get_db_session()
        result = db_session.execute(select(Patient).where(Patient.email == email))
        patient = result.scalar_one_or_none()
        
        if not patient:
            # Auto-create patient from OAuth info
            logger.info(f"Creating new patient from OAuth: {email}")
            patient = Patient(
                email=email,
                name=name,
                active=True
            )
            try:
                db_session.add(patient)
                db_session.commit()
                logger.info(f"New patient created via OAuth: {email} (ID: {patient.patient_id})")
            except Exception as e:
                db_session.rollback()
                logger.error(f"Error creating patient: {str(e)}", exc_info=True)
                return redirect(f"{frontend_url}/login?oauth_error=Failed to create patient account")
        else:
            logger.info(f"Patient already exists: {email}")
        
        # CRITICAL: Verify patient object is valid before using it
        if patient is None:
            logger.error("Patient is None after creation/lookup - critical error")
            return redirect(f"{frontend_url}/login?oauth_error=Failed to process patient account")
        
        if not hasattr(patient, 'patient_id') or not patient.patient_id:
            logger.error(f"Patient missing patient_id: {patient}")
            return redirect(f"{frontend_url}/login?oauth_error=Invalid patient data")
        
        # Generate JWT token
        jwt_token = AuthService.generate_token(patient.patient_id)
        if not jwt_token:
            logger.error("Failed to generate JWT token")
            return redirect(f"{frontend_url}/login?oauth_error=Failed to generate authentication token")
        
        logger.info(f"Patient {patient.patient_id} ({patient.email}) authenticated via OAuth")
        
        # Redirect to frontend with token and user data (URL query params)
        # Frontend will extract these and store in localStorage
        return redirect(
            f"{frontend_url}/dashboard?"
            f"token={jwt_token}&"
            f"patient_id={patient.patient_id}&"
            f"email={email}&"
            f"name={name}&"
            f"oauth=true"
        )
    
    except Exception as e:
        logger.error(f"Error during OAuth callback: {str(e)}", exc_info=True)
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        return redirect(f"{frontend_url}/login?oauth_error=Server error during authentication")

