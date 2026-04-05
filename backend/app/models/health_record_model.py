"""
Health Record ORM Model using Flask-SQLAlchemy
"""

from datetime import datetime
from app import db
import uuid


class HealthRecord(db.Model):
    """Patient health data records"""
    __tablename__ = 'health_records'
    
    record_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = db.Column(db.String(36), db.ForeignKey('patients.patient_id'), nullable=False, index=True)
    record_type = db.Column(db.String(50), nullable=False)  # 'image', 'vital', 'behavioral'
    image_filename = db.Column(db.String(255))
    device_id = db.Column(db.String(100), index=True)
    session_id = db.Column(db.String(100))
    data = db.Column(db.JSON)
    
    # Analysis results
    analysis_result = db.Column(db.JSON)
    risk_score = db.Column(db.Float, default=0.0, index=True)
    
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'record_id': self.record_id,
            'patient_id': self.patient_id,
            'record_type': self.record_type,
            'image_filename': self.image_filename,
            'device_id': self.device_id,
            'session_id': self.session_id,
            'data': self.data,
            'analysis_result': self.analysis_result,
            'risk_score': self.risk_score,
            'timestamp': self.timestamp.isoformat()
        }
    
    def __repr__(self):
        return f'<HealthRecord {self.record_id}: {self.patient_id}>'
