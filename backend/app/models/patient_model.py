"""
Patient ORM Model using Flask-SQLAlchemy
"""

from datetime import datetime
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
import uuid


class Patient(db.Model):
    """Patient information table"""
    __tablename__ = 'patient'
    
    patient_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=True, index=True)  # Nullable for backward compatibility
    password_hash = db.Column(db.String(255), nullable=True)  # Nullable for backward compatibility
    name = db.Column(db.String(255), nullable=False, index=True)
    age = db.Column(db.Integer)
    medical_conditions = db.Column(db.JSON, default=[])
    contact_info = db.Column(db.JSON)
    esp32_enabled = db.Column(db.Boolean, default=False)  # ESP32 device integration toggle
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    active = db.Column(db.Boolean, default=True, index=True)
    
    # Relationships
    health_records = db.relationship('HealthRecord', backref='patient', lazy='dynamic', cascade='all, delete-orphan')
    medications = db.relationship('Medication', backref='patient', lazy='dynamic', cascade='all, delete-orphan')
    sessions = db.relationship('Session', backref='patient', lazy='dynamic', cascade='all, delete-orphan')
    alerts = db.relationship('Alert', backref='patient', lazy='dynamic', cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password) if self.password_hash else False
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'patient_id': self.patient_id,
            'email': self.email,
            'name': self.name,
            'age': self.age,
            'medical_conditions': self.medical_conditions,
            'contact_info': self.contact_info,
            'esp32_enabled': self.esp32_enabled,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'active': self.active
        }
    
    def __repr__(self):
        return f'<Patient {self.patient_id}: {self.name} ({self.email})>'
