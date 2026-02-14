"""
CareSyncVision - Data Format Specifications
This document defines the data structures used throughout the system
"""

# ==============================================================================
# SENSOR DATA STRUCTURES
# ==============================================================================

SENSOR_DATA_TEMPERATURE = {
    "device_id": "ESP32-MAIN",
    "sensor_type": "temperature",
    "value": 37.5,
    "unit": "Celsius",
    "timestamp": "2024-01-15T10:30:45.123Z",
    "accuracy": 0.5,
    "status": "ok"
}

SENSOR_DATA_MOTION = {
    "device_id": "ESP32-MAIN",
    "sensor_type": "motion",
    "value": 750,
    "unit": "ADC",
    "timestamp": "2024-01-15T10:30:45.123Z",
    "threshold": 500,
    "status": "active"
}

SENSOR_DATA_LIGHT = {
    "device_id": "ESP32-MAIN",
    "sensor_type": "light",
    "value": 150,
    "unit": "lux",
    "timestamp": "2024-01-15T10:30:45.123Z",
    "threshold": 200,
    "status": "low"
}

SENSOR_DATA_TOUCH = {
    "device_id": "ESP32-MAIN",
    "sensor_type": "touch",
    "value": 1,
    "unit": "boolean",
    "timestamp": "2024-01-15T10:30:45.123Z",
    "status": "detected"
}

# ==============================================================================
# FACE DETECTION RESULT
# ==============================================================================

FACE_DETECTION_RESULT = {
    "success": True,
    "face_count": 1,
    "avg_confidence": 0.85,
    "image_shape": [480, 640, 3],
    "processing_time": 125,
    "faces": [
        {
            "id": 0,
            "x": 150,
            "y": 100,
            "width": 200,
            "height": 250,
            "area": 50000,
            "confidence": 0.85
        }
    ]
}

# ==============================================================================
# HEALTH ANALYSIS
# ==============================================================================

HEALTH_ANALYSIS_RESULT = {
    "health_score": 35,
    "health_level": "MEDIUM",
    "face_count": 1,
    "confidence": 0.85,
    "device_id": "ESP32-CAM-MB",
    "timestamp": "2024-01-15T10:30:45.123Z",
    "health_factors": [
        {
            "factor": "multiple_faces",
            "value": 2,
            "weight": 15
        },
        {
            "factor": "low_confidence",
            "value": 0.45,
            "weight": 15
        }
    ]
}

# ==============================================================================
# MEDICATION ADJUSTMENT OUTPUT
# ==============================================================================

MEDICATION_ADJUSTMENT_OUTPUT = {
    "recommendation": "REVIEW",
    "confidence": 70,
    "priority": "MEDIUM",
    "health_score": 35,
    "health_level": "MEDIUM",
    "reasoning": [
        "Multiple faces detected (affects monitoring)",
        "Low confidence requires additional observation"
    ],
    "metadata": {
        "timestamp": "2024-01-15T10:30:45.123Z",
        "device_id": "ESP32-CAM-MB",
        "image_id": "abc123"
    }
}

# Decision Types:
# - "ALLOW": Grant full access
# - "VERIFY": Request additional verification
# - "BLOCK": Deny access
# - "ALERT": Trigger security alert
# - "NO_ACTION": No action required

# ==============================================================================
# HEALTH RESPONSE RESULT
# ==============================================================================

HEALTH_RESPONSE_RESULT = {
    "action": "REVIEW",
    "type": "recommendation",
    "timestamp": "2024-01-15T10:30:45.123Z",
    "notifications_sent": ["device", "caregiver"],
    "details": {
        "executed_actions": [
            "request_additional_observation",
            "capture_additional_data",
            "notify_caregiver"
        ],
        "results": {
            "request_additional_observation": {
                "status": "success",
                "action": "observation_requested",
                "method": "local_check"
            },
            "capture_additional_data": {
                "status": "success",
                "action": "data_capture_initiated",
                "duration": "30s"
            },
            "notify_caregiver": {
                "status": "success",
                "action": "caregiver_notified",
                "method": "email"
            }
        }
    }
}

