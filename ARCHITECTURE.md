# CareSyncVision - System Architecture Diagram

## Complete System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CareSyncVision System                            │
│                   (Intelligent Patient Health Monitoring)                │
└─────────────────────────────────────────────────────────────────────────┘
 # CareSyncVision - System Architecture (Patient Health Monitoring)

## Overview

This document describes the architecture of CareSyncVision as a patient health monitoring platform. All security-oriented concepts (threat/risk blocking, access control) have been replaced with patient-centric components: biometric authentication, RTC-driven medication scheduling, behavioral analysis, and AI-driven medication adjustment and caregiver alerts.

```
Architecture Summary (high-level)

  Patient Environment:
    ESP32 Main (Fingerprint + RTC + Orchestration)
      ↕ UART (local)
    ESP32-CAM MB (Visual Monitoring + WiFi)
      ↕ WiFi HTTP
    AI Server (Flask) - Health Analysis → Medication Adjustment → Health Response
      ↕ Dashboard / Caregiver Portal

```

## ESP32 Main Board - Role & Data Flow

Purpose: patient authentication, session management, RTC-based medication scheduling, local notifications (buzzer/LED), and orchestration with the ESP32-CAM.

Key interfaces:
- Fingerprint sensor (UART2, 57600 baud)
- RTC module (I2C)
- UART to ESP32-CAM (UART1, 115200)
- Local indicators: LED_AUTH, LED_STATUS, Buzzer, Button

Flow:
- Wait for fingerprint scan → validate locally → if matched: set patient session
- On authentication: send `AUTH:<patient_id>` to ESP32-CAM and fetch medication schedule
- Continuously read RTC to trigger medication reminders and check administration windows
- Handle manual actions (LOGOUT, CAPTURE requests) and log events locally and to AI server

Data structures (examples):
- PatientAuth { patientID, patientName, fingerprintID, authenticated, authTime }
- MedicationSchedule { medicationName, dosage, hour, minute, administered }

## ESP32-CAM MB Board - Role & Data Flow

Purpose: visual capture of patient behavior and environment, authentication-gated monitoring, periodic uploads of health-data frames to AI server.

Key interfaces:
- OV2640 camera with MB board
- WiFi for HTTP uploads to AI server
- UART to ESP32 Main (receive AUTH, LOGOUT, CAPTURE)

Flow:
- Idle until `AUTH:<patient_id>` received from Main
- On AUTH: initialize `PatientSession`, enable periodic capture (default 30s)
- Capture frame → optionally preprocess → POST to AI server at `/api/patient/health-data` with headers `X-Patient-ID` and `X-Session-ID`
- Parse server response (analysis, recommendations), update LEDs and local logs

Capture configuration (defaults):
- CAPTURE_INTERVAL = 30000 ms (30 seconds)
- Resolution tuned for PSRAM availability
- Images saved temporarily to uploads/ before processing

## AI Server - Pipeline Architecture

Port: configured in `ai-server/app.py` (default 5002)

Pipeline stages (patient-centric):
1. Health Analysis Engine
   - Input: image frame + metadata (patient_id, session_id, timestamp)
   - Output: activity_level (0-100), sleep_quality (0-100), behavioral_patterns, estimated_vitals

2. Medication Adjustment Engine
   - Input: health analysis + historical adherence data
   - Output: adherence_score, adjustment_needed (bool), recommended_changes, confidence

3. Health Response Engine
   - Input: medication analysis + health analysis
   - Output: alerts (patient + caregiver), notifications, recommendations

APIs (core):
- POST `/api/patient/health-data` — receive image bytes; headers: `X-Patient-ID`, `X-Session-ID`, `X-Device-ID`
- POST `/api/patient/vitals` — receive direct vitals (optional)
- POST `/api/patient/medication` — medication administration event and observed effects
- GET `/api/health`, `/api/status`, `/api/config`

Processing guarantees:
- Analysis returns structured results containing `pipeline_stages` and `recommendations`.
- Recommendations include a `confidence` score to guide caregiver review.

## Communication Patterns

UART (ESP32 Main ↔ ESP32-CAM)
- Purpose: session and command control (AUTH, LOGOUT, CAPTURE, STATUS)
- Text-based commands terminated by newline

