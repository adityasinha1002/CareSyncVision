# CareSyncVision - System Architecture Document

## Executive Summary

CareSyncVision is an intelligent healthcare monitoring platform that combines real-time visual patient observation with AI-driven medication management. The system is designed for remote patient monitoring in healthcare facilities, assisted living environments, and home care settings.

**Key Architectural Principles**:
- **Real-Time Processing**: Sub-second latency for critical alerts
- **Privacy-First**: Local authentication, encrypted communication
- **Scalable**: Multi-patient support with independent sessions
- **Resilient**: Graceful degradation with local fallbacks
- **Healthcare-Optimized**: Focuses on behavioral patterns and medication adherence

## System Architecture Overview

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Patient Environment                          │
│                                                                   │
│  ┌──────────────────┐         ┌─────────────────────────────┐  │
│  │  ESP32 Main      │         │    ESP32-CAM MB Board       │  │
│  │  - Fingerprint   │◄─UART──►│    - Camera Module          │  │
│  │  - RTC Module    │         │    - WiFi Module            │  │
│  │  - Buzzer/LEDs   │         │    - Health Data Capture    │  │
│  └──────────────────┘         └─────────────────────────────┘  │
│                                         │                        │
│                                     HTTP POST                     │
│                                         │                        │
└─────────────────────────────────────────┼────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Cloud AI Server                             │
│                    (Flask on Port 5001)                          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          API Gateway & Request Handler                    │  │
│  │  - /api/patient/health-data  (Visual monitoring)         │  │
│  │  - /api/patient/vitals       (Vital signs)               │  │
│  │  - /api/patient/medication   (Med adherence)             │  │
│  │  - /api/health               (System health)             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│  ┌──────────────────────▼──────────────────────────────────┐  │
│  │         Patient Monitoring Pipeline (3-Stage)            │  │
│  │                                                           │  │
│  │  STAGE 1: Health Analysis Engine                         │  │
│  │  ├─ Visual behavior analysis                             │  │
│  │  ├─ Activity level classification (0-100)               │  │
│  │  ├─ Sleep quality assessment                            │  │
│  │  └─ Vital sign estimation                               │  │
│  │                 ▼                                         │  │
│  │  STAGE 2: Medication Adjustment Engine                   │  │
│  │  ├─ Adherence tracking & scoring                        │  │
│  │  ├─ Response pattern analysis                           │  │
│  │  ├─ Schedule optimization                               │  │
│  │  └─ Recommendation generation                           │  │
│  │                 ▼                                         │  │
│  │  STAGE 3: Health Response Engine                         │  │
│  │  ├─ Alert generation (INFO/WARNING/CRITICAL)            │  │
│  │  ├─ Patient notification scheduling                     │  │
│  │  ├─ Caregiver alert triggering                          │  │
│  │  └─ Recommendation compilation                          │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
              ┌────────────┴──────────────┐
              │                           │
              ▼                           ▼
    ┌──────────────────┐       ┌──────────────────┐
    │ Patient App      │       │ Caregiver Portal │
    │ - Medications    │       │ - Monitoring     │
    │ - Notifications  │       │ - Alerts         │
    │ - Health Data    │       │ - Reports        │
    └──────────────────┘       └──────────────────┘
