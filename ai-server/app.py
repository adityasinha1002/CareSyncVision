"""
================================================================================
CARESYNVISION - AI SERVER
Patient Health Monitoring & Medication Analysis Pipeline
Patient Auth → Health Analysis Engine → Medication Adjustment Engine → Response Engine
================================================================================
"""

import logging
import os
import json
import uuid
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Import pipeline components
from engines.health_analysis_engine import HealthAnalysisEngine
from engines.medication_adjustment_engine import MedicationAdjustmentEngine
from engines.health_response_engine import HealthResponseEngine

# ================================================================================
# CONFIGURATION
# ================================================================================

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Flask app initialization
app = Flask(__name__)
CORS(app)

# File upload configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif'}
MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5MB

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_UPLOAD_SIZE

# ================================================================================
# PIPELINE COMPONENTS INITIALIZATION
# ================================================================================

# Initialize pipeline engines for patient health monitoring
health_analysis_engine = HealthAnalysisEngine()
medication_adjustment_engine = MedicationAdjustmentEngine()
health_response_engine = HealthResponseEngine()

logger.info("Patient Health Monitoring pipeline engines initialized")

# ================================================================================
# UTILITY FUNCTIONS
# ================================================================================

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_timestamp():
    """Get current timestamp in ISO format"""
    return datetime.now().isoformat()

# ================================================================================
# API ENDPOINTS - HEALTH CHECK
# ================================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": get_timestamp(),
        "service": "CareSyncVision AI Server"
    }), 200

# ================================================================================
# API ENDPOINTS - SENSOR DATA INGESTION
# ================================================================================

# ================================================================================
# API ENDPOINTS - PATIENT DATA INGESTION
# ================================================================================

@app.route('/api/patient/health-data', methods=['POST'])
def receive_patient_health_data():
    """
    Endpoint for ESP32-CAM to send patient health monitoring data
    Includes: Behavioral observations, vital sign estimates, activity patterns
    """
    try:
        logger.info("Received patient health data")
        
        patient_id = request.headers.get('X-Patient-ID', 'unknown')
        session_id = request.headers.get('X-Session-ID', 'unknown')
        device_id = request.headers.get('X-Device-ID', 'ESP32-CAM-PATIENT-MON')
        timestamp = request.headers.get('X-Timestamp', str(datetime.now().timestamp()))
        
        # Validate image data
        if not request.data:
            logger.warning("Empty health data received")
            return jsonify({"error": "Empty health data"}), 400
        
        # Save image temporarily for analysis
        health_id = str(uuid.uuid4())[:8]
        image_filename = f"health_{patient_id}_{health_id}_{int(datetime.now().timestamp()*1000)}.jpg"
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
        
        with open(image_path, 'wb') as f:
            f.write(request.data)
        
        logger.info(f"Health data saved: {image_filename} ({len(request.data)} bytes)")
        
        # Process through patient monitoring pipeline
        result = process_patient_pipeline(image_path, {
            'patient_id': patient_id,
            'session_id': session_id,
            'device_id': device_id,
            'timestamp': timestamp,
            'health_id': health_id
        })
        
        return jsonify(result), result.get('status_code', 200)
        
    except Exception as e:
        logger.error(f"Error receiving health data: {str(e)}")
        return jsonify({"error": "Server error", "message": str(e)}), 500