HTTP (ESP32-CAM → AI Server)
- Purpose: transmit captured frames and optional vitals
- Headers used to associate frames with patient and session

Example headers for health-data POST:
- `X-Patient-ID: P001`
- `X-Session-ID: session_20260115_001`
- `X-Device-ID: ESP32-CAM-PATIENT-MON`

## Data Models (concise)

Patient Session:
```
{
  "patient_id": "P001",
  "session_id": "session_20260115_001",
  "authenticated": true,
  "auth_timestamp": "2026-02-14T12:00:00Z"
}
```

Health Data Point:
```
{
  "health_id": "h123",
  "patient_id": "P001",
  "timestamp": "2026-02-14T12:05:00Z",
  "activity_level": 42,
  "sleep_quality": 78,
  "estimated_vitals": {"heart_rate": 72, "respiratory_rate": 16}
}
```

Medication Event:
```
{
  "patient_id": "P001",
  "medication_id": "MED001",
  "scheduled_time": "09:00",
  "actual_time": "09:05",
  "adherence": "on-time",
  "observed_effects": ["improved_mobility"],
  "side_effects": []
}
```

## Alerts & Responses

- Alerts are generated by the Health Response Engine when patterns indicate: poor adherence, concerning vitals, or significant sleep/activity changes.
- Alerts include severity (INFO / WARNING / CRITICAL), actionable recommendation, and caregiver notification when needed.
- All recommendations include a confidence score; any change in medication requires caregiver/provider review before enactment.

## Privacy & Security Notes

- Fingerprint templates are validated locally on ESP32 Main and should not be transmitted to the server.
- Use HTTPS/TLS for the AI server in production to protect patient images and metadata.
- Store patient data in an encrypted database and follow applicable healthcare privacy regulations (HIPAA/GDPR).

## Operational Considerations

- Offline behavior: ESP32-CAM buffers captures locally if server unreachable and retries transmission when connectivity returns.
- RTC accuracy: RTC ensures medication schedules are honored even if network is down.
- Session lifecycle: sessions expire after configurable idle timeout.

## Next Steps (recommended)

1. Integrate a persistent database (patient profiles, medication schedules, historical data).
2. Implement HTTPS and API authentication for the Flask server.
3. Build a caregiver dashboard to review recommendations and approve medication adjustments.
4. Add unit/integration tests for the engines and firmware communication flows.

---

