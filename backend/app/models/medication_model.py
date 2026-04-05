"""
Medication ORM Model using Flask-SQLAlchemy
"""

from datetime import datetime
from app import db
import uuid


class Medication(db.Model):
    """Medication schedule and administration"""
    __tablename__ = 'medications'
    
    med_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = db.Column(db.String(36), db.ForeignKey('patients.patient_id'), nullable=False, index=True)
    medication_name = db.Column(db.String(255), nullable=False, index=True)
    dosage = db.Column(db.String(100))
    frequency = db.Column(db.String(100))  # 'once_daily', 'twice_daily', 'as_needed'
    scheduled_time = db.Column(db.Time)
    
    # Administration tracking
    administered = db.Column(db.Boolean, default=False, index=True)
    administered_time = db.Column(db.DateTime)
    last_taken = db.Column(db.DateTime)
    adherence_status = db.Column(db.String(50), default='pending')  # 'taken', 'pending', 'missed'
    notes = db.Column(db.String(500))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'med_id': self.med_id,
            'patient_id': self.patient_id,
            'medication_name': self.medication_name,
            'dosage': self.dosage,
            'frequency': self.frequency,
            'scheduled_time': self.scheduled_time.isoformat() if self.scheduled_time else None,
            'administered': self.administered,
            'administered_time': self.administered_time.isoformat() if self.administered_time else None,
            'last_taken': self.last_taken.isoformat() if self.last_taken else None,
            'adherence_status': self.adherence_status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def mark_taken(self, notes=None):
        """Mark medication as taken"""
        self.administered = True
        self.administered_time = datetime.utcnow()
        self.last_taken = datetime.utcnow()
        self.adherence_status = 'taken'
        if notes:
            self.notes = notes
    
    def __repr__(self):
        return f'<Medication {self.med_id}: {self.medication_name}>'
