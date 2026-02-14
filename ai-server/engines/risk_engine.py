"""
Risk Engine (LEGACY) - Previously analyzed security threats; retained for reference.
This module remains for backward compatibility. New healthcare-focused
processing has moved to `health_analysis_engine.py` which implements
behavioral and health analysis for patient monitoring.
"""

import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)


class RiskEngine:
    """
    Risk Assessment Engine
    Analyzes detection results and calculates risk scores
    """
    
    # Risk level thresholds
    RISK_THRESHOLDS = {
        'LOW': (0, 30),
        'MEDIUM': (30, 60),
        'HIGH': (60, 100)
    }
    
    # Risk factors and weights
    RISK_FACTORS = {
        'unexpected_face': 20,
        'night_detection': 25,
        'multiple_faces': 15,
        'unusual_timing': 20,
        'sensor_anomaly': 20
    }
    
    def __init__(self):
        logger.info("Risk Engine (LEGACY) initialized - prefer health_analysis_engine.py for healthcare processing")
    
    def assess(self, detection_result: Dict[str, Any], metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Assess risk based on detection and sensor data
        
        Args:
            detection_result: Result from face detector
            metadata: Metadata including device_id, timestamp, etc.
        
        Returns:
            Dictionary with risk assessment details
        """
        logger.info("Starting risk assessment...")
        
        risk_score = 0
        risk_factors = []
        
        # Factor 1: Multiple faces detected
        face_count = detection_result.get('face_count', 0)
        if face_count > 1:
            risk_score += self.RISK_FACTORS['multiple_faces']
            risk_factors.append({
                'factor': 'multiple_faces',
                'value': face_count,
                'weight': self.RISK_FACTORS['multiple_faces']
            })
            logger.info(f"Multiple faces detected: {face_count}")
        
        # Factor 2: Face confidence analysis
        confidence = detection_result.get('avg_confidence', 0)
        if confidence < 0.5:
            risk_score += 15
            risk_factors.append({
                'factor': 'low_confidence',
                'value': confidence,
                'weight': 15
            })
            logger.info(f"Low confidence detection: {confidence}")
        
        # Factor 3: Device-specific analysis
        device_id = metadata.get('device_id', 'unknown')
        if device_id == 'unknown':
            risk_score += 10
            risk_factors.append({
                'factor': 'unknown_device',
                'value': device_id,
                'weight': 10
            })
        
        # Normalize score to 0-100
        risk_score = min(risk_score, 100)
        
        # Determine risk level
        risk_level = self._determine_risk_level(risk_score)
        
        assessment = {
            'risk_score': risk_score,
            'risk_level': risk_level,
            'risk_factors': risk_factors,
            'face_count': face_count,
            'confidence': confidence,
            'device_id': device_id,
            'timestamp': metadata.get('timestamp')
        }
        
        logger.info(f"Risk Assessment Complete - Score: {risk_score}, Level: {risk_level}")
        logger.info(f"Risk Factors: {risk_factors}")
        
        return assessment
    
    def _determine_risk_level(self, score: int) -> str:
        """
        Determine risk level based on score
        
        Args:
            score: Risk score (0-100)
        
        Returns:
            Risk level string: 'LOW', 'MEDIUM', or 'HIGH'
        """
        for level, (min_val, max_val) in self.RISK_THRESHOLDS.items():
            if min_val <= score < max_val:
                return level
        return 'HIGH'
