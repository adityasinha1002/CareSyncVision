"""
Alert Model
"""

from datetime import datetime
import uuid


class Alert:
    """
    System alert model
    """
    
    SEVERITY_LOW = 'low'
    SEVERITY_MEDIUM = 'medium'
    SEVERITY_HIGH = 'high'
    SEVERITY_CRITICAL = 'critical'
    
    TYPE_HEALTH = 'health'
    TYPE_MEDICATION = 'medication'
    TYPE_BEHAVIORAL = 'behavioral'
    TYPE_SYSTEM = 'system'
    
    def __init__(self, patient_id, alert_type, severity, message):
        self.alert_id = str(uuid.uuid4())
        self.patient_id = patient_id
        self.alert_type = alert_type
        self.severity = severity
        self.message = message
        self.created_at = datetime.now()
        self.acknowledged = False
        self.acknowledged_at = None
        self.acknowledged_by = None
    
    def acknowledge(self, user_id=None):
        """Mark alert as acknowledged"""
        self.acknowledged = True
        self.acknowledged_at = datetime.now()
        self.acknowledged_by = user_id
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'alert_id': self.alert_id,
            'patient_id': self.patient_id,
            'alert_type': self.alert_type,
            'severity': self.severity,
            'message': self.message,
            'created_at': self.created_at.isoformat(),
            'acknowledged': self.acknowledged,
            'acknowledged_at': self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            'acknowledged_by': self.acknowledged_by
        }
