"""
Health Response Engine - Executes medication schedules and generates health alerts
Part of the CareSyncVision patient monitoring pipeline
Generates: Patient notifications, caregiver alerts, medication reminders, health reports
"""

import logging
from typing import Dict, List, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class HealthResponseEngine:
    """
    Health Response Engine
    Executes medication schedules and generates appropriate responses/alerts
    """
    
    # Alert severity levels
    ALERT_SEVERITY = {
        'INFO': 'Informational',
        'WARNING': 'Warning - attention needed',
        'CRITICAL': 'Critical - immediate action required'
    }
    
    # Notification types
    NOTIFICATION_TYPES = {
        'medication_reminder': 'Medication reminder',
        'adherence_alert': 'Medication adherence alert',
        'health_check': 'Health check',
        'caregiver_notification': 'Notification for caregiver',
        'schedule_adjustment': 'Medication schedule change',
        'behavior_change': 'Notable behavior change detected'
    }
    
    def __init__(self):
        logger.info("Health Response Engine initialized - Patient response system ready")
    
    def generate_response(self,
                         medication_analysis: Dict[str, Any],
                         health_analysis: Dict[str, Any],
                         metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate health response and alerts based on analysis
        
        Args:
            medication_analysis: Result from medication adjustment engine
            health_analysis: Result from health analysis engine
            metadata: Metadata including patient_id, session_id, timestamp
        
        Returns:
            Dictionary with alerts, notifications, and recommendations
        """
        patient_id = metadata.get('patient_id', 'unknown')
        logger.info(f"Generating health response for patient {patient_id}...")
        
        try:
            # Generate medication reminders
            medication_alerts = self._generate_medication_alerts(medication_analysis)
            logger.info(f"Generated {len(medication_alerts)} medication alerts")
            
            # Generate health alerts based on analysis
            health_alerts = self._generate_health_alerts(health_analysis)
            logger.info(f"Generated {len(health_alerts)} health alerts")
            
            # Generate patient notifications
            patient_notifications = self._generate_patient_notifications(
                medication_analysis,
                health_analysis
            )
            logger.info(f"Generated {len(patient_notifications)} patient notifications")
            
            # Generate caregiver alerts if needed
            caregiver_alert = self._generate_caregiver_alert(
                medication_analysis,
                health_analysis
            )
            
            # Generate health recommendations
            recommendations = self._generate_recommendations(
                medication_analysis,
                health_analysis
            )
            
            # Compile all alerts
            all_alerts = medication_alerts + health_alerts
            
            response = {
                'patient_id': patient_id,
                'timestamp': metadata.get('timestamp'),
                'alerts': all_alerts,
                'notifications': patient_notifications,
                'caregiver_alert': caregiver_alert,
                'recommendations': recommendations,
                'action_required': len(all_alerts) > 0,
                'severity_level': self._determine_overall_severity(all_alerts)
            }
            
            logger.info(f"Health response generated for patient {patient_id}")
            return response
            
        except Exception as e:
            logger.error(f"Error during response generation: {str(e)}")
            return {
                'patient_id': patient_id,
                'timestamp': metadata.get('timestamp'),
                'alerts': [],
                'notifications': [],
                'caregiver_alert': None,
                'recommendations': [],
                'action_required': False,
                'error': str(e)
            }
    
    def _generate_medication_alerts(self, medication_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate medication-related alerts
        """
        alerts = []
        
        # Check if adjustment is needed
        if medication_analysis.get('adjustment_needed'):
            alerts.append({
                'type': 'medication_adjustment',
                'severity': 'WARNING',
                'message': 'Medication timing adjustment recommended',
                'details': medication_analysis.get('recommended_changes', []),
                'action_required': True,
                'timestamp': medication_analysis.get('timestamp')
            })
        
        # Check adherence issues
        adherence_level = medication_analysis.get('adherence_level')
        if adherence_level in ['fair', 'poor']:
            alerts.append({
                'type': 'adherence_alert',
                'severity': 'WARNING' if adherence_level == 'fair' else 'CRITICAL',
                'message': f'Medication adherence is {adherence_level}',
                'adherence_score': medication_analysis.get('adherence_score'),
                'recommendation': 'Improve medication compliance',
                'action_required': True,
                'timestamp': medication_analysis.get('timestamp')
            })
        
        # Check for response pattern issues
        response_patterns = medication_analysis.get('response_patterns', {})
        if len(response_patterns) == 0:
            alerts.append({
                'type': 'no_response_detected',
                'severity': 'WARNING',
                'message': 'No clear medication response detected',
                'suggestion': 'Consult healthcare provider',
                'action_required': True,
                'timestamp': medication_analysis.get('timestamp')
            })
        
        return alerts
    
    def _generate_health_alerts(self, health_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate health-related alerts based on vital signs and activity
        """
        alerts = []
        
        # Check sleep quality
        sleep_quality = health_analysis.get('sleep_quality', 50)
        if sleep_quality < 40:
            alerts.append({
                'type': 'poor_sleep',
                'severity': 'WARNING',
                'message': f'Poor sleep quality detected (score: {sleep_quality})',
                'suggestion': 'Review sleep environment and medication timing',
                'action_required': True,
                'timestamp': health_analysis.get('timestamp')
            })
        
        # Check activity level
        activity_level = health_analysis.get('activity_level', 50)
        if activity_level < 15:
            alerts.append({
                'type': 'low_activity',
                'severity': 'INFO',
                'message': 'Patient has low activity level',
                'note': 'Encourage light movement or physical therapy',
                'action_required': False,
                'timestamp': health_analysis.get('timestamp')
            })
        elif activity_level > 85:
            alerts.append({
                'type': 'excessive_activity',
                'severity': 'INFO',
                'message': 'Patient has high activity level',
                'note': 'Monitor for fatigue or overexertion',
                'action_required': False,
                'timestamp': health_analysis.get('timestamp')
            })
        
        # Check estimated vitals
        estimated_vitals = health_analysis.get('estimated_vitals', {})
        heart_rate = estimated_vitals.get('heart_rate', 75)
        
        if heart_rate > 120:
            alerts.append({
                'type': 'high_heart_rate',
                'severity': 'WARNING',
                'message': f'Elevated heart rate estimated: {heart_rate} bpm',
                'suggestion': 'Check for fever, anxiety, or medication side effects',
                'action_required': True,
                'timestamp': health_analysis.get('timestamp')
            })
        elif heart_rate < 50:
            alerts.append({
                'type': 'low_heart_rate',
                'severity': 'WARNING',
                'message': f'Low heart rate estimated: {heart_rate} bpm',
                'suggestion': 'Monitor closely, contact healthcare provider if symptomatic',
                'action_required': True,
                'timestamp': health_analysis.get('timestamp')
            })
        
        return alerts
    
    def _generate_patient_notifications(self,
                                       medication_analysis: Dict[str, Any],
                                       health_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate notifications for the patient
        """
        notifications = []
        
        # Medication reminder if adjustment recommended
        recommended_changes = medication_analysis.get('recommended_changes', [])
        if recommended_changes:
            for change in recommended_changes:
                notifications.append({
                    'type': 'schedule_adjustment',
                    'title': 'Medication Schedule Update',
                    'message': f"Consider adjusting your medication timing: {change.get('suggestion')}",
                    'priority': 'high',
                    'action_url': '/patient/medication/adjustment'
                })
        
        # Sleep improvement suggestion
        sleep_quality = health_analysis.get('sleep_quality', 50)
        if sleep_quality < 70:
            notifications.append({
                'type': 'health_tip',
                'title': 'Sleep Improvement Tips',
                'message': 'Your sleep quality could be improved. Consider consulting your healthcare provider.',
                'priority': 'medium',
                'action_url': '/patient/health/sleep-tips'
            })
        
        # Activity encouragement
        activity_level = health_analysis.get('activity_level', 50)
        if 20 < activity_level < 40:
            notifications.append({
                'type': 'activity_suggestion',
                'title': 'Gentle Activity Suggestion',
                'message': 'Light activity can help improve overall health. Try gentle stretching or a short walk.',
                'priority': 'low',
                'action_url': '/patient/activity/suggestions'
            })
        
        return notifications
    
    def _generate_caregiver_alert(self,
                                 medication_analysis: Dict[str, Any],
                                 health_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate caregiver alert if significant issues detected
        Returns None if no alert needed, otherwise returns alert details
        """
        issues = []
        
        # Check for critical medication issues
        if medication_analysis.get('adherence_level') == 'poor':
            issues.append('Poor medication adherence')
        
        # Check for concerning health patterns
        sleep_quality = health_analysis.get('sleep_quality', 50)
        if sleep_quality < 30:
            issues.append('Severely poor sleep quality')
        
        activity_level = health_analysis.get('activity_level', 50)
        if activity_level < 10:
            issues.append('Very low activity level - possible health concern')
        
        # Check for vital sign concerns
        estimated_vitals = health_analysis.get('estimated_vitals', {})
        heart_rate = estimated_vitals.get('heart_rate', 75)
        if heart_rate > 130 or heart_rate < 45:
            issues.append(f'Concerning heart rate: {heart_rate} bpm')
        
        # Generate alert only if issues found
        if issues:
            return {
                'alert_type': 'caregiver_notification',
                'severity': 'HIGH' if len(issues) > 2 else 'MEDIUM',
                'issues_detected': issues,
                'message': f'Patient monitoring detected {len(issues)} concerning pattern(s)',
                'recommendation': 'Review patient status and consider healthcare provider contact',
                'timestamp': medication_analysis.get('timestamp'),
                'action_required': True
            }
        
        return None
    
    def _generate_recommendations(self,
                                 medication_analysis: Dict[str, Any],
                                 health_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate actionable recommendations based on combined analysis
        """
        recommendations = []
        
        # Medication-related recommendations
        for change in medication_analysis.get('recommended_changes', []):
            recommendations.append({
                'category': 'medication',
                'title': change.get('type', 'Medication Adjustment'),
                'description': change.get('suggestion'),
                'benefit': change.get('benefit'),
                'priority': change.get('priority', 'medium'),
                'implementation': 'Discuss with healthcare provider before implementing'
            })
        
        # Health-related recommendations
        activity_level = health_analysis.get('activity_level', 50)
        if activity_level < 30:
            recommendations.append({
                'category': 'lifestyle',
                'title': 'Increase Physical Activity',
                'description': 'Gradually increase daily movement and gentle exercise',
                'benefit': 'Improved physical and mental health',
                'priority': 'high',
                'implementation': 'Start with 10-minute walks, increase gradually'
            })
        
        sleep_quality = health_analysis.get('sleep_quality', 50)
        if sleep_quality < 60:
            recommendations.append({
                'category': 'sleep',
                'title': 'Sleep Hygiene Improvement',
                'description': 'Optimize sleep environment and routine',
                'benefit': 'Better sleep quality and medication effectiveness',
                'priority': 'high',
                'implementation': 'Regular sleep schedule, cool dark room, limit screens before bed'
            })
        
        return recommendations
    
    def _determine_overall_severity(self, alerts: List[Dict[str, Any]]) -> str:
        """
        Determine overall severity based on all alerts
        """
        if not alerts:
            return 'normal'
        
        severity_levels = [alert.get('severity', 'INFO') for alert in alerts]
        
        if 'CRITICAL' in severity_levels:
            return 'critical'
        elif 'WARNING' in severity_levels:
            return 'warning'
        else:
            return 'info'
