"""
Patient Model
"""

from datetime import datetime
import uuid


class Patient:
    """
    Patient data model
    """
    
    def __init__(self, patient_id=None, name=None, age=None, conditions=None):
        self.patient_id = patient_id or str(uuid.uuid4())
        self.name = name
        self.age = age
        self.conditions = conditions or []
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        self.active = True
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'patient_id': self.patient_id,
            'name': self.name,
            'age': self.age,
            'conditions': self.conditions,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'active': self.active
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create from dictionary"""
        patient = cls(
            patient_id=data.get('patient_id'),
            name=data.get('name'),
            age=data.get('age'),
            conditions=data.get('conditions', [])
        )
        return patient