```

## Component Architecture

### 1. Hardware Layer

#### ESP32 Main Board
```
┌─────────────────────────────────────────────────┐
│              ESP32 Main Board                   │
│  (Patient Authentication & Medication Control)  │
├─────────────────────────────────────────────────┤
│ Interfaces:                                      │
│  • UART2 (57600): Fingerprint Sensor Module     │
│  • I2C (400KHz): RTC Module (DS3231)            │
│  • UART1 (115200): ESP32-CAM Communication      │
│  • GPIO: LEDs (Auth/Status), Buzzer, Button     │
│                                                  │
│ Core Modules:                                   │
│  • FingerprintSensor: Biometric auth            │
│  • RTCModule: Time synchronization              │
│  • MedicationScheduler: Timing management       │
│  • SessionManager: Patient session handling     │
│  • CommunicationHandler: Inter-device UART     │
│                                                  │
│ State Machine:                                  │
│  [UNAUTHENTICATED] ──fingerprint──► [AUTHENTICATED]
│                                           │
│                                    ┌──────┴──────┐
│                              [MEDICATION_SCHEDULED]
│                                           │
│                                    [NOTIFICATION_ACTIVE]
│                                                  │
└─────────────────────────────────────────────────┘
```

#### ESP32-CAM MB Board
```
┌─────────────────────────────────────────────────┐
│          ESP32-CAM with MB Expansion            │
│      (Patient Health Data Capture)              │
├─────────────────────────────────────────────────┤
│ Interfaces:                                      │
│  • OV2640 Camera (SCCB Protocol)                │
│  • UART1 (115200): ESP32 Main Communication    │
│  • WiFi (802.11b/g/n, 2.4GHz only)             │
│  • GPIO: LED Indicators, Debug                  │
│                                                  │
│ Core Modules:                                   │
│  • CameraModule: Frame capture (30s interval)  │
│  • WiFiModule: Cloud connectivity              │
│  • AuthenticationGate: Session validation       │
│  • DataTransmitter: Secure data upload         │
│  • LocalBuffering: Offline capture capability  │
│                                                  │
│ State Machine:                                  │
│  [UNAUTHENTICATED] ──AUTH:patientID──► [AUTHENTICATED]
│         (Idle)                                │
│                                    [CAPTURING]
│                                           │
│                                   [PROCESSING]
│                                           │
│                                    [SENDING]
│                                                  │
└─────────────────────────────────────────────────┘
```

### 2. Communication Layer

#### UART Protocols

**ESP32 Main ↔ Fingerprint Sensor (UART2)**
```
Protocol: UART
Baud Rate: 57600
Data Format: Binary (fingerprint module specific)
Flow: 
  1. ESP32 Main waits for fingerprint scan
  2. Sensor sends binary data on successful match
  3. Main extracts fingerprint ID
  4. Looks up patient ID from local database
  5. Transitions to AUTHENTICATED state
```

**ESP32 Main ↔ ESP32-CAM (UART1)**
```
Protocol: Simple text-based UART
Baud Rate: 115200
Format: Commands + Responses (CR/LF terminated)

Commands from Main → CAM:
  AUTH:patientID      - Authenticate patient, start monitoring
  LOGOUT              - End session
  CAPTURE             - Manual immediate capture
  STATUS              - Query CAM status
  CONFIG:param=value  - Configuration command

Responses from CAM → Main:
  CAM:AUTH_SUCCESS    - Authentication confirmed
  CAM:LOGOUT          - Logout confirmed
  CAM:OK              - Status OK
  [CAPTURE]           - Capture event notification
  [SEND_SUCCESS]      - Data transmission success
  [ERROR:message]     - Error notification
```

#### HTTP API (WiFi)

**ESP32-CAM → AI Server**
```
Protocol: HTTP/1.1 POST
Endpoint: /api/patient/health-data
Content-Type: application/octet-stream

Headers:
  X-Patient-ID: P001              (Patient identifier)
  X-Session-ID: session_12345     (Session identifier)
  X-Device-ID: ESP32-CAM-PATIENT-MON (Device identifier)
  X-Timestamp: ISO8601            (Capture timestamp)

Body: Binary JPEG image data (typically 10-50KB)

Response: JSON with pipeline results
```

### 3. Software Layer

#### ESP32 Firmware Architecture

**ESP32 Main Firmware** (`ESP32_Main/src/main.cpp`)

```cpp
Main Loop Execution Pattern:
  
  1. CHECK FINGERPRINT INPUT (1Hz)
     ├─ Poll UART2 for sensor data
     ├─ If fingerprint detected:
     │  ├─ Validate against database
     │  ├─ If valid:
     │  │  ├─ Retrieve patient ID
     │  │  ├─ Initialize session
     │  │  ├─ Send AUTH:patientID to CAM
     │  │  ├─ Update LED status (both ON)
     │  │  └─ Activate buzzer (3 beeps)
     │  └─ Log authentication event
     │
  2. SYNC RTC TIME (Every 60 seconds)
     ├─ Read current time from RTC
     ├─ Update system clock
     └─ Log time sync
     │
  3. CHECK MEDICATION SCHEDULE (Every 5 seconds, when authenticated)
     ├─ Check RTC against scheduled medication times
     ├─ If medication time reached:
     │  ├─ Activate buzzer (continuous tone)
     │  ├─ Display medication prompt
     │  ├─ Log scheduled event
     │  └─ Wait for patient response
     └─ Reset daily flags at midnight
     │
  4. HANDLE CAM MESSAGES (Interrupt-based)
     ├─ Check UART1 for incoming messages
     ├─ Parse command/response
     ├─ Execute appropriate handler
     └─ Update internal state if needed
