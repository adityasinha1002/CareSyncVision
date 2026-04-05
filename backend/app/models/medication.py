"""
Medication Model
"""

from datetime import datetime
import uuid


class Medication:
    """
    Medication record model
    """
    
    def __init__(self, patient_id, medication_name, dosage, scheduled_time=None):
        self.med_id = str(uuid.uuid4())
        self.patient_id = patient_id
        self.medication_name = medication_name
        self.dosage = dosage
        self.scheduled_time = scheduled_time
        self.administered = False
        self.administered_time = None
        self.notes = None
        self.created_at = datetime.now()
    
    def mark_administered(self, administered_time=None, notes=None):
        """Mark medication as administered"""
        self.administered = True
        self.administered_time = administered_time or datetime.now()
        self.notes = notes
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'med_id': self.med_id,
            'patient_id': self.patient_id,
            'medication_name': self.medication_name,
            'dosage': self.dosage,
            'scheduled_time': self.scheduled_time.isoformat() if self.scheduled_time else None,
            'administered': self.administered,
            'administered_time': self.administered_time.isoformat() if self.administered_time else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }
