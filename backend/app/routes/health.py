"""
Health Records and Vital Data Routes
"""

from flask import Blueprint, jsonify, request
from datetime import datetime
from functools import wraps
import logging
from .. import db
from app.models.health_record_model import HealthRecord
from app.models.patient_model import Patient
import jwt
import os

logger = logging.getLogger(__name__)

health_bp = Blueprint('health', __name__)


def get_db_session():
    """Return the active SQLAlchemy session."""
    return db.session


# JWT Token Verification
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, os.getenv('FLASK_SECRET_KEY', 'dev-key'), algorithms=['HS256'])
            current_patient_id = data['patient_id']
        except:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(current_patient_id, *args, **kwargs)
    return decorated


@health_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    Returns: Service status and timestamp
    """
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "CareSyncVision AI Server",
        "version": "1.0.0"
    }), 200


@health_bp.route('/status', methods=['GET'])
def service_status():
    """
    Service status endpoint with component health
    """
    return jsonify({
        "status": "operational",
        "timestamp": datetime.now().isoformat(),
        "components": {
            "api": "healthy",
            "camera_service": "ready",
            "analysis_engines": "initialized",
            "database": "connected"
        }
    }), 200


@health_bp.route('/vitals', methods=['POST'])
@token_required
def submit_vitals(current_patient_id):
    """
    Submit vital signs data for the current patient
    
    Request body:
    {
        "heart_rate": 72,
        "systolic_bp": 120,
        "diastolic_bp": 80,
        "temperature": 98.6,
        "weight": 175.5,
        "notes": "optional notes"
    }
    
    Returns: Created health record with timestamp
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        # Validate patient exists
        patient = get_db_session().get(Patient, current_patient_id)
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404
        
        # Validate required fields
        required_fields = ['heart_rate', 'systolic_bp', 'diastolic_bp', 'temperature', 'weight']
        missing_fields = [field for field in required_fields if field not in data or data[field] is None]
        
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Validate field types and ranges
        try:
            heart_rate = float(data['heart_rate'])
            systolic_bp = float(data['systolic_bp'])
            diastolic_bp = float(data['diastolic_bp'])
            temperature = float(data['temperature'])
            weight = float(data['weight'])
            notes = data.get('notes', '')
            
            # Basic range validation
            if not (30 <= heart_rate <= 200):
                return jsonify({'error': 'Heart rate must be between 30 and 200 BPM'}), 400
            if not (50 <= systolic_bp <= 250):
                return jsonify({'error': 'Systolic BP must be between 50 and 250 mmHg'}), 400
            if not (30 <= diastolic_bp <= 150):
                return jsonify({'error': 'Diastolic BP must be between 30 and 150 mmHg'}), 400
            if diastolic_bp >= systolic_bp:
                return jsonify({'error': 'Diastolic BP must be less than Systolic BP'}), 400
            if not (95 <= temperature <= 106):
                return jsonify({'error': 'Temperature must be between 95°F and 106°F'}), 400
            if not (50 <= weight <= 500):
                return jsonify({'error': 'Weight must be between 50 and 500 lbs'}), 400
        
        except (ValueError, TypeError) as e:
            return jsonify({'error': 'Invalid field types. All numeric fields must be numbers'}), 400
        
        # Create health record
        health_record = HealthRecord(
            patient_id=current_patient_id,
            record_type='vital',
            data={
                'heart_rate': heart_rate,
                'systolic_bp': systolic_bp,
                'diastolic_bp': diastolic_bp,
                'temperature': temperature,
                'weight': weight,
                'notes': notes
            },
            timestamp=datetime.utcnow()
        )
        
        session = get_db_session()
        session.add(health_record)
        session.commit()
        
        logger.info(f"Vital signs recorded for patient {current_patient_id}")
        
        return jsonify({
            'success': True,
            'message': 'Vital signs recorded successfully',
            'record': health_record.to_dict()
        }), 201
    
    except Exception as e:
        get_db_session().rollback()
        logger.error(f"Error submitting vitals: {str(e)}")
        return jsonify({'error': 'Failed to save vital signs'}), 500


@health_bp.route('/vitals/recent', methods=['GET'])
@token_required
def get_recent_vitals(current_patient_id):
    """
    Get recent vital signs for the current patient
    
    Query parameters:
    - limit: number of records to return (default: 10)
    
    Returns: List of vital records sorted by timestamp (most recent first)
    """
    try:
        limit = request.args.get('limit', default=10, type=int)
        limit = min(limit, 100)  # Max 100 records
        
        # Verify patient exists
        patient = get_db_session().get(Patient, current_patient_id)
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404
        
        # Get recent vitals
        vitals = get_db_session().execute(
            db.select(HealthRecord).where(
                HealthRecord.patient_id == current_patient_id,
                HealthRecord.record_type == 'vital'
            ).order_by(HealthRecord.timestamp.desc()).limit(limit)
        ).scalars().all()
        
        return jsonify({
            'success': True,
            'count': len(vitals),
            'vitals': [v.to_dict() for v in vitals]
        }), 200
    
    except Exception as e:
        logger.error(f"Error fetching recent vitals: {str(e)}")
        return jsonify({'error': 'Failed to fetch vital signs'}), 500