@app.route('/api/patient/vitals', methods=['POST'])
def receive_patient_vitals():
    """
    Endpoint for vital signs data (heart rate, SpO2, temperature, etc.)
    Can be from wearable sensors or estimated from behavioral analysis
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        patient_id = data.get('patient_id')
        logger.info(f"Received vitals for patient {patient_id}: {data}")
        
        # Validate required fields
        if not patient_id:
            return jsonify({"error": "Missing patient_id"}), 400
        
        # Log vital signs
        vitals_event = {
            'timestamp': get_timestamp(),
            'patient_id': patient_id,
            'heart_rate': data.get('heart_rate'),
            'blood_oxygen': data.get('blood_oxygen'),
            'body_temperature': data.get('body_temperature'),
            'respiratory_rate': data.get('respiratory_rate'),
            'activity_level': data.get('activity_level'),
            'status': 'recorded'
        }
        
        logger.info(f"Vitals event recorded: {vitals_event}")
        
        return jsonify({
            "status": "success",
            "message": "Vital signs recorded",
            "event_id": str(uuid.uuid4())
        }), 202
        
    except Exception as e:
        logger.error(f"Error receiving vitals: {str(e)}")
        return jsonify({"error": "Server error"}), 500

@app.route('/api/patient/medication', methods=['POST'])
def receive_medication_response():
    """
    Endpoint to log patient medication administration and response
    Records: Medication taken, time taken, observed effects, side effects
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        patient_id = data.get('patient_id')
        logger.info(f"Received medication response for patient {patient_id}")
        
        # Validate required fields
        if not patient_id or not data.get('medication_id'):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Log medication administration
        med_event = {
            'timestamp': get_timestamp(),
            'patient_id': patient_id,
            'medication_id': data.get('medication_id'),
            'medication_name': data.get('medication_name'),
            'scheduled_time': data.get('scheduled_time'),
            'actual_time': data.get('actual_time'),
            'adherence': data.get('adherence', 'unknown'),
            'observed_effects': data.get('observed_effects'),
            'side_effects': data.get('side_effects'),
            'status': 'logged'
        }
        
        logger.info(f"Medication response logged: {med_event}")
        
        # Trigger medication adjustment analysis
        adjustment_result = medication_adjustment_engine.analyze_response(med_event)
        logger.info(f"Medication adjustment analysis: {adjustment_result}")
        
        return jsonify({
            "status": "success",
            "message": "Medication response recorded",
            "adjustment_recommendation": adjustment_result,
            "event_id": str(uuid.uuid4())
        }), 202
        
    except Exception as e:
        logger.error(f"Error logging medication response: {str(e)}")
        return jsonify({"error": "Server error"}), 500

# ================================================================================
# PIPELINE PROCESSING
# ================================================================================

# ================================================================================
# PIPELINE PROCESSING
# ================================================================================

# PHASE FLAGS
PHASE_1_VERIFICATION_ONLY = True
PHASE_2_MEDICATION_ENGINE_ENABLED = False
PHASE_3_RESPONSE_ENGINE_ENABLED = False

