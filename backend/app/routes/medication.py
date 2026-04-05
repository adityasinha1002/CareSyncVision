"""
Medication Tracking Routes
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import logging
from app.services.medication_service import MedicationService

logger = logging.getLogger(__name__)

medication_bp = Blueprint('medication', __name__)
medication_service = MedicationService()


@medication_bp.route('/medication', methods=['POST'])
def create_medication():
    """
    Create a new medication record for patient
    
    JSON payload:
    {
        "patient_id": "string",
        "medication_name": "string",
        "dosage": "string",
        "frequency": "once_daily|twice_daily|as_needed",
        "scheduled_time": "HH:MM:SS (optional)"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        patient_id = data.get('patient_id')
        if not patient_id:
            return jsonify({"error": "patient_id is required"}), 400
        
        medication_name = data.get('medication_name')
        if not medication_name:
            return jsonify({"error": "medication_name is required"}), 400
        
        result = medication_service.create_medication(
            patient_id=patient_id,
            medication_name=medication_name,
            dosage=data.get('dosage', ''),
            frequency=data.get('frequency', 'once_daily'),
            scheduled_time=data.get('scheduled_time')
        )
        
        status_code = 201 if result.get('success') else 400
        return jsonify(result), status_code
        
    except Exception as e:
        logger.error(f"Error creating medication: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error", "message": str(e)}), 500


@medication_bp.route('/patient/<patient_id>/medication', methods=['GET'])
def get_medication_schedule(patient_id):
    """
    Get medication schedule for patient
    """
    try:
        result = medication_service.get_patient_schedule(patient_id)
        
        if not result.get('success'):
            status_code = result.get('status_code', 400)
            return jsonify({'error': result.get('error')}), status_code
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error retrieving medication schedule: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error", "message": str(e)}), 500


@medication_bp.route('/patient/<patient_id>/medication/log', methods=['POST'])
def record_medication_event(patient_id):
    """
    Record a medication administration event
    
    JSON payload:
    {
        "med_id": "string",
        "notes": "string (optional)"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        data['patient_id'] = patient_id
        
        logger.info(f"Recording medication event for patient {patient_id}")
        
        result = medication_service.record_medication(patient_id, data)
        
        status_code = 200 if result.get('success') else 400
        return jsonify(result), status_code
        
    except Exception as e:
        logger.error(f"Error recording medication: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error", "message": str(e)}), 500


@medication_bp.route('/patient/<patient_id>/medication/adherence', methods=['GET'])
def get_medication_adherence(patient_id):
    """
    Get medication adherence metrics
    
    Query parameters:
    - days: Period in days (default: 30)
    """
    try:
        days = request.args.get('days', 30, type=int)
        
        result = medication_service.get_adherence_metrics(patient_id, days=days)
        
        if not result.get('success'):
            status_code = result.get('status_code', 400)
            return jsonify({'error': result.get('error')}), status_code
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error retrieving adherence data: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error", "message": str(e)}), 500


@medication_bp.route('/patient/<patient_id>/medication/missed', methods=['GET'])
def check_missed_doses(patient_id):
    """
    Check for missed medication doses and create alerts
    """
    try:
        result = medication_service.check_missed_doses(patient_id)
        
        if not result.get('success'):
            status_code = result.get('status_code', 400)
            return jsonify({'error': result.get('error')}), status_code
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error checking missed doses: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error", "message": str(e)}), 500

