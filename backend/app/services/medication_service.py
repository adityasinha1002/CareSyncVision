"""
Medication Service
Business logic for medication tracking and adherence
"""

import logging
from datetime import datetime, timedelta
from app import db
from app.models.medication_model import Medication
from app.models.patient_model import Patient
from app.models.session_alert_model import Alert

logger = logging.getLogger(__name__)


class MedicationService:
    """
    Service layer for medication operations
    """
    
    def create_medication(self, patient_id, medication_name, dosage, frequency='once_daily', scheduled_time=None):
        """
        Create a new medication record for patient
        
        Args:
            patient_id (str): Patient ID
            medication_name (str): Name of medication
            dosage (str): Dosage information
            frequency (str): Frequency (once_daily, twice_daily, as_needed)
            scheduled_time (time): Scheduled time if applicable
        
        Returns:
            dict: Medication data or error
        """
        try:
            # Verify patient exists
            patient = Patient.query.get(patient_id)
            if not patient:
                return {'success': False, 'error': 'Patient not found', 'status_code': 404}
            
            med = Medication(
                patient_id=patient_id,
                medication_name=medication_name,
                dosage=dosage,
                frequency=frequency,
                scheduled_time=scheduled_time,
                adherence_status='pending'
            )
            
            db.session.add(med)
            db.session.commit()
            
            logger.info(f"Created medication {med.med_id} for patient {patient_id}: {medication_name}")
            
            return {
                'success': True,
                'med_id': med.med_id,
                'message': f'Medication {medication_name} created',
                'data': med.to_dict()
            }
        
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating medication: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}
    
    def record_medication(self, patient_id, medication_data):
        """
        Record a medication administration event
        
        Args:
            patient_id (str): Patient ID
            medication_data (dict): Contains med_id or medication_name, notes, etc.
        
        Returns:
            dict: Result
        """
        try:
            # Verify patient exists
            patient = Patient.query.get(patient_id)
            if not patient:
                return {'success': False, 'error': 'Patient not found', 'status_code': 404}
            
            med_id = medication_data.get('med_id')
            
            med = Medication.query.get(med_id)
            if not med or med.patient_id != patient_id:
                return {'success': False, 'error': 'Medication not found', 'status_code': 404}
            
            # Mark as taken
            med.mark_taken(notes=medication_data.get('notes'))
            
            db.session.commit()
            
            logger.info(f"Recorded medication {med_id} for patient {patient_id}")
            
            return {
                'success': True,
                'med_id': med.med_id,
                'message': 'Medication recorded as taken',
                'data': med.to_dict()
            }
        
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error recording medication: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}
    
    def get_patient_schedule(self, patient_id):
        """
        Get medication schedule for patient
        
        Returns:
            dict: List of medications and schedule
        """
        try:
            # Verify patient exists
            patient = Patient.query.get(patient_id)
            if not patient:
                return {'success': False, 'error': 'Patient not found', 'status_code': 404}
            
            medications = Medication.query.filter_by(patient_id=patient_id).all()
            
            logger.info(f"Retrieved schedule for patient {patient_id}: {len(medications)} medications")
            
            return {
                'success': True,
                'patient_id': patient_id,
                'medications_count': len(medications),
                'medications': [m.to_dict() for m in medications],
                'next_medication_time': self._get_next_medication_time(medications)
            }
        
        except Exception as e:
            logger.error(f"Error retrieving schedule: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}
    
    def get_adherence_metrics(self, patient_id, days=30):
        """
        Get medication adherence metrics for patient
        
        Args:
            patient_id (str): Patient ID
            days (int): Period in days to calculate adherence
        
        Returns:
            dict: Adherence statistics
        """
        try:
            # Verify patient exists
            patient = Patient.query.get(patient_id)
            if not patient:
                return {'success': False, 'error': 'Patient not found', 'status_code': 404}
            
            # Get medications from specified period
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            medications = Medication.query.filter(
                Medication.patient_id == patient_id,
                Medication.created_at >= cutoff_date
            ).all()
            
            if not medications:
                return {
                    'success': True,
                    'patient_id': patient_id,
                    'period_days': days,
                    'total_doses': 0,
                    'doses_taken': 0,
                    'doses_missed': 0,
                    'adherence_rate': 0.0,
                    'status': 'No medications in period'
                }
            
            # Calculate metrics
            total_doses = len(medications)
            doses_taken = sum(1 for m in medications if m.adherence_status == 'taken')
            doses_missed = sum(1 for m in medications if m.adherence_status == 'missed')
            doses_pending = sum(1 for m in medications if m.adherence_status == 'pending')
            
            adherence_rate = (doses_taken / total_doses * 100) if total_doses > 0 else 0
            
            logger.info(f"Retrieved adherence for patient {patient_id}: {adherence_rate}%")
            
            return {
                'success': True,
                'patient_id': patient_id,
                'period_days': days,
                'total_doses': total_doses,
                'doses_taken': doses_taken,
                'doses_missed': doses_missed,
                'doses_pending': doses_pending,
                'adherence_rate': round(adherence_rate, 2),
                'last_updated': datetime.utcnow().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error retrieving adherence: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}
    
    def check_missed_doses(self, patient_id):
        """
        Check for missed doses and create alerts
        
        Args:
            patient_id (str): Patient ID
        
        Returns:
            dict: Missed doses information
        """
        try:
            # Verify patient exists
            patient = Patient.query.get(patient_id)
            if not patient:
                return {'success': False, 'error': 'Patient not found', 'status_code': 404}
            
            # Get medications that should have been taken
            cutoff_time = datetime.utcnow() - timedelta(hours=6)  # 6 hours late
            missed_medications = Medication.query.filter(
                Medication.patient_id == patient_id,
                Medication.scheduled_time.isnot(None),
                Medication.administered == False,
                Medication.created_at <= cutoff_time
            ).all()
            
            # Create alerts for missed doses
            for med in missed_medications:
                existing_alert = Alert.query.filter(
                    Alert.patient_id == patient_id,
                    Alert.alert_type == 'medication',
                    Alert.message.contains(med.medication_name),
                    Alert.resolved_at == None
                ).first()
                
                if not existing_alert:
                    alert = Alert(
                        patient_id=patient_id,
                        alert_type='medication',
                        severity='high',
                        message=f'Missed dose: {med.medication_name} ({med.dosage})'
                    )
                    db.session.add(alert)
                    med.adherence_status = 'missed'
            
            db.session.commit()
            
            logger.info(f"Checked missed doses for patient {patient_id}: {len(missed_medications)} missed")
            
            return {
                'success': True,
                'patient_id': patient_id,
                'missed_doses_count': len(missed_medications),
                'missed_doses': [m.to_dict() for m in missed_medications]
            }
        
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error checking missed doses: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}
    
    def _get_next_medication_time(self, medications):
        """
        Get the next upcoming medication time
        """
        now = datetime.utcnow().time()
        upcoming = [m for m in medications if m.scheduled_time and m.scheduled_time > now]
        
        if not upcoming:
            return None
        
        next_med = min(upcoming, key=lambda m: m.scheduled_time)
        return next_med.scheduled_time.isoformat() if next_med else None

