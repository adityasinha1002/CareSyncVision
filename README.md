# CareSyncVision - Patient Monitoring Platform

## Project Overview

CareSyncVision is a comprehensive smart surveillance and authentication system combining:
- **ESP32 Main Board**: Sensor event aggregation and orchestration
- **ESP32-CAM MB Board**: High-quality image capture with optimized ESP32-CAM MB support
- **AI Server**: Advanced pipeline processing (Health Analysis → Medication Adjustment → Health Response)

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CARESYNVISION PIPELINE                        │
└─────────────────────────────────────────────────────────────────┘

SENSOR EVENTS                HEALTH ANALYSIS ENGINE   MEDICATION ADJUSTMENT ENGINE
     │                            │                            │
    ├─ Temperature          Health Analysis          Make Recommendation
     ├─ Motion Detection          │                      │
    ├─ Light Level          Health Scoring          Priority Level
     └─ Touch Input               └─────────────┬──────────┘
                                                │
                                         ┌──────▼──────┐
                                         │   ACTION    │
                                         │   ENGINE    │
                                         └─────────────┘
                                                │
                                    ┌───────────┼───────────┐
                                    │           │           │
                                    ▼           ▼           ▼
                            ALERT    VERIFY    ALLOW    BLOCK
```

## Hardware Setup

### ESP32 Main Board
**Role**: Sensor Event Aggregation & Orchestration Hub

**GPIO Configuration**:
- GPIO4: Touch Sensor Input
- GPIO25: Buzzer/Alert Output
- GPIO16: UART RX (to ESP32-CAM)
- GPIO17: UART TX (to ESP32-CAM)
- GPIO35 (ADC1_CH7): Temperature Sensor
- GPIO34 (ADC1_CH6): Motion Sensor (PIR)
- GPIO39 (ADC1_CH3): Light Sensor (LDR)

**Features**:
- Real-time sensor monitoring (2s intervals)
- Event-driven architecture
- UART communication with ESP32-CAM
- Alarm triggering system
- Threshold-based alerting

### ESP32-CAM MB Board
**Role**: Sensor Event Capture & Image Processing

**Optimization for MB Board**:
- Standard ESP32-CAM pin configuration with MB expansion support
- PSRAM optimization for high-resolution capture
- Dual-resolution support (UXGA with PSRAM, SVGA without)
- Continuous frame buffering
- LED status indicators

**GPIO Configuration**:
- GPIO4: LED Status Indicator
- GPIO33: LED Error Indicator
- GPIO21/GPIO26: I2C (SCCB) for camera
- GPIO3/GPIO1: UART RX/TX (from ESP32 Main)

**Capture Specifications**:
- Resolution: Up to 1600x1200 (UXGA) with PSRAM
- JPEG Quality: 10 (PSRAM), 12 (no PSRAM)
- Frame Buffer: 2 (PSRAM), 1 (no PSRAM)
- Capture Interval: 5 seconds (configurable)

### AI Server
**Role**: Pipeline Processing (Sensor → Health Analysis → Medication Adjustment → Health Response)

**Endpoints**:
- `GET /api/health` - Health check
- `GET /api/status` - System status
- `GET /api/config` - Configuration info
- `POST /api/sensor/image` - Receive image from ESP32-CAM
- `POST /api/sensor/data` - Receive telemetry from ESP32 Main

## Setup Instructions

### 1. ESP32 Main Board

**Hardware Connections**:
```
GPIO4 ──────── Touch Sensor (to 3.3V)
GPIO25 ─────── Buzzer+ (to GND via transistor)
GPIO35 ─────── Temperature Sensor Output
GPIO34 ─────── Motion Sensor Output
GPIO39 ─────── Light Sensor Output
GPIO16 ─────── Receive from ESP32-CAM TX
GPIO17 ─────── Transmit to ESP32-CAM RX
GND ────────── Common Ground
3.3V ───────── Power Rail
```

**Installation**:
```bash
cd ESP32_Main
# Edit src/main.cpp with your sensor thresholds if needed
# Upload to board using PlatformIO
```

**Configuration**:
- Modify threshold values in `src/main.cpp`:
  - `TEMP_THRESHOLD = 38.5°C`
  - `MOTION_THRESHOLD = 500`
  - `LIGHT_THRESHOLD = 200`

### 2. ESP32-CAM MB Board

**Hardware Setup**:
1. Insert ESP32-CAM module into MB expansion board
2. Connect USB programmer (CH340G or similar) to MB board
3. Power via micro-USB

**Installation**:
```bash
cd ESP32_CAM
# Update WiFi credentials in src/main.cpp
# SERVER_URL should point to your AI server IP
# Upload to board using PlatformIO
```

**Configuration** (in `src/main.cpp`):
```cpp
const char* WIFI_SSID = "your-SSID";
const char* WIFI_PASSWORD = "your-PASSWORD";
const char* SERVER_URL = "http://your-server-ip:5000";
const unsigned long CAPTURE_INTERVAL = 5000;  // 5 seconds
```

**LED Indicators**:
- **GPIO4 (Status LED)**:
  - OFF = Idle
  - Blinking = Capturing/Processing
  - Solid ON = Sending
  
- **GPIO33 (Error LED)**:
  - ON = Error state
  - OFF = Normal operation

### 3. AI Server Setup

**Installation**:
```bash
cd ai-server

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
python app.py
# Server will start on http://0.0.0.0:5000
```

**Firewall Configuration**:
- Open port 5000 (or configured port) for incoming connections from ESP32s
- Example (macOS): `lsof -i :5000` to check if port is in use

## Pipeline Detailed Explanation

### Stage 1: Sensor Event Capture
- **ESP32 Main**: Reads 4 analog sensors + 2 digital sensors every 2 seconds
- **ESP32-CAM**: Captures image every 5 seconds on ESP32 Main's request or threshold trigger
- **Events Triggered**: High temperature, motion in darkness, touch detection, unusual patterns

### Stage 2: Health Analysis Engine
**Analyzes**:
- Face detection confidence
- Number of faces
- Device authentication status
- Temporal patterns
- Sensor anomalies

**Output**: Health Analysis Score (0-100) + Concern Level (LOW/MEDIUM/HIGH)

### Stage 3: Medication Adjustment Engine
**Rules**:
- **LOW Concern** (0-30): Maintain current medication schedule
- **MEDIUM Concern** (30-60): Recommend monitoring and caregiver review
- **HIGH Concern** (60-100): Recommend caregiver intervention and possible medication adjustment
- **Anomalies** (>80 or unusual patterns): Urgent caregiver alert

**Confidence**: Recommendation confidence percentage based on aggregated factors

### Stage 4: Health Response Engine
**Executes**:
- Caregiver notifications and recommendations
- Local device responses (alerts, reminders)
- Logging (events, medication, observations)
- Emergency responses (Alarms, notifications)
- Data capture (Additional sensor data)

## API Documentation

### Health Check
```bash
GET /api/health
Response: {"status": "healthy", "timestamp": "...", "service": "CareSyncVision"}
```

### Send Image from ESP32-CAM
```bash
POST /api/patient/health-data
Headers:
  - X-Patient-ID: P001
  - X-Session-ID: SESS12345
  - X-Timestamp: 1234567890
