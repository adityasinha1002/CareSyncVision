# CareSyncVision - Engine Implementation Reference

## Overview

This document provides detailed implementation guidance for the three AI pipeline engines that power the CareSyncVision patient health monitoring system.

## Engine 1: Health Analysis Engine

### Purpose
Analyzes patient behavioral patterns from visual monitoring data and estimates health metrics.

### File Location
`ai-server/engines/health_analysis_engine.py`

### Class: `HealthAnalysisEngine`

#### Key Methods

**`analyze(image_path: str, metadata: Dict) → Dict`**
- Main entry point for health analysis
- Processes captured patient image
- Returns comprehensive health metrics

**Example Usage**:
```python
engine = HealthAnalysisEngine()
result = engine.analyze(
    image_path="/path/to/patient_image.jpg",
    metadata={
        'patient_id': 'P001',
        'session_id': 'sess_12345',
        'timestamp': '2024-01-15T14:30:00Z'
    }
)

# Result structure:
{
    'success': True,
    'activity_level': 55,           # 0-100 scale
    'activity_class': 'ACTIVE',     # SLEEPING, RESTING, ACTIVE, HIGHLY_ACTIVE
    'sleep_quality': 75,            # 0-100 scale
    'behavioral_patterns': {
        'sleep_consistency': {...},
        'activity_pattern': {...},
        'postural_changes': {...},
        'nighttime_activity': {...}
    },
    'estimated_vitals': {
        'heart_rate': 75,           # bpm
        'respiratory_rate': 16,     # breaths/min
        'blood_oxygen': 98,         # SpO2 %
        'body_temperature': 37.1    # °C
    }
}
```

#### Activity Classification Logic

```python
ACTIVITY_LEVELS = {
    'SLEEPING': (0, 10),        # No movement, horizontal
    'RESTING': (10, 30),        # Minimal movement, reclined
    'ACTIVE': (30, 70),         # Normal daily activities
    'HIGHLY_ACTIVE': (70, 100)  # Exercise, intensive movement
}

# Scoring Factors:
# - Body movement magnitude (optical flow)
# - Position changes (pose estimation)
# - Movement frequency (temporal analysis)
# - Context (time of day, previous patterns)
```

#### Sleep Quality Scoring

```python
# Sleep quality indicators:
sleep_quality = 0

# Factor 1: Movement during sleep (30%)
restlessness_score = analyze_movement_patterns()  # 0-100
sleep_quality += (100 - restlessness_score) * 0.3

# Factor 2: Sleep duration (40%)
# Calculated from accumulated sleep time over 24h
duration_hours = get_daily_sleep_duration()
duration_score = min(100, (duration_hours / 8) * 100)
sleep_quality += duration_score * 0.4

# Factor 3: Wake interruptions (30%)
# Count transitions from sleep to wake states
wake_count = count_wake_episodes()
interruption_score = max(0, 100 - (wake_count * 10))
sleep_quality += interruption_score * 0.3

# Final score: 0-100
```

#### Behavioral Pattern Extraction

```python
# Pattern: Sleep Consistency
pattern['sleep_consistency'] = {
    'description': 'Schedule adherence',
    'status': 'consistent' | 'variable' | 'erratic',
    'typical_bedtime': 'HH:MM',
    'typical_wake_time': 'HH:MM',
    'confidence': 0.0-1.0
}

# Pattern: Activity Pattern
pattern['activity_pattern'] = {
    'description': 'Daily movement patterns',
    'peak_activity_hours': ['09:00-12:00', '14:00-17:00'],
    'low_activity_periods': [...],
    'typical_activity_level': 0-100,
    'confidence': 0.0-1.0
}

# Pattern: Postural Changes
pattern['postural_changes'] = {
    'description': 'Body position changes during sleep',
    'position_changes_per_hour': int,
    'typical_positions': ['supine', 'lateral', 'prone'],
    'confidence': 0.0-1.0
}

# Pattern: Nighttime Activity
pattern['nighttime_activity'] = {
    'description': 'Night-time movement',
    'wake_episodes': int,
    'longest_sleep_bout': 'HH:MM',
    'total_sleep_duration': 'HH:MM',
    'confidence': 0.0-1.0
}
```

#### Vital Sign Estimation

