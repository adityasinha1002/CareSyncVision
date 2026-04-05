"""
Health Record Model
"""

from datetime import datetime
import uuid


class HealthRecord:
    """
    Health data record model
    """
    
    def __init__(self, patient_id, record_type='image', data=None):
        self.record_id = str(uuid.uuid4())
        self.patient_id = patient_id
        self.record_type = record_type  # 'image', 'vital', 'behavioral'
        self.data = data or {}
        self.timestamp = datetime.now()
        self.analysis_result = None
        self.risk_score = None
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'record_id': self.record_id,
            'patient_id': self.patient_id,
            'record_type': self.record_type,
            'data': self.data,
            'timestamp': self.timestamp.isoformat(),
            'analysis_result': self.analysis_result,
            'risk_score': self.risk_score
        }
    
    def set_analysis(self, result, risk_score):
        """Set analysis results"""
        self.analysis_result = result
        self.risk_score = risk_score
