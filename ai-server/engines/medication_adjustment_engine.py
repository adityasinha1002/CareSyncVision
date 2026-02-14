"""
Medication Adjustment Engine - Analyzes patient response patterns and adjusts medication timing
Part of the CareSyncVision patient monitoring pipeline
Analyzes: Medication adherence, response patterns, effectiveness, side effects
"""

import logging
from typing import Dict, List, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class MedicationAdjustmentEngine:
    """
    Medication Adjustment Engine
    Analyzes patient behavioral and health patterns to optimize medication timing
    Determines: Schedule adjustments, dosage recommendations, potential drug interactions
    """
    
    # Medication response patterns
    RESPONSE_PATTERNS = {
        'immediate': (0, 30),      # Minutes: 0-30
        'short_term': (30, 180),   # Minutes: 30-180 (30min-3hr)
        'medium_term': (180, 1440),  # Minutes: 3-24 hours
        'long_term': (1440, 10080)   # Minutes: 1-7 days
    }
    
    # Adherence quality levels
    ADHERENCE_LEVELS = {
        'excellent': (95, 100),
        'good': (80, 95),
        'fair': (60, 80),
        'poor': (0, 60)
    }
    
    # Adjustment confidence thresholds
    MIN_CONFIDENCE_FOR_ADJUSTMENT = 0.70
    
    def __init__(self):
        logger.info("Medication Adjustment Engine initialized - Medication optimization ready")
    
    def analyze(self, health_analysis: Dict[str, Any], metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze patient health data and determine medication adjustments
        
        Args:
            health_analysis: Result from health analysis engine
            metadata: Metadata including patient_id, session_id, timestamp
        
        Returns:
            Dictionary with medication adjustment recommendations
        """
        patient_id = metadata.get('patient_id', 'unknown')
        logger.info(f"Analyzing medication optimization for patient {patient_id}...")
        
        try:
            # Get patient's behavioral patterns
            behavioral_patterns = health_analysis.get('behavioral_patterns', {})
            activity_level = health_analysis.get('activity_level', 50)
            sleep_quality = health_analysis.get('sleep_quality', 50)
            estimated_vitals = health_analysis.get('estimated_vitals', {})
            
            # Analyze medication adherence patterns
            adherence_score = self._analyze_adherence(behavioral_patterns)
            adherence_level = self._classify_adherence(adherence_score)
            logger.info(f"Medication adherence: {adherence_level} ({adherence_score}%)")
            
            # Analyze response patterns
            response_patterns = self._analyze_response_patterns(
                behavioral_patterns,
                activity_level,
                sleep_quality
            )
            logger.info(f"Response patterns identified: {list(response_patterns.keys())}")
            
            # Determine if medication adjustment is needed
            adjustment_needed = self._check_adjustment_needed(
                adherence_score,
                response_patterns,
                estimated_vitals
            )
            logger.info(f"Adjustment needed: {adjustment_needed}")
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                adherence_level,
                response_patterns,
                activity_level,
                sleep_quality
            ) if adjustment_needed else []
            
            # Calculate confidence level
            confidence = self._calculate_confidence(
                adherence_score,
                response_patterns,
                behavioral_patterns
            )
            logger.info(f"Recommendation confidence: {confidence:.2%}")
            
            analysis_result = {
                'adjustment_needed': adjustment_needed,
                'adherence_score': adherence_score,
                'adherence_level': adherence_level,
                'response_patterns': response_patterns,
                'current_schedule': self._get_current_schedule(patient_id),
                'recommended_changes': recommendations,
                'confidence': confidence,
                'activity_level': activity_level,
                'sleep_quality': sleep_quality,
                'patient_id': patient_id,
                'timestamp': metadata.get('timestamp')
            }
            
            logger.info(f"Medication analysis complete for patient {patient_id}")
            return analysis_result
            
        except Exception as e:
            logger.error(f"Error during medication analysis: {str(e)}")
            return {
                'adjustment_needed': False,
                'adherence_score': 0,
                'adherence_level': 'unknown',
                'response_patterns': {},
                'current_schedule': [],
                'recommended_changes': [],
                'confidence': 0.0,
                'error': str(e)
            }
    
    def analyze_response(self, medication_event: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze specific medication response event
        Used when patient reports medication taken or side effects observed
        """
        patient_id = medication_event.get('patient_id')
        medication_name = medication_event.get('medication_name', 'Unknown')
        
        logger.info(f"Analyzing response to {medication_name} for patient {patient_id}")
        
        adherence = medication_event.get('adherence', 'unknown')
        observed_effects = medication_event.get('observed_effects', [])
        side_effects = medication_event.get('side_effects', [])
        
        # Analyze response quality
        response_quality = self._assess_response_quality(
            observed_effects,
            side_effects
        )
        
        # Generate adjustment recommendation based on response
        adjustment = None
        if len(side_effects) > 0:
            adjustment = {
                'type': 'dosage_reduction',
                'reason': 'Side effects observed',
                'severity': 'moderate' if len(side_effects) < 3 else 'high'
            }
        elif adherence == 'late' or adherence == 'missed':
            adjustment = {
                'type': 'schedule_adjustment',
                'reason': 'Adherence issue detected',
                'suggestion': 'Consider earlier administration time'
            }
        elif response_quality == 'excellent':
            adjustment = {
                'type': 'no_change',
                'reason': 'Medication well-tolerated and effective'
            }
        
        logger.info(f"Response analysis: Quality={response_quality}, Adjustment={adjustment}")
        
        return {
            'medication_name': medication_name,
            'response_quality': response_quality,
            'adjustment_recommendation': adjustment,
            'side_effects_count': len(side_effects),
            'adherence': adherence,
            'timestamp': medication_event.get('timestamp')
        }
    
    def _analyze_adherence(self, behavioral_patterns: Dict[str, Any]) -> int:
        """
        Analyze medication adherence from behavioral patterns
        Returns score 0-100
        """
        # In production: Track actual medication administration times vs scheduled
        # For now: Simulate based on sleep consistency pattern
        
        adherence_score = 85  # Default: good adherence
        
        # Adjust based on sleep consistency
        sleep_consistency = behavioral_patterns.get('sleep_consistency', {})
        if sleep_consistency.get('status') == 'consistent':
            adherence_score = 90
        elif sleep_consistency.get('status') == 'variable':
            adherence_score = 70
        
        logger.debug(f"Adherence score: {adherence_score}")
        return adherence_score
    
    def _classify_adherence(self, adherence_score: int) -> str:
        """Classify adherence into levels"""
        for level, (min_val, max_val) in self.ADHERENCE_LEVELS.items():
            if min_val <= adherence_score <= max_val:
                return level
        return 'unknown'
    
    def _analyze_response_patterns(self,
                                   behavioral_patterns: Dict[str, Any],
                                   activity_level: int,
                                   sleep_quality: int) -> Dict[str, Any]:
        """
        Analyze patient response patterns to medication
        """
        patterns = {}
        
        # Analyze timing of medication effect on activity
        if activity_level > 60:
            patterns['increased_activity'] = {
                'observed': True,
                'onset_hours': 1,
                'duration_hours': 6
            }
        
        # Analyze sleep pattern changes
        if sleep_quality > 70:
            patterns['improved_sleep'] = {
                'observed': True,
                'quality_improvement': 'significant'
            }
        
        # Analyze activity consistency
        patterns['activity_consistency'] = {
            'activity_level': activity_level,
            'variability': 'low' if activity_level > 40 else 'high'
        }
        
        logger.debug(f"Response patterns: {list(patterns.keys())}")
        return patterns
    
    def _check_adjustment_needed(self,
                                 adherence_score: int,
                                 response_patterns: Dict[str, Any],
                                 estimated_vitals: Dict[str, Any]) -> bool:
        """
        Determine if medication adjustment is needed
        """
        # Adjust if adherence is poor
        if adherence_score < 60:
            return True
        
        # Adjust if vital signs indicate issue
        heart_rate = estimated_vitals.get('heart_rate', 75)
        if heart_rate > 120 or heart_rate < 50:
            return True
        
        # Adjust if response patterns indicate suboptimal response
        if len(response_patterns) > 3:
            return True
        
        return False
    
    def _generate_recommendations(self,
                                  adherence_level: str,
                                  response_patterns: Dict[str, Any],
                                  activity_level: int,
                                  sleep_quality: int) -> List[Dict[str, Any]]:
        """
        Generate medication adjustment recommendations
        """
        recommendations = []
        
        # Recommend time shift for better activity correlation
        if 'increased_activity' in response_patterns:
            recommendations.append({
                'type': 'timing_adjustment',
                'suggestion': 'Shift medication 30 minutes earlier for better activity alignment',
                'benefit': 'Improved daily function',
                'priority': 'medium'
            })
        
        # Recommend adherence support if needed
        if adherence_level == 'poor':
            recommendations.append({
                'type': 'adherence_support',
                'suggestion': 'Set up medication reminders',
                'benefit': 'Improved consistency',
                'priority': 'high'
            })
        
        # Recommend sleep optimization if poor sleep quality
        if sleep_quality < 60:
            recommendations.append({
                'type': 'sleep_optimization',
                'suggestion': 'Consider evening administration for sleep-promoting effect',
                'benefit': 'Better sleep quality',
                'priority': 'medium'
            })
        
        logger.debug(f"Generated {len(recommendations)} recommendations")
        return recommendations
    
    def _calculate_confidence(self,
                             adherence_score: int,
                             response_patterns: Dict[str, Any],
                             behavioral_patterns: Dict[str, Any]) -> float:
        """
        Calculate confidence level of recommendations
        Based on adherence consistency and pattern clarity
        """
        confidence = 0.5  # Base confidence
        
        # Add for good adherence
        if adherence_score > 80:
            confidence += 0.25
        
        # Add for clear response patterns
        if len(response_patterns) > 2:
            confidence += 0.15
        
        # Add for consistent behavioral patterns
        if behavioral_patterns.get('sleep_consistency', {}).get('status') == 'consistent':
            confidence += 0.10
        
        confidence = min(confidence, 1.0)  # Cap at 1.0
        logger.debug(f"Confidence score: {confidence:.2%}")
        return confidence
    
    def _assess_response_quality(self,
                                 observed_effects: List[str],
                                 side_effects: List[str]) -> str:
        """Assess overall quality of medication response"""
        if len(side_effects) > 0:
            return 'fair' if len(observed_effects) > 0 else 'poor'
        elif len(observed_effects) > 1:
            return 'excellent'
        elif len(observed_effects) > 0:
            return 'good'
        else:
            return 'unknown'
    
    def _get_current_schedule(self, patient_id: str) -> List[Dict[str, Any]]:
        """Get patient's current medication schedule"""
        # In production: Fetch from database
        return [
            {
                'medication_id': 'MED001',
                'medication_name': 'Medication A',
                'dosage': '500mg',
                'schedule': '09:00, 21:00',
                'frequency': 'twice daily'
            },
            {
                'medication_id': 'MED002',
                'medication_name': 'Medication B',
                'dosage': '250mg',
                'schedule': '14:00',
                'frequency': 'once daily'
            }
        ]