**Note**: Current implementation provides estimates based on activity level. For production, integrate:
- Facial blood perfusion analysis (for HR estimation)
- Breathing rate from chest movement detection
- Body temperature estimation (advanced thermal analysis)

```python
# Heart Rate Estimation:
if activity_level < 10:
    hr = 60-70           # Sleeping
elif activity_level < 30:
    hr = 70-80           # Resting
elif activity_level < 70:
    hr = 80-100          # Active
else:
    hr = 110-150         # Highly active

# Respiratory Rate (typically 12-20 at rest):
rr = 14 + (activity_level / 100 * 8)

# Blood Oxygen (normally 95-100%):
spo2 = 98  # Baseline, would analyze perfusion index in production

# Temperature (normally 36.5-37.5°C):
temp = 37.0 + (activity_level / 1000)  # Activity increases temp slightly
```

---

## Engine 2: Medication Adjustment Engine

### Purpose
Analyzes patient medication adherence and response patterns to optimize dosing schedules.

### File Location
`ai-server/engines/medication_adjustment_engine.py`

### Class: `MedicationAdjustmentEngine`

#### Key Methods

**`analyze(health_analysis: Dict, metadata: Dict) → Dict`**
- Main entry point for medication analysis
- Processes health data to assess medication effectiveness
- Generates adjustment recommendations

**Example Usage**:
```python
engine = MedicationAdjustmentEngine()
result = engine.analyze(
    health_analysis={
        'activity_level': 55,
        'sleep_quality': 75,
        'behavioral_patterns': {...},
        'estimated_vitals': {...}
    },
    metadata={
        'patient_id': 'P001',
        'session_id': 'sess_12345'
    }
)

# Result structure:
{
    'adjustment_needed': False,
    'adherence_score': 85,          # 0-100
    'adherence_level': 'good',      # excellent, good, fair, poor
    'response_patterns': {...},
    'current_schedule': [...],
    'recommended_changes': [],
    'confidence': 0.85,             # 0.0-1.0
    'activity_level': 55,
    'sleep_quality': 75
}
```

**`analyze_response(medication_event: Dict) → Dict`**
- Analyzes specific medication administration event
- Called when patient reports medication taken or effects observed

**Example Usage**:
```python
event = {
    'patient_id': 'P001',
    'medication_id': 'MED001',
    'medication_name': 'Aspirin',
    'scheduled_time': '09:00',
    'actual_time': '09:05',
    'adherence': 'on-time',  # on-time, late, missed
    'observed_effects': ['reduced_pain', 'improved_mood'],
    'side_effects': []
}

response = engine.analyze_response(event)

# Result:
{
    'medication_name': 'Aspirin',
    'response_quality': 'excellent',  # excellent, good, fair, poor
    'adjustment_recommendation': {
        'type': 'no_change',
        'reason': 'Medication well-tolerated and effective'
    },
    'side_effects_count': 0,
    'adherence': 'on-time'
}
```

#### Adherence Analysis Logic

```python
# Adherence Score Calculation (0-100):

adherence_score = 100  # Start at perfect

# Factor 1: On-time administration
time_differences = [
    abs(actual_time - scheduled_time) for each dose
]
avg_time_diff = mean(time_differences)

if avg_time_diff > 120:      # > 2 hours late
    adherence_score -= 20
elif avg_time_diff > 60:     # > 1 hour late
    adherence_score -= 10
elif avg_time_diff > 15:     # > 15 minutes late
    adherence_score -= 5

# Factor 2: Missed doses
missed_count = count_missed_doses()
adherence_score -= missed_count * 15

# Factor 3: Consistency
if adherence_standard_deviation < 20:
    # Consistent timing
    adherence_score = min(100, adherence_score + 5)
elif adherence_standard_deviation > 60:
    # Highly variable timing
    adherence_score -= 10

# Classification:
ADHERENCE_LEVELS = {
    'excellent': (95, 100),
    'good': (80, 95),
    'fair': (60, 80),
    'poor': (0, 60)
}
```

#### Response Pattern Analysis

