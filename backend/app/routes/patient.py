"""
Patient Data Routes
Handles patient health data ingestion from ESP32 devices
"""

from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
import logging
import os
import uuid
from app.services.patient_service import PatientService
from app.middleware.validation import validate_patient_headers

logger = logging.getLogger(__name__)

patient_bp = Blueprint('patient', __name__)
patient_service = PatientService()


@patient_bp.route('/patient', methods=['POST'])
def create_patient():
    """
    Create a new patient record
    
    JSON payload:
    {
        "name": "string",
        "age": int,
        "medical_conditions": ["array"],
        "contact_info": {"phone": "string", "email": "string"}
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        name = data.get('name')
        if not name:
            return jsonify({"error": "Patient name is required"}), 400
        
        result = patient_service.create_patient(
            name=name,
            age=data.get('age'),
            medical_conditions=data.get('medical_conditions'),
            contact_info=data.get('contact_info')
        )
        
        status_code = 201 if result.get('success') else 400
        return jsonify(result), status_code
        
    except Exception as e:
        logger.error(f"Error creating patient: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error", "message": str(e)}), 500


@patient_bp.route('/patient/<patient_id>', methods=['GET'])
def get_patient(patient_id):
    """
    Get patient information with current health status
    """
    try:
        result = patient_service.get_patient(patient_id)
        
        if not result.get('success'):
            status_code = result.get('status_code', 400)
            return jsonify({'error': result.get('error')}), status_code
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error retrieving patient: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error", "message": str(e)}), 500


@patient_bp.route('/patient', methods=['GET'])
def get_patients():
    """
    Get list of all patients
    
    Query parameters:
    - active_only: bool (default: true)
    - limit: int (default: 100)
    """
    try:
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        limit = request.args.get('limit', 100, type=int)
        
        result = patient_service.get_patient_list(active_only=active_only, limit=limit)
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error retrieving patients: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error", "message": str(e)}), 500


@patient_bp.route('/patient/<patient_id>', methods=['PUT'])
def update_patient(patient_id):
    """
    Update patient information
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        result = patient_service.update_patient(patient_id, **data)
        
        if not result.get('success'):
            status_code = result.get('status_code', 400)
            return jsonify({'error': result.get('error')}), status_code
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error updating patient: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error", "message": str(e)}), 500


@patient_bp.route('/patient/health-data', methods=['POST'])
@validate_patient_headers
def receive_health_data():
    """
    Receive patient health data (images) from ESP32-CAM
    
    Headers required:
    - X-Patient-ID: Patient identifier
    - X-Session-ID: Session identifier
    - X-Device-ID: Device identifier
    
    Returns:
    - Success: 200 with analysis result
    - Error: 400/500 with error details
    """
    try:
        # Extract headers
        patient_id = request.headers.get('X-Patient-ID')
        session_id = request.headers.get('X-Session-ID')
        device_id = request.headers.get('X-Device-ID', 'ESP32-CAM')
        timestamp = request.headers.get('X-Timestamp', str(datetime.utcnow().timestamp()))
        
        # Validate image data
        if not request.data:
            logger.warning(f"Empty health data from patient {patient_id}")
            return jsonify({"error": "Empty health data"}), 400
        
        # Verify size
        if len(request.data) > current_app.config['MAX_CONTENT_LENGTH']:
            logger.warning(f"Oversized health data from patient {patient_id}")
            return jsonify({"error": "File too large"}), 413
        
        # Save image
        health_id = str(uuid.uuid4())[:8]
        image_filename = f"health_{patient_id}_{health_id}_{int(datetime.utcnow().timestamp()*1000)}.jpg"
        image_path = os.path.join(current_app.config['UPLOAD_FOLDER'], image_filename)
        
        with open(image_path, 'wb') as f:
            f.write(request.data)
        
        logger.info(f"Health data saved: {image_filename} ({len(request.data)} bytes) from {device_id}")
        
        # Process through analysis pipeline
        result = patient_service.process_patient_data({
            'patient_id': patient_id,
            'session_id': session_id,
            'device_id': device_id,
            'timestamp': timestamp,
            'image_path': image_path,
            'image_filename': image_filename,
            'health_id': health_id
        })
        
        status_code = result.get('status_code', 200)
        return jsonify(result), status_code
        
    except Exception as e:
        logger.error(f"Error receiving health data: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error", "message": str(e)}), 500


@patient_bp.route('/patient/<patient_id>/vitals', methods=['POST'])
def receive_vitals(patient_id):
    """
    Receive vital signs data from sensors or wearables
    
    JSON payload:
    {
        "heart_rate": int,
        "spo2": float,
        "temperature": float,
        "blood_pressure": {
            "systolic": int,
            "diastolic": int
        },
        "timestamp": "ISO 8601 string"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        data['patient_id'] = patient_id
        
        logger.info(f"Received vitals for patient {patient_id}: {data}")
        
        # Process vitals
        result = patient_service.process_vitals(data)
        
        if not result.get('success'):
            status_code = result.get('status_code', 400)
            return jsonify({'error': result.get('error')}), status_code
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error receiving vitals: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error", "message": str(e)}), 500


@patient_bp.route('/patient/<patient_id>/history', methods=['GET'])
def get_patient_history(patient_id):
    """
    Retrieve patient's health data history
    
    Query parameters:
    - days: Number of days to retrieve (default: 7)
    - limit: Number of records (default: 100)
    """
    try:
        days = request.args.get('days', 7, type=int)
        limit = request.args.get('limit', 100, type=int)
        
        result = patient_service.get_patient_history(patient_id, days=days, limit=limit)
        
        if not result.get('success'):
            status_code = result.get('status_code', 400)
            return jsonify({'error': result.get('error')}), status_code
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error retrieving patient history: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error", "message": str(e)}), 500