def process_patient_pipeline(image_path, metadata):
    """
    Patient Health Monitoring Pipeline:
    Health Data → Health Analysis → Medication Adjustment → Response Engine
    
    Analyzes patient behavior, vital signs, and sleep patterns to optimize medication timing
    """
    logger.info("=" * 80)
    logger.info("STARTING PATIENT HEALTH MONITORING PIPELINE")
    logger.info(f"Patient: {metadata.get('patient_id')} | Session: {metadata.get('session_id')}")
    logger.info("=" * 80)

    pipeline_result = {
        'health_id': metadata.get('health_id'),
        'patient_id': metadata.get('patient_id'),
        'timestamp': get_timestamp(),
        'pipeline_stages': {},
        'recommendations': None,
        'status_code': 200
    }

    try:
        # ====================================================================
        # STAGE 1: HEALTH DATA ANALYSIS (Behavioral Pattern Analysis)
        # ====================================================================
        logger.info("STAGE 1: Health Data Analysis")
        logger.info("-" * 40)

        health_analysis = health_analysis_engine.analyze(
            image_path,
            metadata
        )

        pipeline_result['pipeline_stages']['health_analysis'] = {
            'status': 'success' if health_analysis['success'] else 'failed',
            'patient_activity': health_analysis.get('activity_level'),
            'sleep_quality': health_analysis.get('sleep_quality'),
            'behavioral_patterns': health_analysis.get('behavioral_patterns'),
            'estimated_vitals': health_analysis.get('estimated_vitals')
        }

        logger.info(f"Health Analysis: Activity={health_analysis.get('activity_level')}, Sleep Quality={health_analysis.get('sleep_quality')}")

        if not health_analysis['success']:
            logger.warning("Unable to analyze health data - returning early")
            # Always set all three pipeline stages, even if skipping later
            pipeline_result['pipeline_stages']['medication_adjustment'] = {
                "status": "skipped",
                "recommendation": "SKIPPED_PHASE_2",
                "confidence": 0.0,
                "reasoning": "Phase-2 engine quarantined"
            }
            pipeline_result['pipeline_stages']['health_response'] = {
                "status": "skipped",
                "response_type": "LOG_ONLY",
                "notifications": [],
                "caregiver_alert": False
            }
            pipeline_result['final_recommendation'] = None
            pipeline_result['final_action'] = 'ANALYSIS_INCOMPLETE'
            pipeline_result['status_code'] = 200
            return pipeline_result

        # ====================================================================
        # STAGE 2: MEDICATION ADJUSTMENT ANALYSIS
        # ====================================================================
        logger.info("STAGE 2: Medication Adjustment Analysis")
        logger.info("-" * 40)

        if PHASE_2_MEDICATION_ENGINE_ENABLED:
            medication_analysis = medication_adjustment_engine.analyze(
                health_analysis,
                metadata
            )
        else:
            medication_analysis = {
                "success": False,
                "recommendation": "SKIPPED_PHASE_2",
                "confidence": 0.0,
                "reasoning": "Phase-2 engine quarantined"
            }

        pipeline_result['pipeline_stages']['medication_adjustment'] = {
            'status': 'success' if medication_analysis.get('success') else 'skipped',
            'recommendation': medication_analysis.get('recommendation'),
            'confidence': medication_analysis.get('confidence'),
            'reasoning': medication_analysis.get('reasoning')
        }

        logger.info(f"Medication Adjustment: {medication_analysis.get('recommendation')} (Confidence: {medication_analysis.get('confidence')}%)")

        # ====================================================================
        # STAGE 3: HEALTH RESPONSE ENGINE
        # ====================================================================
        logger.info("STAGE 3: Health Response Generation")
        logger.info("-" * 40)

        if PHASE_3_RESPONSE_ENGINE_ENABLED:
            health_response = health_response_engine.generate_response(
                health_analysis,
                medication_analysis,
                metadata
            )
        else:
            health_response = {
                "success": True,
                "response_type": "LOG_ONLY",
                "notifications": [],
                "caregiver_alert": False
            }

        pipeline_result['pipeline_stages']['health_response'] = {
            'status': 'success' if health_response.get('success') else 'skipped',
            'response_type': health_response.get('response_type'),
            'notifications': health_response.get('notifications'),
            'caregiver_alert': health_response.get('caregiver_alert')
        }

        logger.info(f"Health Response: {health_response.get('response_type')}")

        # Set final recommendation and action
        pipeline_result['final_recommendation'] = medication_analysis.get('recommendation', 'NO_ACTION')
        pipeline_result['final_action'] = health_response.get('response_type', 'LOG_ONLY')

        logger.info("=" * 80)
        logger.info("PIPELINE COMPLETE")
        logger.info("=" * 80)

        return pipeline_result

    except Exception as e:
        logger.error(f"Pipeline processing error: {str(e)}")
        pipeline_result['status_code'] = 500
        pipeline_result['error'] = str(e)
        # Ensure all three pipeline stages are present, even on error
        if 'health_analysis' not in pipeline_result['pipeline_stages']:
            pipeline_result['pipeline_stages']['health_analysis'] = {}
        if 'medication_adjustment' not in pipeline_result['pipeline_stages']:
            pipeline_result['pipeline_stages']['medication_adjustment'] = {
                "status": "skipped",
                "recommendation": "SKIPPED_PHASE_2",
                "confidence": 0.0,
                "reasoning": "Phase-2 engine quarantined"
            }
        if 'health_response' not in pipeline_result['pipeline_stages']:
            pipeline_result['pipeline_stages']['health_response'] = {
                "status": "skipped",
                "response_type": "LOG_ONLY",
                "notifications": [],
                "caregiver_alert": False
            }
        if 'final_recommendation' not in pipeline_result:
            pipeline_result['final_recommendation'] = None
        if 'final_action' not in pipeline_result:
            pipeline_result['final_action'] = None
        return pipeline_result

# ================================================================================
# API ENDPOINTS - RESULTS & STATUS
# ================================================================================

@app.route('/api/status', methods=['GET'])
def get_system_status():
    """Get current system status"""
    return jsonify({
        "system": "CareSyncVision - Patient Health Monitoring",
        "status": "operational",
        "timestamp": get_timestamp(),
        "components": {
            "health_analysis_engine": "active",
            "medication_adjustment_engine": "active",
            "health_response_engine": "active"
        }
    }), 200

@app.route('/api/config', methods=['GET'])
def get_configuration():
    """Get system configuration"""
    return jsonify({
        "system": "CareSyncVision AI Server - Patient Health Monitoring",
        "version": "1.0.0",
        "upload_folder": UPLOAD_FOLDER,
        "max_upload_size": MAX_UPLOAD_SIZE,
        "allowed_extensions": list(ALLOWED_EXTENSIONS),
        "timestamp": get_timestamp()
    }), 200

# ================================================================================
# ERROR HANDLERS
# ================================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({"error": "Internal server error"}), 500

# ================================================================================
# MAIN
# ================================================================================

if __name__ == '__main__':
    logger.info("Starting CareSyncVision AI Server...")
    logger.info(f"Upload folder: {UPLOAD_FOLDER}")
    logger.info("Patient Health Monitoring system active")
    app.run(host='0.0.0.0', port=5001, debug=True)