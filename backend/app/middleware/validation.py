"""
Request validation middleware
"""

from flask import request, jsonify
from functools import wraps
import logging

logger = logging.getLogger(__name__)


def validate_patient_headers(f):
    """
    Decorator to validate required patient headers
    Required headers:
    - X-Patient-ID
    - X-Session-ID
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        patient_id = request.headers.get('X-Patient-ID')
        session_id = request.headers.get('X-Session-ID')
        
        if not patient_id:
            logger.warning("Missing X-Patient-ID header")
            return jsonify({"error": "Missing X-Patient-ID header"}), 400
        
        if not session_id:
            logger.warning(f"Missing X-Session-ID header from patient {patient_id}")
            return jsonify({"error": "Missing X-Session-ID header"}), 400
        
        return f(*args, **kwargs)
    
    return decorated_function


def validate_json(f):
    """
    Decorator to validate JSON payload exists
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.is_json:
            logger.warning("Request missing JSON content type")
            return jsonify({"error": "Request must be JSON"}), 400
        
        return f(*args, **kwargs)
    
    return decorated_function