```python
# Pattern Detection Workflow:

patterns = {}

# 1. Medication Onset Detection
# Compare patient state before/after medication administration
if activity_level increases significantly within 1 hour:
    patterns['increased_activity'] = {
        'observed': True,
        'onset_minutes': calculate_onset(),
        'duration_hours': estimate_duration(),
        'magnitude': measure_activity_increase()
    }

# 2. Sleep Pattern Correlation
if sleep_quality improves after evening medication:
    patterns['improved_sleep'] = {
        'observed': True,
        'quality_improvement': 'significant' | 'moderate' | 'mild',
        'onset_hours': hours_to_effect(),
        'consistency': measure_consistency()
    }

# 3. Side Effect Tracking
for each reported_side_effect:
    if temporal_correlation(side_effect, medication):
        patterns['side_effect_' + side_effect] = {
            'confirmed': True,
            'severity': 'mild' | 'moderate' | 'severe',
            'onset_minutes': calculate_onset(),
            'requires_adjustment': severity > 'mild'
        }

# 4. Vital Sign Response
if heart_rate or blood_pressure changes correlate with medication:
    patterns['vital_sign_response'] = {
        'heart_rate_change': delta_bpm,
        'bp_change': delta_mmhg,
        'expected_direction': 'increase' | 'decrease',
        'magnitude_appropriate': bool
    }
```

#### Recommendation Generation Logic

```python
recommendations = []

# Recommendation 1: Timing Adjustment
if patient shows better response at different time:
    recommendations.append({
        'type': 'timing_adjustment',
        'suggestion': f'Shift from {current_time} to {optimal_time}',
        'benefit': 'Better alignment with patient daily rhythm',
        'priority': 'medium',
        'rationale': 'Patient shows peak activity 30min post-dose'
    })

# Recommendation 2: Adherence Support
if adherence_score < 80:
    recommendations.append({
        'type': 'adherence_support',
        'suggestion': 'Implement daily medication reminders',
        'benefit': 'Improve consistency and effectiveness',
        'priority': 'high',
        'rationale': f'Current adherence score: {adherence_score}'
    })

# Recommendation 3: Sleep Optimization
if sleep_quality < 60 and evening_medication exists:
    recommendations.append({
        'type': 'sleep_optimization',
        'suggestion': 'Administer sleep-promoting medication earlier',
        'benefit': 'Allow more time for absorption',
        'priority': 'medium',
        'rationale': 'Patient shows delayed sleep response'
    })

# Recommendation 4: Dosage Adjustment
if severe_side_effects detected and response_good:
    recommendations.append({
        'type': 'dosage_reduction',
        'suggestion': f'Consider reducing {medication} dose by 25%',
        'benefit': 'Maintain efficacy while reducing side effects',
        'priority': 'high',
        'rationale': 'Good efficacy but intolerable side effects'
    })
```

#### Confidence Calculation

```python
# Confidence in Recommendations (0.0-1.0):

confidence = 0.5  # Base confidence (expert assessment)

# Add for good adherence history
if adherence_score > 80:
    confidence += 0.25
elif adherence_score > 60:
    confidence += 0.10

# Add for clear response patterns
pattern_count = len(response_patterns)
if pattern_count > 3:
    confidence += 0.20
elif pattern_count > 1:
    confidence += 0.10

# Add for behavioral consistency
if sleep_consistency == 'consistent':
    confidence += 0.15
elif sleep_consistency == 'variable':
    confidence -= 0.10

# Add for sufficient data
if days_of_observation > 30:
    confidence += 0.10
elif days_of_observation > 7:
    confidence += 0.05

# Normalize to 0.0-1.0
confidence = max(0.0, min(1.0, confidence))

# Confidence levels guide recommendation priority:
if confidence > 0.85:
    recommendation['certainty'] = 'high'
elif confidence > 0.70:
    recommendation['certainty'] = 'moderate'
else:
    recommendation['certainty'] = 'low'
```

---

## Engine 3: Health Response Engine

### Purpose
Generates appropriate alerts, notifications, and recommendations based on health analysis and medication analysis results.

### File Location
`ai-server/engines/health_response_engine.py`

### Class: `HealthResponseEngine`

#### Key Methods

**`generate_response(medication_analysis: Dict, health_analysis: Dict, metadata: Dict) → Dict`**
- Main entry point for response generation
- Creates comprehensive alert and notification package