Body: Raw JPEG image binary data

Response:
{
  "image_id": "abc123",
  "timestamp": "2024-01-01T12:00:00",
  "pipeline_stages": {
    "detection": {...},
    "health_analysis": {...},
    "medication_adjustment": {...},
    "health_response": {...}
  },
  "final_recommendation": "NO_ACTION|REVIEW|ALERT|MEDICATION_ADJUSTMENT"
}
```

### Send Sensor Data from ESP32 Main
```bash
POST /api/sensor/data
Content-Type: application/json

{
  "device_id": "ESP32-MAIN",
  "sensor_type": "temperature",
  "value": 37.5,
  "unit": "Celsius"
}

Response:
{
  "status": "success",
  "message": "Sensor data received",
  "event_id": "uuid"
}
```

## Troubleshooting

### ESP32-CAM Issues

**Camera not initializing**:
```
- Verify PSRAM detection: Check serial monitor output
- Try SVGA resolution if UXGA fails
- Check GPIO connections match ESP32-CAM schematic
```

**WiFi connection fails**:
```
- Verify SSID and password are correct
- Check WiFi signal strength
- Enable AP mode in code for debugging
```

**Images not sending to server**:
```
- Verify SERVER_URL is correct and accessible
- Check firewall allows port 5000
- Monitor server logs for connection errors
```

### ESP32 Main Issues

**Sensors reading all zeros**:
```
- Verify GPIO connections to sensors
- Check analog reference voltage (should be 3.3V)
- Verify ADC resolution is 12-bit
```

**Not communicating with ESP32-CAM**:
```
- Check UART baud rate (115200)
- Verify GPIO16 (RX) and GPIO17 (TX) connections
- Ensure common GND between boards
```

### AI Server Issues

**Port already in use**:
```bash
# Find and kill process on port 5000
lsof -i :5000
kill -9 <PID>