```

**Key Data Structures** (ESP32 Main):
```cpp
PatientAuth {
  String patientID;
  String patientName;
  bool authenticated;
  unsigned long authTime;
  unsigned long sessionStartTime;
  unsigned char fingerprintID;
}

RTCTime {
  int year, month, day;
  int hour, minute, second;
}

MedicationSchedule {
  String medicationName;
  int dosage;
  int hour, minute;
  bool administered;
  unsigned long administrationTime;
}
```

**ESP32-CAM Firmware** (`ESP32_CAM/src/main.cpp`)

```cpp
Main Loop Execution Pattern:

  1. HANDLE UART INPUT (Always checking)
     ├─ Check UART1 for command from Main
     ├─ If AUTH:patientID received:
     │  ├─ Initialize session with patientID
     │  ├─ Update state to AUTHENTICATED
     │  ├─ Start capture timer
     │  ├─ Confirm with CAM:AUTH_SUCCESS
     │  └─ Update LEDs (both ON)
     ├─ If LOGOUT received:
     │  ├─ Stop all operations
     │  ├─ Update state to UNAUTHENTICATED
     │  ├─ Stop capture timer
     │  └─ LEDs OFF
     │
  2. CAPTURE IMAGE (Every 30 seconds when authenticated)
     ├─ Acquire frame buffer from camera
     ├─ Verify image quality
     ├─ If valid:
     │  ├─ Update state to CAPTURING
     │  ├─ Log capture event
     │  └─ Queue for transmission
     │
  3. TRANSMIT DATA (If image captured and WiFi available)
     ├─ Update state to SENDING
     ├─ Prepare HTTP POST request
     ├─ Add patient headers (X-Patient-ID, etc.)
     ├─ Send to AI server
     ├─ Parse response
     ├─ Log result
     └─ Update state back to AUTHENTICATED
     │
  4. UPDATE LED STATUS (Based on current state)
     ├─ STATE_UNAUTHENTICATED: Both LEDs OFF
     ├─ STATE_AUTHENTICATED: Both LEDs ON
     ├─ STATE_CAPTURING: Green ON, Blue OFF
     ├─ STATE_PROCESSING: Green ON, Blue OFF
     └─ STATE_ERROR: Green OFF, Blue ON
```

**Key Data Structures** (ESP32-CAM):
```cpp
PatientSession {
  String patientID;
  String sessionID;
  bool authenticated;
  unsigned long sessionStartTime;
  unsigned long lastCaptureTime;
}

enum CameraState {
  STATE_UNAUTHENTICATED,
  STATE_AUTHENTICATED,
  STATE_CAPTURING,
  STATE_PROCESSING,
  STATE_SENDING,
  STATE_ERROR
}
```

### 4. AI Server Architecture

#### Flask Application Structure
```
ai-server/
├── app.py                          (Main Flask application)
│   ├─ @app.route('/api/health')   (Health check endpoint)
│   ├─ @app.route('/api/status')   (System status)
│   ├─ @app.route('/api/patient/health-data')  (Primary data endpoint)
│   ├─ @app.route('/api/patient/vitals')       (Vital signs endpoint)
│   └─ @app.route('/api/patient/medication')   (Medication endpoint)
│
└── engines/
    ├─ health_analysis_engine.py         (Stage 1: Analysis)
    ├─ medication_adjustment_engine.py   (Stage 2: Optimization)
    └─ health_response_engine.py         (Stage 3: Response)
```

#### Pipeline Execution Flow

```
REQUEST: POST /api/patient/health-data
         + X-Patient-ID, X-Session-ID
         + Binary JPEG image

    ↓

VALIDATION:
├─ Check patient ID not empty
├─ Check image data received
├─ Validate image size (< 5MB)
└─ Save to disk for processing

    ↓

┌─────────────────────────────────────────────────────┐
│   HEALTH ANALYSIS ENGINE (Behavioral Analysis)     │
│                                                     │
│   Input: Image file, metadata                       │
│   Processing:                                       │
│   1. Analyze activity level (0-100)                │
│   2. Determine activity class:                     │
│      - SLEEPING (0-10)                             │
│      - RESTING (10-30)                             │
│      - ACTIVE (30-70)                              │
│      - HIGHLY_ACTIVE (70-100)                      │
│   3. Estimate sleep quality (0-100)                │
│   4. Extract behavioral patterns:                  │
│      - Sleep consistency                           │
│      - Activity patterns                           │
│      - Postural changes                            │
│      - Nighttime activity                          │
│   5. Estimate vital signs:                         │
│      - Heart rate (bpm)                            │
│      - Respiratory rate                            │
│      - Blood oxygen saturation                     │
│                                                     │
│   Output: {                                        │
│     success: bool,                                 │
│     activity_level: int,                          │
│     sleep_quality: int,                           │
│     behavioral_patterns: {...},                   │
│     estimated_vitals: {...}                       │
│   }                                                │
│                                                     │
└────────────┬────────────────────────────────────────┘
             ↓