# ==============================================================================
# COMPLETE PIPELINE RESPONSE
# ==============================================================================

PIPELINE_RESPONSE = {
    "image_id": "abc123",
    "timestamp": "2024-01-15T10:30:45.123Z",
    "final_recommendation": "REVIEW",
    "status_code": 200,
    "pipeline_stages": {
        "detection": {
            "status": "success",
            "faces_detected": 1,
            "confidence": 0.85,
            "raw_data": "FACE_DETECTION_RESULT"
        },
        "health_analysis": {
            "status": "success",
            "health_level": "MEDIUM",
            "health_score": 35,
            "factors": ["multiple_faces", "low_confidence"]
        },
        "decision": {
            "status": "success",
            "decision": "VERIFY",
            "confidence": 70,
            "reasoning": ["List of decision reasons"]
        },
        "action": {
            "status": "success",
            "action": "VERIFY",
            "details": "ACTION_ENGINE_RESULT"
        }
    }
}

# ==============================================================================
# ERROR RESPONSES
# ==============================================================================

ERROR_EMPTY_IMAGE = {
    "error": "Empty image data",
    "status_code": 400,
    "message": "No image data provided in request"
}

ERROR_NO_FACES = {
    "image_id": "abc123",
    "timestamp": "2024-01-15T10:30:45.123Z",
    "final_action": "NO_DETECTION",
    "status_code": 200,
    "error": "No faces detected in image",
    "pipeline_stages": {
        "detection": {
ERROR_SERVER_ERROR = {
# HEALTH SCORING ALGORITHM

"""
Health Score Calculation:

1. Initialize score = 0
2. For each health factor:
     - Evaluate condition
     - If true, add weight to score
3. Normalize score to 0-100
4. Map to concern level:
     - 0-30: LOW
     - 30-60: MEDIUM
     - 60-100: HIGH

Health Factors:
- multiple_faces: weight=20
- unexpected_face: weight=20
- night_detection: weight=25
- unusual_timing: weight=20
- sensor_anomaly: weight=20
- low_confidence: weight=15
- unknown_device: weight=10
"""
    "error": "Server error",
    "message": "Error description",
    "status_code": 500
}

# ==============================================================================
# UART COMMUNICATION PROTOCOL
# ==============================================================================

# ESP32 Main → ESP32-CAM Commands:
UART_COMMAND_CAPTURE = "CAPTURE\n"
UART_COMMAND_STATUS = "STATUS\n"
UART_COMMAND_CONFIG = "CONFIG:param=value\n"

# ESP32-CAM → ESP32 Main Responses:
UART_RESPONSE_OK = "CAM:OK\n"
UART_RESPONSE_CAPTURE = "[CAPTURE] Image captured\n"
UART_RESPONSE_ERROR = "[ERROR] Error message\n"

# ESP32-CAM → ESP32 Main Log Events:
UART_LOG_FORMAT = "[EVENT_TYPE] Message\n"
# Example: "[CAPTURE] Capturing image...\n"

# ==============================================================================
# SENSOR READING THRESHOLDS
# RECOMMENDATION LOGIC

"""
Recommendation Logic:

1. Get health_level from Health Analysis Engine
2. Apply base recommendation rule:
     - LOW → MAINTAIN (95% confidence)
     - MEDIUM → MONITOR (70% confidence)
     - HIGH → RECOMMEND_ADJUSTMENT (85% confidence)

3. Apply context adjustments:
     - If health_score > 80: Escalate to URGENT_ALERT
     - If face_count == 0: Consider NO_ACTION (data missing)
     - If confidence < 0.3: Recommend additional observation
     - If face_count > 3: Increase monitoring frequency

4. Determine priority:
     - CRITICAL: Emergency level
     - HIGH: Immediate caregiver attention
     - MEDIUM: Clinical review
     - LOW: Routine monitoring
"""
# ==============================================================================

THRESHOLDS = {
    "temperature": {
        "unit": "Celsius",
        "normal": (36.0, 37.5),
        "caution": (37.5, 38.5),
        "alert": (38.5, 40.0),
        "critical": (40.0, float('inf'))
    },
    "motion": {
        "unit": "ADC",
        "threshold": 500,
        "range": (0, 4095)
    },
    "light": {
        "unit": "lux",
        "threshold": 200,
        "range": (0, 4095)
    }
}

# ==============================================================================
# RISK SCORING ALGORITHM
# ==============================================================================

"""
Risk Score Calculation:

1. Initialize score = 0
2. For each risk factor:
   - Evaluate condition
   - If true, add weight to score
3. Normalize score to 0-100
# HEALTH RESPONSE MAPPING

"""
Recommendation → Health Response Mapping:

MAINTAIN:
    - maintain_schedule
    - log_event
    → Notifications: device

MONITOR:
    - request_additional_observation
    - capture_additional_data
    - notify_caregiver
    → Notifications: device, caregiver

RECOMMEND_ADJUSTMENT:
    - suggest_schedule_change
    - notify_caregiver
    - log_recommendation
    → Notifications: caregiver, admin

URGENT_ALERT:
    - trigger_alarm
    - notify_caregiver
    - escalate_to_emergency
    → Notifications: device, caregiver, emergency

NO_ACTION:
    - log_event
    → Notifications: none
"""
4. Map to risk level:
   - 0-30: LOW
   - 30-60: MEDIUM
   - 60-100: HIGH

Risk Factors:
- unusual_timing: weight=20
- sensor_anomaly: weight=20
"""

# ==============================================================================
# DECISION RULES
# ==============================================================================

"""
Decision Making Logic:

1. Get risk_level from Risk Engine
2. Apply base decision rule:
   - LOW → ALLOW (95% confidence)
   - MEDIUM → VERIFY (70% confidence)
   - HIGH → BLOCK (85% confidence)

3. Apply context adjustments:
   - If risk_score > 80: Override to BLOCK
   - If face_count == 0: Override to NO_ACTION
   - If confidence < 0.3: Override to VERIFY
   - If face_count > 3: Override to ALERT

4. Determine priority:
   - CRITICAL: Emergency level
   - HIGH: Immediate attention needed
   - MEDIUM: Standard processing
   - LOW: Background processing
"""

# ==============================================================================
# ACTION MAPPING
# ==============================================================================

"""
Decision → Actions Mapping:

ALLOW:
  - grant_access
  - log_event
  → Notifications: device

VERIFY:
  - request_additional_auth
  - capture_additional_data
  - notify_admin
  → Notifications: device, admin

BLOCK:
  - deny_access
  - alert_system
  - log_security_event
  → Notifications: device, admin, security

ALERT:
  - trigger_alarm
  - notify_security
  - record_incident
  → Notifications: device, admin, security, emergency

NO_ACTION:
  - log_event
  → Notifications: none
"""

# ==============================================================================
# TIMESTAMP FORMATS
# ==============================================================================

"""
All timestamps use ISO 8601 format with milliseconds:
- Format: YYYY-MM-DDTHH:MM:SS.sssZ
- Example: 2024-01-15T10:30:45.123Z
- Timezone: Always UTC (Z suffix)

For logging with millis() (in firmware):
- Use epoch milliseconds
- Example: 1705324245123
"""

# ==============================================================================
# NOTES
# ==============================================================================

"""
Key Points:

1. All numeric IDs are strings (device_id, image_id)
2. Confidence values are floats (0.0-1.0), not percentages
3. Risk scores are integers (0-100)
4. Decision confidence is integer percentage (0-100)
5. All timestamps must be in ISO 8601 format
6. ADC values are 0-4095 for 12-bit resolution
7. Weights sum to maximum possible score (100)
8. Risk levels are always uppercase strings
9. Decisions are always uppercase strings
10. All error messages should include error type and details
"""
