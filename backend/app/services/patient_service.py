"""
Patient Service
Business logic for patient health data processing and management
"""

import logging
import os
from datetime import datetime, timedelta
from app import db
from app.models.patient_model import Patient
from app.models.health_record_model import HealthRecord
from app.models.session_alert_model import Alert

logger = logging.getLogger(__name__)


class PatientService:
    """
    Service layer for patient data operations
    """
    
    # Risk score thresholds
    RISK_LOW_THRESHOLD = 30
    RISK_HIGH_THRESHOLD = 70
    
    def create_patient(self, name, age, medical_conditions=None, contact_info=None):
        """
        Create a new patient record
        
        Args:
            name (str): Patient name
            age (int): Patient age
            medical_conditions (list): List of medical conditions
            contact_info (dict): Contact information
        
        Returns:
            dict: Patient data or error
        """
        try:
            patient = Patient(
                name=name,
                age=age,
                medical_conditions=medical_conditions or [],
                contact_info=contact_info or {}
            )
            
            db.session.add(patient)
            db.session.commit()
            
            logger.info(f"Created patient {patient.patient_id}: {name}")
            
            return {
                'success': True,
                'patient_id': patient.patient_id,
                'message': f'Patient {name} created successfully',
                'data': patient.to_dict()
            }
        
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating patient: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}
    
    def get_patient(self, patient_id):
        """
        Get patient by ID with recent health records
        """
        try:
            patient = Patient.query.get(patient_id)
            
            if not patient:
                logger.warning(f"Patient {patient_id} not found")
                return {'success': False, 'error': 'Patient not found', 'status_code': 404}
            
            # Get last 7 days of health records
            recent_records = HealthRecord.query.filter(
                HealthRecord.patient_id == patient_id,
                HealthRecord.timestamp >= datetime.utcnow() - timedelta(days=7)
            ).order_by(HealthRecord.timestamp.desc()).limit(10).all()
            
            # Get current risk score (from latest record)
            latest_record = HealthRecord.query.filter(
                HealthRecord.patient_id == patient_id
            ).order_by(HealthRecord.timestamp.desc()).first()
            
            current_risk = latest_record.risk_score if latest_record else 0
            
            return {
                'success': True,
                'data': {
                    **patient.to_dict(),
                    'current_risk_score': current_risk,
                    'recent_records_count': len(recent_records),
                    'last_updated': latest_record.timestamp.isoformat() if latest_record else None
                }
            }
        
        except Exception as e:
            logger.error(f"Error retrieving patient: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}
    
    def get_patient_list(self, active_only=True, limit=100):
        """
        Get list of patients
        """
        try:
            query = Patient.query
            if active_only:
                query = query.filter_by(active=True)
            
            patients = query.limit(limit).all()
            
            return {
                'success': True,
                'count': len(patients),
                'data': [p.to_dict() for p in patients]
            }
        
        except Exception as e:
            logger.error(f"Error retrieving patient list: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}
    
    def update_patient(self, patient_id, **kwargs):
        """
        Update patient information
        """
        try:
            patient = Patient.query.get(patient_id)
            
            if not patient:
                return {'success': False, 'error': 'Patient not found', 'status_code': 404}
            
            # Update allowed fields
            allowed_fields = ['name', 'age', 'medical_conditions', 'contact_info', 'active']
            for field, value in kwargs.items():
                if field in allowed_fields:
                    setattr(patient, field, value)
            
            db.session.commit()
            logger.info(f"Updated patient {patient_id}")
            
            return {
                'success': True,
                'message': 'Patient updated successfully',
                'data': patient.to_dict()
            }
        
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating patient: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}
    
    def process_patient_data(self, patient_data):
        """
        Process patient health data through analysis pipeline
        
        Args:
            patient_data (dict): Contains patient_id, image_path, timestamp, etc.
        
        Returns:
            dict: Analysis result and metadata
        """
        try:
            patient_id = patient_data.get('patient_id')
            image_path = patient_data.get('image_path')
            
            # Verify patient exists
            patient = Patient.query.get(patient_id)
            if not patient:
                return {
                    'status_code': 404,
                    'success': False,
                    'error': 'Patient not found'
                }
            
            # Create health record
            record = HealthRecord(
                patient_id=patient_id,
                record_type='image',
                image_filename=patient_data.get('image_filename'),
                device_id=patient_data.get('device_id'),
                session_id=patient_data.get('session_id'),
                data={
                    'filename': patient_data.get('image_filename'),
                    'file_size': os.path.getsize(image_path) if os.path.exists(image_path) else 0
                }
            )
            
            # Calculate risk score based on image analysis
            # TODO: Integrate with actual AI analysis engine
            risk_score = self._calculate_risk_score(patient_id)
            record.risk_score = risk_score
            
            # Create alerts if needed
            self._check_and_create_alerts(patient_id, risk_score)
            
            db.session.add(record)
            db.session.commit()
            
            logger.info(f"Processed health data for patient {patient_id} - Risk: {risk_score}")
            
            return {
                'status_code': 200,
                'success': True,
                'message': 'Health data processed',
                'record_id': record.record_id,
                'patient_id': patient_id,
                'risk_score': risk_score,
                'timestamp': datetime.utcnow().isoformat()
            }
        
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error processing patient data: {str(e)}", exc_info=True)
            return {
                'status_code': 500,
                'success': False,
                'error': str(e)
            }
    
    def process_vitals(self, vitals_data):
        """
        Process vital signs data
        
        Args:
            vitals_data (dict): Vital signs (HR, SpO2, temp, BP)
        
        Returns:
            dict: Processing result
        """
        try:
            patient_id = vitals_data.get('patient_id')
            
            # Verify patient exists
            patient = Patient.query.get(patient_id)
            if not patient:
                return {'success': False, 'error': 'Patient not found', 'status_code': 404}
            
            # Create health record for vitals
            record = HealthRecord(
                patient_id=patient_id,
                record_type='vital',
                data={
                    'heart_rate': vitals_data.get('heart_rate'),
                    'spo2': vitals_data.get('spo2'),
                    'temperature': vitals_data.get('temperature'),
                    'blood_pressure': vitals_data.get('blood_pressure')
                }
            )
            
            # Calculate risk based on vitals
            risk_score = self._calculate_risk_from_vitals(vitals_data)
            record.risk_score = risk_score
            
            db.session.add(record)
            db.session.commit()
            
            logger.info(f"Processing vitals for patient {patient_id}")
            
            return {
                'success': True,
                'message': 'Vitals data received',
                'patient_id': patient_id,
                'risk_score': risk_score,
                'timestamp': datetime.utcnow().isoformat()
            }
        
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error processing vitals: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}
    
    def get_patient_history(self, patient_id, days=7, limit=100):
        """
        Retrieve patient health data history
        """
        try:
            # Verify patient exists
            patient = Patient.query.get(patient_id)
            if not patient:
                return {'success': False, 'error': 'Patient not found', 'status_code': 404}
            
            # Get records from specified time period
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            records = HealthRecord.query.filter(
                HealthRecord.patient_id == patient_id,
                HealthRecord.timestamp >= cutoff_date
            ).order_by(HealthRecord.timestamp.desc()).limit(limit).all()
            
            logger.info(f"Retrieved history for patient {patient_id}: {len(records)} records")
            
            return {
                'success': True,
                'patient_id': patient_id,
                'period_days': days,
                'records_count': len(records),
                'records': [r.to_dict() for r in records]
            }
        
        except Exception as e:
            logger.error(f"Error retrieving history: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}
    
    def _calculate_risk_score(self, patient_id):
        """
        Calculate risk score based on patient history
        This is a simplified calculation - in production, use ML model
        """
        try:
            # Get recent records
            recent_records = HealthRecord.query.filter(
                HealthRecord.patient_id == patient_id,
                HealthRecord.timestamp >= datetime.utcnow() - timedelta(days=7)
            ).all()
            
            if not recent_records:
                return 25  # Baseline risk
            
            # Calculate based on average of recent risk scores
            avg_risk = sum(r.risk_score for r in recent_records) / len(recent_records)
            
            # Add some variation based on trend
            if len(recent_records) > 1:
                latest = recent_records[0].risk_score
                previous = recent_records[-1].risk_score
                trend = (latest - previous) / max(previous, 1)
                
                # If risk is increasing, add penalty
                if trend > 0.1:
                    avg_risk += trend * 10
            
            return min(100, max(0, int(avg_risk)))
        
        except Exception as e:
            logger.warning(f"Error calculating risk score: {str(e)}")
            return 50  # Default middle risk
    
    def _calculate_risk_from_vitals(self, vitals_data):
        """
        Calculate risk from vital signs
        """
        risk = 25  # Baseline
        
        # Heart rate: normal 60-100
        hr = vitals_data.get('heart_rate', 80)
        if hr < 50 or hr > 120:
            risk += 15
        elif hr < 60 or hr > 100:
            risk += 5
        
        # SpO2: normal > 95
        spo2 = vitals_data.get('spo2', 98)
        if spo2 < 90:
            risk += 25
        elif spo2 < 95:
            risk += 10
        
        # Temperature: normal 36.5-37.5
        temp = vitals_data.get('temperature', 37)
        if temp < 35 or temp > 39:
            risk += 20
        elif temp < 36.5 or temp > 38:
            risk += 5
        
        return min(100, max(0, risk))
    
    def _check_and_create_alerts(self, patient_id, risk_score):
        """
        Create alerts based on risk score and conditions
        """
        try:
            # Clear old high-risk alerts if risk decreased
            if risk_score < self.RISK_HIGH_THRESHOLD:
                Alert.query.filter(
                    Alert.patient_id == patient_id,
                    Alert.alert_type == 'health',
                    Alert.resolved_at == None
                ).update({'resolved_at': datetime.utcnow()})
            
            # Create new alert if risk is high
            if risk_score >= self.RISK_HIGH_THRESHOLD:
                existing_alert = Alert.query.filter(
                    Alert.patient_id == patient_id,
                    Alert.alert_type == 'health',
                    Alert.resolved_at == None
                ).first()
                
                if not existing_alert:
                    severity = 'critical' if risk_score >= 85 else 'high'
                    alert = Alert(
                        patient_id=patient_id,
                        alert_type='health',
                        severity=severity,
                        message=f'High health risk detected (Score: {risk_score})'
                    )
                    db.session.add(alert)
            
            db.session.commit()
        
        except Exception as e:
            logger.warning(f"Error creating alerts: {str(e)}")
            db.session.rollback()