**Example Usage**:
```python
engine = HealthResponseEngine()
response = engine.generate_response(
    medication_analysis={
        'adjustment_needed': False,
        'adherence_score': 85,
        'recommended_changes': [...]
    },
    health_analysis={
        'activity_level': 55,
        'sleep_quality': 75,
        'behavioral_patterns': {...},
        'estimated_vitals': {...}
    },
    metadata={
        'patient_id': 'P001',
        'timestamp': '2024-01-15T14:30:00Z'
    }
)

# Result structure:
{
    'patient_id': 'P001',
    'timestamp': '2024-01-15T14:30:00Z',
    'alerts': [...],           # List of alerts
    'notifications': [...],    # Patient-facing notifications
    'caregiver_alert': {...},  # Caregiver alert or null
    'recommendations': [...],  # Actionable recommendations
    'action_required': True,
    'severity_level': 'warning'  # normal, info, warning, critical
}
```

#### Alert Generation Logic

**Medication Alerts**:
```python
alerts = []

# Alert 1: Adjustment Needed
if medication_analysis['adjustment_needed']:
    alerts.append({
        'type': 'medication_adjustment',
        'severity': 'WARNING',
        'message': 'Medication timing adjustment recommended',
        'details': medication_analysis['recommended_changes'],
        'action_required': True,
        'timestamp': timestamp
    })

# Alert 2: Adherence Issues
adherence = medication_analysis['adherence_level']
if adherence == 'poor':
    alerts.append({
        'type': 'adherence_alert',
        'severity': 'CRITICAL',
        'message': f'Medication adherence is {adherence}',
        'adherence_score': medication_analysis['adherence_score'],
        'recommendation': 'Implement adherence support',
        'action_required': True
    })
elif adherence == 'fair':
    alerts.append({
        'type': 'adherence_alert',
        'severity': 'WARNING',
        'message': f'Medication adherence is {adherence}',
        'adherence_score': medication_analysis['adherence_score'],
        'action_required': True
    })

# Alert 3: No Response Detected
if len(medication_analysis['response_patterns']) == 0:
    alerts.append({
        'type': 'no_response_detected',
        'severity': 'WARNING',
        'message': 'No clear medication response pattern detected',
        'suggestion': 'Consult healthcare provider for evaluation',
        'action_required': True
    })
```

**Health Alerts**:
```python
alerts = []

# Alert 1: Poor Sleep Quality
sleep_quality = health_analysis['sleep_quality']
if sleep_quality < 40:
    alerts.append({
        'type': 'poor_sleep',
        'severity': 'WARNING',
        'message': f'Poor sleep quality detected (score: {sleep_quality})',
        'suggestions': [
            'Review sleep environment',
            'Adjust medication timing',
            'Consult sleep specialist if persistent'
        ],
        'action_required': True
    })

# Alert 2: Activity Concerns
activity = health_analysis['activity_level']
if activity < 15:
    alerts.append({
        'type': 'low_activity',
        'severity': 'INFO',
        'message': 'Low daily activity level detected',
        'recommendation': 'Encourage gentle movement',
        'action_required': False
    })
elif activity > 85:
    alerts.append({
        'type': 'excessive_activity',
        'severity': 'INFO',
        'message': 'High activity level detected',
        'recommendation': 'Monitor for fatigue',
        'action_required': False
    })

# Alert 3: Vital Sign Concerns
vitals = health_analysis['estimated_vitals']
heart_rate = vitals['heart_rate']

if heart_rate > 120:
    alerts.append({
        'type': 'high_heart_rate',
        'severity': 'WARNING',
        'message': f'Elevated HR estimated: {heart_rate} bpm',
        'possible_causes': [
            'Fever or infection',
            'Anxiety or stress',
            'Medication side effect',
            'Physical exertion'
        ],
        'action_required': True
    })
elif heart_rate < 50:
    alerts.append({
        'type': 'low_heart_rate',
        'severity': 'WARNING',
        'message': f'Low HR estimated: {heart_rate} bpm',
        'advice': 'Monitor closely, seek medical attention if symptomatic',
        'action_required': True
    })
```

#### Notification Generation