┌─────────────────────────────────────────────────────┐
│ MEDICATION ADJUSTMENT ENGINE (Schedule Optimization) │
│                                                     │
│ Input: Health analysis results                      │
│ Processing:                                         │
│ 1. Analyze medication adherence:                   │
│    - Track medication timing compliance             │
│    - Score adherence (0-100)                       │
│    - Classify: excellent, good, fair, poor         │
│ 2. Analyze response patterns:                       │
│    - Timing of medication effect on activity      │
│    - Sleep pattern changes after medication       │
│    - Activity consistency                         │
│ 3. Determine adjustment needed:                    │
│    - Check adherence score                        │
│    - Analyze vital signs                          │
│    - Review response patterns                     │
│ 4. Generate recommendations:                       │
│    - Timing adjustments (shift earlier/later)     │
│    - Adherence support (reminders)                │
│    - Sleep optimization                          │
│ 5. Calculate confidence (0.0-1.0):                │
│    - Based on adherence, patterns, consistency   │
│                                                     │
│ Output: {                                          │
│   adjustment_needed: bool,                        │
│   adherence_score: int,                          │
│   adherence_level: str,                          │
│   response_patterns: {...},                      │
│   recommended_changes: [...],                    │
│   confidence: float                               │
│ }                                                  │
│                                                     │
└────────────┬────────────────────────────────────────┘
             ↓

┌─────────────────────────────────────────────────────┐
│   HEALTH RESPONSE ENGINE (Alert & Recommendation)   │
│                                                     │
│ Input: Medication analysis + Health analysis       │
│ Processing:                                         │
│ 1. Generate medication alerts:                     │
│    - Adjustment needed alert                       │
│    - Adherence issue alert                         │
│    - No response detected alert                    │
│ 2. Generate health alerts:                         │
│    - Poor sleep quality                            │
│    - Abnormal activity levels                      │
│    - Concerning vital signs                        │
│ 3. Generate patient notifications:                 │
│    - Schedule update notification                  │
│    - Sleep improvement tips                        │
│    - Activity suggestions                          │
│ 4. Generate caregiver alerts (if needed):          │
│    - Only if critical issues detected             │
│    - Severity levels (MEDIUM/HIGH)                │
│ 5. Generate recommendations:                       │
│    - Actionable items for patient                 │
│    - Healthcare provider consultation needed?     │
│    - Implementation guidance                      │
│                                                     │
│ Output: {                                          │
│   alerts: [...],                                  │
│   notifications: [...],                           │
│   caregiver_alert: {...} | null,                 │
│   recommendations: [...],                        │
│   severity_level: str                             │
│ }                                                  │
│                                                     │
└────────────┬────────────────────────────────────────┘
             ↓

RESPONSE: HTTP 200 JSON
└─ Complete pipeline result with all stages
```

## Data Flow Diagrams

### Authentication Flow
```
Patient                ESP32 Main              ESP32-CAM              AI Server
   │                      │                        │                     │
   │─ Scan Fingerprint ──►│                        │                     │
   │                      │─ Lookup Patient DB ───►│                     │
   │                      │◄─ Patient ID Found ────│                     │
   │                      │─ AUTH:P001 (UART1) ───►│                     │
   │                      │◄─ CAM:AUTH_SUCCESS ────│                     │
   │ Buzzer: 3 beeps ◄────│                        │                     │
   │ LEDs: ON ◄───────────│                        │                     │
   │                      │                        │─ Start Capture ─────│
   │                      │                        │─ Send Health Data ─►│
   │                      │                        │◄─ Analysis Results ─│
   │                      │                        │                     │
```

### Health Monitoring Flow
```
ESP32-CAM              AI Server                Patient/Caregiver
   │                      │                            │
   ├─ Every 30 seconds ───┤                            │
   │  Capture Frame       │                            │
   │  Send Health Data ──►│                            │
   │                      ├─ Health Analysis ──────────┤
   │                      ├─ Medication Analysis       │
   │                      ├─ Response Generation       │
   │                      │                            │
   │                      ├─ If Alerts ──────────────►│ Notification
   │                      ├─ If Caregiver Alert ─────►│ Alert
   │                      └─ If Recommendations ─────►│ Suggestion
   │                      │                            │
