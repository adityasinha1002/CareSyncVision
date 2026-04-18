"""
ESP32 Device Integration Routes (Demo Mode)

This handles simple Bluetooth connection status for ESP32 devices.
Full sensor data integration will be added in Phase 2.
"""

from flask import Blueprint, jsonify, request, g
import logging
from .. import db
from app.models.patient_model import Patient
from app.services.auth_service import token_required

logger = logging.getLogger(__name__)
esp_bp = Blueprint('esp', __name__)


@esp_bp.route('/esp-device/status', methods=['GET'])
@token_required
def get_esp_device_status():
    """
    Get ESP32 device connection status (Demo Mode)

    Returns:
    - device_id: Unique device identifier
    - connected: Connection status (mock for demo)
    - last_sync: Last data sync timestamp
    - battery_level: Simulated battery percentage
    - signal_strength: Simulated Bluetooth signal strength
    """
    current_patient_id = g.patient_id

    try:
        patient = db.session.get(Patient, current_patient_id)
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404

        return jsonify({
            'device_id': f'ESP32-{current_patient_id}',
            'connected': False,  # Demo: always false until user connects
            'last_sync': None,
            'battery_level': 0,
            'signal_strength': 0,
            'demo_mode': True,
            'message': 'Connect to your ESP32 device via Bluetooth to enable monitoring'
        }), 200

    except Exception as e:
        logger.error(f"Error fetching ESP device status: {str(e)}")
        return jsonify({'error': 'Failed to fetch device status'}), 500


@esp_bp.route('/esp-device/connect', methods=['POST'])
@token_required
def connect_esp_device():
    """
    Simulate ESP32 Bluetooth connection (Demo Mode)

    Request body:
    {
        "device_id": "ESP32-xxxx",
        "connection_method": "bluetooth"
    }

    Returns:
    - success: Connection attempt result
    - message: Status message
    - device_info: Device information if connected
    """
    current_patient_id = g.patient_id

    try:
        data = request.get_json()
        device_id = data.get('device_id') if data else None

        if not device_id:
            return jsonify({'error': 'Device ID is required'}), 400

        patient = db.session.get(Patient, current_patient_id)
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404

        # Demo: Simulate successful connection
        return jsonify({
            'success': True,
            'message': f'Demo: ESP32 connection initiated for {device_id}',
            'device_id': device_id,
            'connected': False,  # Still false in demo - user needs real device
            'demo_mode': True,
            'instructions': 'To enable real monitoring: \n1. Download ESP32 firmware from provided link\n2. Flash to your ESP32 board\n3. Connect via Bluetooth from your mobile app\n4. Authorize access to health sensors'
        }), 200

    except Exception as e:
        logger.error(f"Error connecting ESP device: {str(e)}")
        return jsonify({'error': 'Failed to connect device'}), 500


@esp_bp.route('/esp-device/disconnect', methods=['POST'])
@token_required
def disconnect_esp_device():
    """
    Disconnect ESP32 device (Demo Mode)

    Returns:
    - success: Disconnection result
    - message: Status message
    """
    try:
        return jsonify({
            'success': True,
            'message': 'ESP32 device disconnected',
            'connected': False
        }), 200

    except Exception as e:
        logger.error(f"Error disconnecting ESP device: {str(e)}")
        return jsonify({'error': 'Failed to disconnect device'}), 500


@esp_bp.route('/esp-device/firmware', methods=['GET'])
def get_esp_firmware_info():
    """
    Get ESP32 firmware download information (Public endpoint)

    Returns:
    - firmware_version: Current firmware version
    - download_url: Link to firmware binary
    - documentation: Link to setup guide
    - compatible_devices: List of compatible ESP32 boards
    """
    return jsonify({
        'firmware_version': '1.0.0',
        'status': 'Available',
        'compatible_devices': [
            'ESP32-WROOM-32',
            'ESP32-DevKitC',
            'ESP32-CAM'
        ],
        'features': [
            'Heart rate monitoring',
            'Temperature sensing',
            'SpO2 measurement',
            'Motion detection',
            'Real-time data sync'
        ],
        'documentation': '/docs/esp32-setup',
        'source_code': 'https://github.com/adityasinha1002/CareSyncVision/tree/main/ESP32_Main',
        'coming_soon': 'Mobile app Bluetooth integration (Phase 2)'
    }), 200