```python
notifications = []

# Notification 1: Medication Schedule Changes
if medication_analysis['recommended_changes']:
    for change in medication_analysis['recommended_changes']:
        notifications.append({
            'type': 'schedule_adjustment',
            'title': 'Medication Timing Update',
            'message': change['suggestion'],
            'priority': 'high',
            'action_url': '/patient/medication/adjustment',
            'action_button': 'Review Change'
        })

# Notification 2: Sleep Health Tips
if sleep_quality < 70:
    notifications.append({
        'type': 'health_tip',
        'title': 'Sleep Improvement Suggestions',
        'message': f'Your sleep quality is {sleep_quality}/100. Try: Consistent bedtime, dark room, limited evening screens',
        'priority': 'medium',
        'action_url': '/patient/health/sleep-guide'
    })

# Notification 3: Activity Suggestions
if 20 < activity_level < 40:
    notifications.append({
        'type': 'activity_suggestion',
        'title': 'Daily Activity Recommendation',
        'message': 'Light activity can boost health. Try a 10-minute walk or gentle stretching.',
        'priority': 'low',
        'action_url': '/patient/activity/suggestions'
    })

# Notification 4: Medication Reminder
if medication_upcoming_within_30_minutes:
    notifications.append({
        'type': 'medication_reminder',
        'title': 'Upcoming Medication',
        'message': f'Time to take {medication_name} in 30 minutes',
        'priority': 'high',
        'scheduled_time': medication_time
    })
```

#### Caregiver Alert Logic

```python
caregiver_alert = None

issues = []

# Detect critical medication adherence
if adherence_level == 'poor':
    issues.append('Poor medication adherence')

# Detect concerning sleep patterns
if sleep_quality < 30:
    issues.append('Severely poor sleep quality')

# Detect concerning activity
if activity_level < 10:
    issues.append('Minimal daily activity - possible health concern')

# Detect vital sign issues
if heart_rate > 130 or heart_rate < 45:
    issues.append(f'Concerning heart rate: {heart_rate} bpm')

# Generate alert only if issues found
if issues:
    severity = 'CRITICAL' if len(issues) > 3 else 'HIGH'
    
    caregiver_alert = {
        'alert_type': 'caregiver_notification',
        'severity': severity,
        'patient_id': patient_id,
        'timestamp': timestamp,
        'issues': issues,
        'summary': f'{len(issues)} concerning patterns detected',
        'message': f'Patient {patient_id}: {severity} alert - {", ".join(issues[:2])}',
        'recommendation': 'Review patient status and consider contacting healthcare provider',
        'action_required': True,
        'action_url': f'/caregiver/patient/{patient_id}/details'
    }
```

#### Recommendation Generation

```python
recommendations = []

# Category 1: Medication Recommendations
for med_change in medication_analysis['recommended_changes']:
    recommendations.append({
        'category': 'medication',
        'priority': med_change.get('priority', 'medium'),
        'title': med_change['type'],
        'description': med_change['suggestion'],
        'benefit': med_change.get('benefit'),
        'implementation': 'Discuss with healthcare provider',
        'timeline': 'Schedule appointment within 1 week'
    })

# Category 2: Activity Recommendations
if activity_level < 30:
    recommendations.append({
        'category': 'lifestyle',
        'priority': 'high',
        'title': 'Increase Physical Activity',
        'description': 'Gradually increase daily movement',
        'benefit': 'Improved physical and mental health',
        'implementation': [
            'Start with 10-minute walks daily',
            'Add gentle stretching exercises',
            'Progress to 30-minute moderate activity'
        ],
        'timeline': 'Begin immediately, increase over 2-4 weeks'
    })

# Category 3: Sleep Recommendations
if sleep_quality < 60:
    recommendations.append({
        'category': 'sleep',
        'priority': 'high',
        'title': 'Sleep Hygiene Improvement',
        'description': 'Optimize sleep environment and routine',
        'benefit': 'Better sleep quality and medication effectiveness',
        'implementation': [
            'Keep room cool (65-68°F)',
            'Use blackout curtains',
            'Maintain consistent sleep schedule',
            'Avoid screens 1 hour before bed',
            'Limit caffeine after 2 PM'
        ],
        'timeline': 'Implement changes gradually over 1 week'
    })
```

#### Severity Determination