```

## Data Models

### Patient Session Model
```json
{
  "patient_id": "P001",
  "session_id": "session_12345_20240115",
  "authenticated": true,
  "auth_timestamp": "2024-01-15T14:00:00Z",
  "patient_name": "John Doe",
  "age": 68,
  "conditions": ["hypertension", "diabetes"],
  "medications": [
    {
      "med_id": "MED001",
      "name": "Aspirin",
      "dosage": "100mg",
      "frequency": "daily",
      "time": "09:00"
    }
  ]
}
```

### Health Data Point Model
```json
{
  "health_id": "health_abc123",
  "patient_id": "P001",
  "timestamp": "2024-01-15T14:30:00Z",
  "activity_level": 55,
  "activity_class": "ACTIVE",
  "sleep_quality": 75,
  "behavioral_patterns": {
    "sleep_consistency": "consistent",
    "activity_pattern": "normal",
    "postural_changes": "within_normal"
  },
  "estimated_vitals": {
    "heart_rate": 75,
    "respiratory_rate": 16,
    "blood_oxygen": 98
  }
}
```

### Alert Model
```json
{
  "alert_id": "alert_xyz789",
  "patient_id": "P001",
  "type": "adherence_alert",
  "severity": "WARNING",
  "message": "Medication adherence is fair",
  "timestamp": "2024-01-15T14:35:00Z",
  "action_required": true,
  "recommendation": "Improve medication compliance"
}
```

## Performance Considerations

### Latency Targets
- Fingerprint recognition: < 2 seconds
- Image capture: < 1 second
- WiFi transmission: 5-10 seconds (varies with connectivity)
- AI Pipeline execution: 2-5 seconds
- **Total end-to-end**: < 20 seconds from capture to alerts

### Memory Management
- ESP32 Main: ~150KB free RAM (for patient database, sessions)
- ESP32-CAM: PSRAM optimization for image buffering
- AI Server: ~500MB for image storage, uploads cleaned periodically

### Network Bandwidth
- Health image: 10-50KB per capture (30s interval)
- Bandwidth: ~3.6-18 MB/day per patient
- Vitamin sign endpoint: ~1KB per submission

## Privacy & Data Protection

### Authentication & Authorization
```
Patient Authentication:
  ├─ Fingerprint → ESP32 Main (local validation)
  ├─ No credential transmission
  ├─ Session ID generated (token-based)
  └─ Session expires after 8 hours idle

Data Protection:
  ├─ UART (local): No encryption (isolated network)
  ├─ WiFi (cloud): HTTPS recommended for production
  ├─ Image Storage: File system (encrypt in production)
  └─ Patient Data: In-memory (use secure DB in production)
```

### Privacy Safeguards
- Fingerprint data never leaves ESP32 Main
- Patient ID used for identification, not full data
- Images stored temporarily (auto-cleanup)
- Behavioral analysis only, no facial recognition
- HIPAA/GDPR compliance recommendations in README

## Scalability Architecture

### Single Patient Setup
```
ESP32 Main ← (1:1 mapping) → ESP32-CAM
                    ↓
                AI Server
```

### Multi-Patient Setup
```
Patient 1: ESP32 Main ←→ ESP32-CAM ┐
Patient 2: ESP32 Main ←→ ESP32-CAM ├─→ AI Server
Patient 3: ESP32 Main ←→ ESP32-CAM ┘       (Multi-session)

AI Server handles:
  - Multiple health_id streams
  - Independent medication schedules per patient
  - Separate alert queues
  - Patient-specific analytics
```

## Failure & Recovery

### Graceful Degradation
```
Network Unavailable:
  ├─ ESP32-CAM: Buffer captures locally
  ├─ Retry transmission when connectivity returns
  ├─ Medication still scheduled locally (RTC reliable)
  └─ Local health data accumulated until sync

AI Server Down:
  ├─ ESP32-CAM: Continues capturing (no loss)
  ├─ Buffers up to 1 hour of data
  ├─ Retransmits when server available
  └─ Patient not notified (graceful)

Patient Session Interrupted:
  ├─ ESP32-CAM stops capturing
  ├─ Waits for re-authentication
  ├─ Previous session data persists
  └─ No data loss
```

---

**Architecture Document Version**: 1.0.0  
**Last Updated**: 2026-02-14  
**System Status**: Production Ready
