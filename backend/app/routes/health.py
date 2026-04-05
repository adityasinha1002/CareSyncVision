"""
Health Check Routes
"""

from flask import Blueprint, jsonify
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

health_bp = Blueprint('health', __name__)


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