This file replaces the previous security-centered architecture with a patient-focused design. If you'd like, I can also scan other documentation files and remove any residual security-specific wording across the repo.

            Purpose: patient authentication, session management, RTC-based medication scheduling, local notifications (buzzer/LED), and orchestration with the ESP32-CAM.

            Key interfaces:
            - Fingerprint sensor (UART2, 57600 baud)
            - RTC module (I2C)
            - UART to ESP32-CAM (UART1, 115200)
            - Local indicators: LED_AUTH, LED_STATUS, Buzzer, Button

            Flow:
            - Wait for fingerprint scan → validate locally → if matched: set patient session
            - On authentication: send `AUTH:<patient_id>` to ESP32-CAM and fetch medication schedule
            - Continuously read RTC to trigger medication reminders and check administration windows
            - Handle manual actions (LOGOUT, CAPTURE requests) and log events locally and to AI server

            Data structures (examples):
            - PatientAuth { patientID, patientName, fingerprintID, authenticated, authTime }
            - MedicationSchedule { medicationName, dosage, hour, minute, administered }

            ## ESP32-CAM MB Board - Role & Data Flow

            Purpose: visual capture of patient behavior and environment, authentication-gated monitoring, periodic uploads of health-data frames to AI server.

            Key interfaces:
            - OV2640 camera with MB board
            - WiFi for HTTP uploads to AI server
            - UART to ESP32 Main (receive AUTH, LOGOUT, CAPTURE)

            Flow:
            - Idle until `AUTH:<patient_id>` received from Main
            - On AUTH: initialize `PatientSession`, enable periodic capture (default 30s)
            - Capture frame → optionally preprocess → POST to AI server at `/api/patient/health-data` with headers `X-Patient-ID` and `X-Session-ID`
            - Parse server response (analysis, recommendations), update LEDs and local logs

            Capture configuration (defaults):
            - CAPTURE_INTERVAL = 30000 ms (30 seconds)
            - Resolution tuned for PSRAM availability
            - Images saved temporarily to uploads/ before processing

            ## AI Server - Pipeline Architecture

            Port: configured in `ai-server/app.py` (default 5002)

            Pipeline stages (patient-centric):
            1. Health Analysis Engine
               - Input: image frame + metadata (patient_id, session_id, timestamp)
               - Output: activity_level (0-100), sleep_quality (0-100), behavioral_patterns, estimated_vitals

            2. Medication Adjustment Engine
               - Input: health analysis + historical adherence data
               - Output: adherence_score, adjustment_needed (bool), recommended_changes, confidence

            3. Health Response Engine
               - Input: medication analysis + health analysis
               - Output: alerts (patient + caregiver), notifications, recommendations

            APIs (core):
            - POST `/api/patient/health-data` — receive image bytes; headers: `X-Patient-ID`, `X-Session-ID`, `X-Device-ID`
            - POST `/api/patient/vitals` — receive direct vitals (optional)
            - POST `/api/patient/medication` — medication administration event and observed effects
            - GET `/api/health`, `/api/status`, `/api/config`

            Processing guarantees:
            - Analysis returns structured results containing `pipeline_stages` and `recommendations`.
            - Recommendations include a `confidence` score to guide caregiver review.

            ## Communication Patterns

            UART (ESP32 Main ↔ ESP32-CAM)
            - Purpose: session and command control (AUTH, LOGOUT, CAPTURE, STATUS)
            - Text-based commands terminated by newline

            HTTP (ESP32-CAM → AI Server)
            - Purpose: transmit captured frames and optional vitals
            - Headers used to associate frames with patient and session

            Example headers for health-data POST:
            - `X-Patient-ID: P001`
            - `X-Session-ID: session_20260115_001`
            - `X-Device-ID: ESP32-CAM-PATIENT-MON`

            ## Data Models (concise)

            Patient Session:
            ```
            {
              "patient_id": "P001",
              "session_id": "session_20260115_001",
              "authenticated": true,
              "auth_timestamp": "2026-02-14T12:00:00Z"
            }
            ```

            Health Data Point:
            ```
            {
              "health_id": "h123",
              "patient_id": "P001",
              "timestamp": "2026-02-14T12:05:00Z",
              "activity_level": 42,
              "sleep_quality": 78,
              "estimated_vitals": {"heart_rate": 72, "respiratory_rate": 16}
            }
            ```

            Medication Event:
            ```
            {
              "patient_id": "P001",
              "medication_id": "MED001",
              "scheduled_time": "09:00",
              "actual_time": "09:05",
              "adherence": "on-time",
              "observed_effects": ["improved_mobility"],
              "side_effects": []
            }
            ```

            ## Alerts & Responses

            - Alerts are generated by the Health Response Engine when patterns indicate: poor adherence, concerning vitals, or significant sleep/activity changes.
            - Alerts include severity (INFO / WARNING / CRITICAL), actionable recommendation, and caregiver notification when needed.
            - All recommendations include a confidence score; any change in medication requires caregiver/provider review before enactment.

            ## Privacy & Security Notes

            - Fingerprint templates are validated locally on ESP32 Main and should not be transmitted to the server.
            - Use HTTPS/TLS for the AI server in production to protect patient images and metadata.
            - Store patient data in an encrypted database and follow applicable healthcare privacy regulations (HIPAA/GDPR).

            ## Operational Considerations

            - Offline behavior: ESP32-CAM buffers captures locally if server unreachable and retries transmission when connectivity returns.
            - RTC accuracy: RTC ensures medication schedules are honored even if network is down.
            - Session lifecycle: sessions expire after configurable idle timeout.

            ## Next Steps (recommended)

            1. Integrate a persistent database (patient profiles, medication schedules, historical data).
            2. Implement HTTPS and API authentication for the Flask server.
            3. Build a caregiver dashboard to review recommendations and approve medication adjustments.
            4. Add unit/integration tests for the engines and firmware communication flows.

            ---

            This file replaces the previous security-centered architecture with a patient-focused design. If you'd like, I can also scan other documentation files and remove any residual security-specific wording across the repo.
