# CareSyncVision - Quick Start Guide

## 5-Minute Setup Overview

This document provides a rapid deployment guide for the CareSyncVision Patient Health Monitoring System.

## System Components Summary

- **ESP32 Main Board**: Authentication & Medication Management
  - Fingerprint sensor input (UART2)
  - RTC module (I2C)
  - Patient session control
  - Medication schedule tracking

- **ESP32-CAM MB Board**: Patient Health Monitoring
  - Real-time patient observation
  - Behavioral pattern capture
  - WiFi connectivity
  - Secure patient data transmission

- **AI Server**: Health Analytics Pipeline
  - Health analysis from visual data
  - Medication optimization
  - Alert generation
  - Caregiver notifications

## Installation Steps

### Step 1: Hardware Assembly (5 minutes)

**ESP32 Main Board Pin Configuration**:
```
GPIO 16/17 → Fingerprint Sensor UART (57600 baud)
GPIO 21/22 → RTC Module I2C
GPIO 19 → Manual Auth Button
GPIO 25 → Notification Buzzer
GPIO 12 → Blue LED (Auth Status)
GPIO 13 → Green LED (System Status)
```

**ESP32-CAM Board**:
- Insert into MB expansion board
- Ensure power supply (3.3V, 500mA+)

### Step 2: Firmware Upload (10 minutes)

**ESP32 Main**:
```bash
cd ESP32_Main
platformio run --target upload
```

**ESP32-CAM**:
```bash
cd ESP32_CAM
platformio run --target upload
```

### Step 3: AI Server Setup (5 minutes)

```bash
cd ai-server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Server runs on `http://localhost:5001`

## First Use Workflow

### 1. Patient Authentication
```
Patient → Scans Fingerprint on Main Board
Main Board → Validates Patient ID
Main Board → Sends "AUTH:patientID" to CAM via UART
ESP32-CAM → Initializes Session & Starts Monitoring
```

### 2. Health Monitoring Begins
```
ESP32-CAM → Captures Image Every 30 seconds
→ Sends to AI Server with Patient Headers
→ Health Analysis Engine Analyzes Behavioral Patterns
→ Medication Adjustment Engine Checks Adherence
→ Health Response Engine Generates Alerts/Recommendations
```

### 3. Medication Management
```
RTC Reaches Scheduled Time
→ ESP32 Main Notifies Patient (Buzzer)
→ Patient Takes Medication
→ System Logs Administration & Response
→ AI Server Analyzes Effectiveness
→ Recommends Schedule Adjustments if Needed
```

## Key API Endpoints

### Health Data Submission
```bash
POST /api/patient/health-data
Headers: X-Patient-ID, X-Session-ID, X-Device-ID
Body: Image data (JPEG)
```

### Medication Logging
```bash
POST /api/patient/medication
Body: {
  "patient_id": "P001",
  "medication_name": "Aspirin",
  "adherence": "on-time",
  "observed_effects": [...],
  "side_effects": [...]
}
```

### Vital Signs
```bash
POST /api/patient/vitals
Body: {
  "patient_id": "P001",
  "heart_rate": 75,
  "blood_oxygen": 98,
  "body_temperature": 37.1
}
```

## Configuration Changes

### Change Capture Interval (ESP32-CAM)
File: `ESP32_CAM/src/main.cpp`
```cpp
#define CAPTURE_INTERVAL 30000  // milliseconds (currently 30 seconds)
```

### Change Medication Check Frequency (ESP32 Main)
File: `ESP32_Main/src/main.cpp`
```cpp
const unsigned long MEDICATION_CHECK_INTERVAL = 5000;  // milliseconds
```

### Change AI Server Port
File: `ai-server/app.py` (bottom of file)
```python
app.run(host='0.0.0.0', port=5001, debug=False)  # Change 5001 to desired port
```

## Monitoring & Debugging

### Check ESP32 Output
```bash
# Using PlatformIO
platformio device monitor --port /dev/ttyUSB0 --speed 115200
```

### Check AI Server Logs
```bash
# Server will print logs to console with timestamps
# Look for [ERROR], [WARNING], [INFO] messages
```

### Test Health Check Endpoint
```bash
curl http://localhost:5001/api/health
```

### Test System Status
```bash
curl http://localhost:5001/api/status
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Fingerprint not detected | Check UART2 power supply (3.3V), verify baud rate 57600 |
| WiFi connection failing | Ensure 2.4GHz network (5GHz not supported), check password |
| RTC not syncing | Verify I2C pullups (4.7k typical), check address 0x68 |
| Camera not initializing | Ensure PSRAM available, check MB board connection |
| AI Server not responding | Verify port 5001 not in use, check Flask output for errors |

## Testing the System

### Test 1: Manual Authentication
```
1. Press button on ESP32 Main board
2. Should see LED patterns indicate auth process
3. Check serial output for authentication messages
```

### Test 2: Health Data Transmission
```bash
# Manually trigger capture on ESP32-CAM
curl -H "X-Patient-ID: P001" -H "X-Session-ID: test_session" \
     -X POST --data-binary @test_image.jpg \
     http://localhost:5001/api/patient/health-data
```

### Test 3: Full Pipeline
```
1. Authenticate patient via fingerprint
2. Wait 30 seconds for first capture
3. Check AI server logs for pipeline execution
4. Verify health analysis, medication adjustment, and response generation
```

## Data Storage

- **Images**: `ai-server/uploads/` (temporary storage)
- **Logs**: Console output (implement file logging in production)
- **Patient Data**: Currently in-memory (implement database in production)

## Next Steps

1. **Extend Patient Database**: Add more patient fingerprints and profiles
2. **Configure Medication Schedules**: Set up actual medication timing for patients
3. **Implement Dashboard**: Create web UI for caregiver monitoring
4. **Add Database**: Implement persistent patient data storage
5. **Enable HTTPS**: Secure API communication for production
6. **Setup Monitoring**: Configure alerts and logging system

## Production Deployment Checklist

- [ ] Use HTTPS for all API communication
- [ ] Implement database for patient data
- [ ] Add user authentication for dashboard
- [ ] Configure proper logging and monitoring
- [ ] Implement HIPAA/privacy compliance
- [ ] Add error handling and recovery
- [ ] Configure automatic backups
- [ ] Test multi-patient scenarios
- [ ] Load test the system
- [ ] Create operational runbook

## Support Resources

- **README.md**: Full system documentation
- **Firmware Files**: Inline code comments explain all functions
- **Engine Files**: Each engine has comprehensive docstrings
- **API Reference**: See Flask route documentation

## Quick Reference Commands

```bash
# Build firmware
cd ESP32_Main && platformio run

# Upload firmware
cd ESP32_Main && platformio run --target upload

# Monitor device
platformio device monitor

# Start AI server
cd ai-server && python app.py

# Test API
curl http://localhost:5001/api/health
```

---

**Quick Start Version**: 1.0.0  
**Last Updated**: 2026-02-14  
**Status**: Ready for Patient Health Monitoring Deployment