```python
def determine_overall_severity(alerts: List[Dict]) -> str:
    """
    Determine overall system severity based on alerts
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

# Severity Levels:
# - normal: No alerts, system functioning optimally
# - info: Informational alerts only
# - warning: One or more warning-level issues
# - critical: Critical-level issue(s) requiring immediate attention
```

---

## Implementation Guidelines

### Best Practices

1. **Error Handling**
   - Always validate input data before processing
   - Provide meaningful error messages
   - Log errors with context information
   - Return appropriate status codes

2. **Performance**
   - Cache patient data to avoid repeated lookups
   - Process images efficiently (avoid redundant operations)
   - Use appropriate data structures for analysis
   - Profile code for bottlenecks

3. **Accuracy**
   - Use multiple data points for pattern detection
   - Calculate confidence scores for all recommendations
   - Document assumptions and limitations
   - Validate analysis against known patterns

4. **Logging**
   - Log key decision points
   - Include timestamps in all logs
   - Use appropriate log levels (DEBUG, INFO, WARNING, ERROR)
   - Include patient ID for traceability

### Testing Each Engine

**Health Analysis Engine**:
```python
# Test with varying activity levels
test_cases = [
    ('sleeping_image.jpg', expected_activity=5),
    ('resting_image.jpg', expected_activity=20),
    ('active_image.jpg', expected_activity=55),
    ('exercise_image.jpg', expected_activity=85)
]

for image, expected in test_cases:
    result = engine.analyze(image, metadata)
    assert result['success']
    assert abs(result['activity_level'] - expected) < 10
```

**Medication Adjustment Engine**:
```python
# Test with different adherence scenarios
test_cases = [
    (on_time_doses=28, missed_doses=0, expected_adherence='excellent'),
    (on_time_doses=24, missed_doses=1, expected_adherence='good'),
    (on_time_doses=20, missed_doses=2, expected_adherence='fair'),
    (on_time_doses=15, missed_doses=5, expected_adherence='poor')
]

for on_time, missed, expected in test_cases:
    result = engine.analyze(health_data, metadata)
    assert result['adherence_level'] == expected
```

**Health Response Engine**:
```python
# Test alert generation
test_cases = [
    (adherence='poor', sleep=30, expected_alerts=['adherence_alert', 'poor_sleep']),
    (adherence='good', sleep=75, expected_alerts=[]),
    (adherence='fair', heart_rate=130, expected_alerts=['adherence_alert', 'high_heart_rate'])
]

for adherence, sleep, expected in test_cases:
    result = engine.generate_response(med_analysis, health_analysis, metadata)
    alert_types = [a['type'] for a in result['alerts']]
    assert set(alert_types) == set(expected)
```

---

## Advanced Customization

### Adding New Analysis Factors

To add a new factor to activity level analysis:

1. Implement `_analyze_new_factor()` method
2. Calculate factor score (0-100)
3. Define weight relative to other factors
4. Update `analyze_activity_level()` to include new factor
5. Test against known scenarios
6. Document in code comments

### Adding New Behavioral Patterns

To add a new behavioral pattern:

1. Define pattern characteristics
2. Implement detection logic in `_extract_behavioral_patterns()`
3. Define confidence calculation
4. Add to output dictionary
5. Update documentation
6. Create test cases

### Custom Alert Rules

To add custom alert rules:

1. Implement detection logic in appropriate engine
2. Define alert severity level
3. Create alert message template
4. Calculate action_required flag
5. Log alert generation with context
6. Add to appropriate alert list

---

## Troubleshooting & Debugging

### Common Issues

**Issue**: Low confidence scores
- Solution: Ensure sufficient historical data (>7 days)
- Check for consistent patient patterns
- Verify metadata accuracy

**Issue**: Unexpected alert generation
- Solution: Review threshold values
- Check input data quality
- Verify time-zone handling

**Issue**: Poor adherence scoring
- Solution: Verify time tracking accuracy
- Check medication schedule database
- Review adherence calculation logic

### Debug Logging

Enable detailed debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# In engine methods:
logger.debug(f"Analyzing patient {patient_id}")
logger.debug(f"Activity level: {activity_level}")
logger.debug(f"Sleep quality: {sleep_quality}")
logger.debug(f"Generated {len(alerts)} alerts")
```

---

**Engine Implementation Reference Version**: 1.0.0  
**Last Updated**: 2026-02-14
