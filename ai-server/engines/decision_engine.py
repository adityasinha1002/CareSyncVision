"""
Decision Engine (LEGACY) - Previously made decisions based on risk assessment.
This module is retained for backward compatibility. Use
`medication_adjustment_engine.py` for medication-focused recommendations.
"""

import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


class DecisionEngine:
    """
    Decision Making Engine
    Determines appropriate actions based on risk assessment
    """
    
    # Decision rules based on risk level
    DECISION_RULES = {
        'LOW': {
            'decision': 'ALLOW',
            'confidence': 95,
            'priority': 'LOW'
        },
        'MEDIUM': {
            'decision': 'VERIFY',
            'confidence': 70,
            'priority': 'MEDIUM'
        },
        'HIGH': {
            'decision': 'BLOCK',
            'confidence': 85,
            'priority': 'HIGH'
        }
    }
    
    def __init__(self):
        logger.info("Decision Engine (legacy) initialized - use medication_adjustment_engine.py for new behavior")
    
    def decide(self, risk_assessment: Dict[str, Any], 
               detection_result: Dict[str, Any],
               metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make decision based on risk assessment and detection results
        
        Args:
            risk_assessment: Output from Risk Engine
            detection_result: Output from face detector
            metadata: Metadata from the request
        
        Returns:
            Dictionary with decision and reasoning
        """
        logger.info("Making decision...")
        
        risk_level = risk_assessment.get('risk_level', 'MEDIUM')
        risk_score = risk_assessment.get('risk_score', 50)
        face_count = risk_assessment.get('face_count', 0)
        confidence = risk_assessment.get('confidence', 0)
        
        # Get base decision from risk level
        base_decision = self.DECISION_RULES.get(risk_level, self.DECISION_RULES['MEDIUM'])
        
        decision = base_decision['decision']
        decision_confidence = base_decision['confidence']
        priority = base_decision['priority']
        
        # Apply context-based adjustments
        reasoning = []
        
        if risk_score > 80:
            decision = 'BLOCK'
            reasoning.append("High risk score indicates potential threat")
            logger.warning(f"High risk score: {risk_score}")
        
        if face_count == 0:
            decision = 'NO_ACTION'
            reasoning.append("No faces detected")
            logger.info("No faces detected - skipping action")
        
        if confidence < 0.3:
            if decision != 'BLOCK':
                decision = 'VERIFY'
            reasoning.append("Low confidence detection requires verification")
            logger.info("Low confidence - requesting verification")
        
        # Additional security rules
        if face_count > 3:
            decision = 'ALERT'
            priority = 'CRITICAL'
            reasoning.append("Unusual number of faces detected")
            logger.warning(f"Unusual detection: {face_count} faces")
        
        decision_result = {
            'decision': decision,
            'confidence': decision_confidence,
            'priority': priority,
            'reasoning': reasoning,
            'risk_score': risk_score,
            'risk_level': risk_level,
            'metadata': {
                'timestamp': metadata.get('timestamp'),
                'device_id': metadata.get('device_id'),
                'image_id': metadata.get('image_id')
            }
        }
        
        logger.info(f"Decision Made: {decision} (Confidence: {decision_confidence}%, Priority: {priority})")
        logger.info(f"Reasoning: {reasoning}")
        
        return decision_result
