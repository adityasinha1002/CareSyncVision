"""
Session and Alert ORM Models using Flask-SQLAlchemy
"""

from datetime import datetime
from app import db
import uuid


class Session(db.Model):
    """Patient authentication sessions"""
    __tablename__ = 'sessions'
    
    session_id = db.Column(db.String(100), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = db.Column(db.String(36), db.ForeignKey('patients.patient_id'), nullable=False, index=True)
    device_id = db.Column(db.String(100), index=True)
    authenticated = db.Column(db.Boolean, default=False)
    started_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    ended_at = db.Column(db.DateTime)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)
    
    def is_active(self):
        """Check if session is still active"""
        return self.ended_at is None
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'session_id': self.session_id,
            'patient_id': self.patient_id,
            'device_id': self.device_id,
            'authenticated': self.authenticated,
            'started_at': self.started_at.isoformat(),
            'ended_at': self.ended_at.isoformat() if self.ended_at else None,
            'last_activity': self.last_activity.isoformat(),
            'is_active': self.is_active()
        }
    
    def __repr__(self):
        return f'<Session {self.session_id}>'


class Alert(db.Model):
    """System alerts and notifications"""
    __tablename__ = 'alerts'
    
    alert_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = db.Column(db.String(36), db.ForeignKey('patients.patient_id'), nullable=False, index=True)
    alert_type = db.Column(db.String(50), nullable=False, index=True)  # 'health', 'medication', 'behavioral', 'system'
    severity = db.Column(db.String(20), nullable=False, index=True)  # 'low', 'medium', 'high', 'critical'
    message = db.Column(db.String(500), nullable=False)
    
    acknowledged = db.Column(db.Boolean, default=False, index=True)
    acknowledged_at = db.Column(db.DateTime)
    acknowledged_by = db.Column(db.String(100))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    resolved_at = db.Column(db.DateTime)
    
    def acknowledge(self, user_id=None):
        """Mark alert as acknowledged"""
        self.acknowledged = True
        self.acknowledged_at = datetime.utcnow()
        self.acknowledged_by = user_id
    
    def resolve(self):
        """Mark alert as resolved"""
        self.resolved_at = datetime.utcnow()
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'alert_id': self.alert_id,
            'patient_id': self.patient_id,
            'alert_type': self.alert_type,
            'severity': self.severity,
            'message': self.message,
            'acknowledged': self.acknowledged,
            'acknowledged_at': self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            'acknowledged_by': self.acknowledged_by,
            'created_at': self.created_at.isoformat(),
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }
    
    def __repr__(self):
        return f'<Alert {self.alert_id}: {self.severity}>'