# Or change port in app.py
app.run(host='0.0.0.0', port=5001)
```

**Face detection model not found**:
```
- Ensure haarcascade_frontalface_default.xml exists in ai-server/models/
- Download from OpenCV repository if missing
```

**Memory issues with image processing**:
```
- Reduce image resolution on ESP32-CAM
- Implement image compression
- Process images in chunks
```

## Performance Metrics

### Latency
- Sensor Reading: ~50ms per cycle
- Image Capture: ~500ms
- Pipeline Processing: ~200-500ms total
- Network Transmission: ~1-5 seconds (depends on image size)

### Throughput
- Sensor Events: 0.5Hz (2 second interval)
- Image Capture: 0.2Hz (5 second interval)
- API Capacity: >100 requests/second (Flask default)

### Storage
- Image Size: ~50-150KB per JPEG
- Daily Storage (24h, 5s capture): ~2-4GB

## Privacy & Compliance

1. **WiFi**: Use WPA3 encryption if available
2. **API**: Implement authentication tokens and TLS for production
3. **Data**: Encrypt patient data in transit and at rest
4. **Logs**: Secure audit logging for patient events and access
5. **Firmware**: Regular updates for ESP32 boards and secure boot when available

## Maintenance & Monitoring

### Regular Tasks
- Monitor camera lens for dust/damage
- Check sensor calibration monthly
- Review system logs weekly
- Update AI models quarterly

### Logging Locations
- **ESP32 Main**: Serial UART output (115200 baud)
- **ESP32-CAM**: Serial USB output
- **AI Server**: `app.log` or console output

## Future Enhancements

1. **Advanced Analytics**:
   - Machine learning model for behavior analysis
   - Anomaly detection algorithms
   - Pattern recognition

2. **Cloud Integration**:
   - AWS/Google Cloud integration
   - Remote monitoring dashboard
   - Historical data analysis

3. **Hardware Expansion**:
   - Additional sensor types
   - Thermal imaging
   - 3D depth sensing

4. **AI Improvements**:
   - Face recognition and identification
   - Emotion detection
   - Real-time alerting with ML

## Support & Documentation

For detailed technical documentation, refer to:
- ESP32-CAM Datasheet: [Espressif](https://www.espressif.com)
- OpenCV Documentation: [opencv.org](https://docs.opencv.org)
- Flask Documentation: [flask.palletsprojects.com](https://flask.palletsprojects.com)

---

**Version**: 1.0.0  
**Last Updated**: February 13, 2026  
**Developed for**: CareSyncVision Patient Monitoring System
