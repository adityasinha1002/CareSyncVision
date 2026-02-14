"""
Action Engine (LEGACY) - Executes decisions and triggers actions.
This module is retained for compatibility. New caregiver-focused responses
are implemented in `health_response_engine.py`.
"""

import logging
from typing import Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class ActionEngine:
    """
    Action Execution Engine
    Executes decisions and triggers appropriate system responses
    """
    
    # Action definitions
    ACTIONS = {
        'ALLOW': {
            'type': 'permission',
            'actions': ['grant_access', 'log_event'],
            'notifications': ['device']
        },
        'VERIFY': {
            'type': 'verification',
            'actions': ['request_additional_auth', 'capture_additional_data', 'notify_admin'],
            'notifications': ['device', 'admin']
        },
        'BLOCK': {
            'type': 'legacy_security',
            'actions': ['deny_access', 'alert_system', 'log_security_event'],
            'notifications': ['device', 'admin', 'caregiver']
        },
        'ALERT': {
            'type': 'emergency',
            'actions': ['trigger_alarm', 'notify_security', 'record_incident'],
            'notifications': ['device', 'admin', 'caregiver', 'emergency']
        },
        'NO_ACTION': {
            'type': 'null',
            'actions': ['log_event'],
            'notifications': []
        }
    }
    
    def __init__(self):
        logger.info("Action Engine (legacy) initialized - use health_response_engine.py for new responses")
        self.action_history = []
    
    def execute(self, decision: Dict[str, Any],
                detection_result: Dict[str, Any],
                risk_assessment: Dict[str, Any],
                metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute actions based on decision
        
        Args:
            decision: Output from Decision Engine
            detection_result: Output from face detector
            risk_assessment: Output from Risk Engine
            metadata: Metadata from the request
        
        Returns:
            Dictionary with executed actions and results
        """
        logger.info("Executing actions...")
        
        decision_type = decision.get('decision', 'NO_ACTION')
        action_config = self.ACTIONS.get(decision_type, self.ACTIONS['NO_ACTION'])
        
        execution_result = {
            'action': decision_type,
            'type': action_config['type'],
            'details': self._execute_action_sequence(decision_type, action_config, metadata),
            'timestamp': datetime.now().isoformat(),
            'notifications_sent': action_config.get('notifications', [])
        }
        
        # Log action history
        self.action_history.append(execution_result)
        
        logger.info(f"Actions Executed for {decision_type}")
        logger.info(f"Notifications: {action_config.get('notifications', [])}")
        
        return execution_result
    
    def _execute_action_sequence(self, decision_type: str, action_config: Dict[str, Any],
                                metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a sequence of actions
        
        Args:
            decision_type: Type of decision
            action_config: Action configuration
            metadata: Metadata for the action
        
        Returns:
            Dictionary with execution details
        """
        execution_details = {
            'executed_actions': [],
            'results': {}
        }
        
        for action in action_config.get('actions', []):
            try:
                if action == 'grant_access':
                    result = self._grant_access(metadata)
                elif action == 'deny_access':
                    result = self._deny_access(metadata)
                elif action == 'request_additional_auth':
                    result = self._request_additional_auth(metadata)
                elif action == 'alert_system':
                    result = self._alert_system(metadata)
                elif action == 'trigger_alarm':
                    result = self._trigger_alarm(metadata)
                elif action == 'notify_admin':
                    result = self._notify_admin(metadata)
                elif action == 'notify_security':
                    result = self._notify_security(metadata)
                elif action == 'log_event':
                    result = self._log_event(metadata)
                elif action == 'log_security_event':
                    result = self._log_security_event(metadata)
                elif action == 'capture_additional_data':
                    result = self._capture_additional_data(metadata)
                elif action == 'record_incident':
                    result = self._record_incident(metadata)
                else:
                    result = {'status': 'unknown', 'message': f'Unknown action: {action}'}
                
                execution_details['executed_actions'].append(action)
                execution_details['results'][action] = result
                logger.info(f"Action executed: {action} - {result.get('status', 'unknown')}")
                
            except Exception as e:
                logger.error(f"Error executing action {action}: {str(e)}")
                execution_details['results'][action] = {'status': 'error', 'message': str(e)}
        
        return execution_details
    
    # Action implementations
    def _grant_access(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Grant access to device"""
        logger.info(f"Granting access to device: {metadata.get('device_id')}")
        return {'status': 'success', 'action': 'access_granted'}
    
    def _deny_access(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Deny access to device"""
        logger.warning(f"Denying access to device: {metadata.get('device_id')}")
        return {'status': 'success', 'action': 'access_denied'}
    
    def _request_additional_auth(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Request additional authentication"""
        logger.info(f"Requesting additional authentication from: {metadata.get('device_id')}")
        return {'status': 'success', 'action': 'auth_requested', 'method': 'biometric'}
    
    def _alert_system(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Trigger legacy alert (mapped to caregiver/emergency workflows)"""
        logger.warning(f"Triggering legacy alert - Device: {metadata.get('device_id')}")
        return {'status': 'success', 'action': 'system_alerted', 'severity': 'high'}
    
    def _trigger_alarm(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Trigger alarm"""
        logger.critical(f"ALARM TRIGGERED - Device: {metadata.get('device_id')}")
        return {'status': 'success', 'action': 'alarm_triggered', 'severity': 'critical'}
    
    def _notify_admin(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Notify administrator"""
        logger.info(f"Notifying administrator - Device: {metadata.get('device_id')}")
        return {'status': 'success', 'action': 'admin_notified', 'method': 'email'}
    
    def _notify_security(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Notify caregiver/clinical team (legacy)"""
        logger.warning(f"Notifying caregiver/clinical team - Device: {metadata.get('device_id')}")
        return {'status': 'success', 'action': 'caregiver_notified', 'method': 'direct'}
    
    def _log_event(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Log regular event"""
        logger.info(f"Logging event - Device: {metadata.get('device_id')}")
        return {'status': 'success', 'action': 'event_logged'}
    
    def _log_security_event(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Log legacy security event (for audit)"""
        logger.warning(f"Logging legacy security event - Device: {metadata.get('device_id')}")
        return {'status': 'success', 'action': 'security_event_logged', 'priority': 'high'}
    
    def _capture_additional_data(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Capture additional sensor data"""
        logger.info(f"Capturing additional data from: {metadata.get('device_id')}")
        return {'status': 'success', 'action': 'data_capture_initiated', 'duration': '30s'}
    
    def _record_incident(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Record incident (legacy)"""
        logger.critical(f"Recording legacy incident - Device: {metadata.get('device_id')}")
        return {'status': 'success', 'action': 'incident_recorded', 'severity': 'critical'}
    
    def get_action_history(self, limit: int = 100) -> list:
        """Get action execution history"""
        return self.action_history[-limit:]
