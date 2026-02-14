# CareSyncVision - Deployment & Operations Guide

## Pre-Deployment Checklist

### Hardware Setup
- [ ] ESP32 Main Board assembled and powered
- [ ] ESP32-CAM with MB expansion board connected
- [ ] Temperature sensor connected to GPIO35
- [ ] Motion sensor (PIR) connected to GPIO34
- [ ] Light sensor (LDR/BH1750) connected to GPIO39
- [ ] Touch button connected to GPIO4
- [ ] Buzzer connected to GPIO25 (via transistor if needed)
- [ ] Common ground between all components
- [ ] 3.3V power rails properly connected
- [ ] USB programmers available for both boards
- [ ] Camera lens clean and properly focused

### Software Preparation
- [ ] VS Code installed with PlatformIO
- [ ] Python 3.8+ installed on server machine
- [ ] Git installed (for version control)
- [ ] Network connectivity verified
- [ ] WiFi credentials prepared
- [ ] Server IP address confirmed

### Development Environment
- [ ] Clone repository
- [ ] Create virtual environment for AI server
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Verify all Python modules install correctly
- [ ] Check face detection model file exists
- [ ] Create uploads directory

## Installation Steps

### Step 1: Configure ESP32-CAM
```bash
cd ESP32_CAM

# Edit src/main.cpp
# Update these lines:
# const char* WIFI_SSID = "your-ssid";
# const char* WIFI_PASSWORD = "your-password";
# const char* SERVER_URL = "http://192.168.1.100:5000";

# Build and upload
pio run -e esp32cam --target upload
pio device monitor -e esp32cam --port /dev/ttyUSB0 -b 115200
```

**Expected Output**:
```
[STARTUP] ESP32-CAM MB Board Initializing...
[CAMERA_INIT] Initializing camera...
[CAMERA_INIT] PSRAM found - Using UXGA resolution
[WIFI_INIT] Connecting to WiFi...
[WIFI_CONNECTED] IP: 192.168.1.50
[STARTUP] Setup Complete - Ready for Operation
```

### Step 2: Configure ESP32 Main
```bash
cd ESP32_Main

# Build and upload
pio run -e esp32dev --target upload
pio device monitor -e esp32dev --port /dev/ttyUSB1 -b 115200
```

**Expected Output**:
```
[STARTUP] ESP32 Main Board Initializing...
[SENSOR_INIT] Initializing sensors...
[COMM_INIT] UART2 with ESP32-CAM configured
[STARTUP] System Ready - Monitoring Mode Active
[SENSOR] Temp: 25.3°C | Motion: 150 | Light: 850 | Touch: NO | Motion: NO
```

### Step 3: Deploy AI Server
```bash
cd ai-server

# Make startup script executable
chmod +x ../start-server.sh

# Run server
./start-server.sh

# Or manually:
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

**Expected Output**:
```
Starting CareSyncVision AI Server...
Face detector loaded successfully
Health Analysis Engine initialized
Medication Adjustment Engine initialized
Health Response Engine initialized
 * Running on http://0.0.0.0:5000
 * Press CTRL+C to quit
```

## Verification Tests

### Test 1: Health Check
```bash
curl http://localhost:5000/api/health
# Expected: {"status": "healthy", "timestamp": "...", "service": "CareSyncVision AI Server"}
```

### Test 2: Configuration Endpoint
```bash
curl http://localhost:5000/api/config
# Expected: System configuration details
```

### Test 3: System Status
```bash
curl http://localhost:5000/api/status
# Expected: All components listed as "operational"
```

### Test 4: Sensor Data Submission
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "ESP32-MAIN",
    "sensor_type": "temperature",
    "value": 37.5,
    "unit": "Celsius"
  }' \
  http://localhost:5000/api/sensor/data
# Expected: {"status": "success", "event_id": "uuid"}
```

### Test 5: Manual Image Upload
```bash
# Copy a test image (e.g., face_test.jpg) and upload
curl -X POST \
  -H "X-Patient-ID: P001" \
  -H "X-Session-ID: SESS123" \
  -H "X-Timestamp: $(date +%s)" \
  --data-binary @face_test.jpg \
  http://localhost:5000/api/patient/health-data
# Expected: Full pipeline result with detection, health analysis, medication adjustment, and response
```

## Operational Monitoring

### Real-time Logs

**ESP32-CAM Logs**:
```bash
# Terminal 1
cd ESP32_CAM
pio device monitor -e esp32cam -b 115200
```

**ESP32 Main Logs**:
```bash
# Terminal 2
cd ESP32_Main
pio device monitor -e esp32dev -b 115200
```

**AI Server Logs**:
```bash
# Terminal 3
# Already visible where server is running
```

### Log Monitoring Script
```bash
#!/bin/bash
# monitor-all.sh

tmux new-session -d -s caresynvision
tmux new-window -t caresynvision -n "esp32cam"
tmux new-window -t caresynvision -n "esp32main"
tmux new-window -t caresynvision -n "server"

tmux send-keys -t caresynvision:esp32cam \
  "cd ESP32_CAM && pio device monitor -b 115200" Enter
tmux send-keys -t caresynvision:esp32main \
  "cd ESP32_Main && pio device monitor -b 115200" Enter
tmux send-keys -t caresynvision:server \
  "cd ai-server && python3 app.py" Enter

tmux attach -t caresynvision
```

## Performance Monitoring

### System Metrics to Track

1. **ESP32 Main**
   - [ ] Temperature readings (valid range)
   - [ ] Motion sensor sensitivity
   - [ ] Light sensor baseline
   - [ ] Touch responsiveness
   - [ ] UART communication reliability

2. **ESP32-CAM**
   - [ ] WiFi signal strength
   - [ ] Image capture success rate
   - [ ] Image transmission time
   - [ ] Frame rate (captures/minute)
   - [ ] Memory usage (PSRAM status)

3. **AI Server**
   - [ ] Detection accuracy (faces)
   - [ ] Pipeline processing time
   - [ ] API response time
   - [ ] CPU/Memory usage
   - [ ] Disk space (uploads folder)

### Performance Baseline

Expected values:
```
ESP32 Main:
  - Sensor read cycle: ~100ms
  - UART latency: <10ms
  - Total event processing: <500ms

ESP32-CAM:
  - Capture time: ~500ms
  - WiFi transmission: 1-5s (depends on image size)
  - Total cycle: ~5s

AI Server:
  - Detection: 100-200ms
  - Health analysis: 10-20ms
  - Medication adjustment: 10-20ms
  - Health response execution: 50-100ms
  - Total pipeline: 200-500ms
```

## Troubleshooting Guide

### Issue: ESP32-CAM can't connect to WiFi

**Symptoms**: UART logs show connection attempts but no "WiFi connected" message

**Solutions**:
```
1. Verify credentials in src/main.cpp
2. Check WiFi signal: -70dBm minimum
3. Try 2.4GHz WiFi (not 5GHz)
4. Reset board: Disconnect power for 10 seconds
5. Check router logs for blocking
```

**Debug Code** (add to setup):
```cpp
WiFi.disconnect(true);  // Turn off WiFi
delay(100);
WiFi.mode(WIFI_STA);
WiFi.setHostname("esp32cam");
WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
```

### Issue: Camera initialization fails

**Symptoms**: `Camera init failed` in logs

**Solutions**:
```
1. Verify all camera pins match GPIO mapping
2. Check PSRAM detection (psramFound())
3. Try SVGA resolution instead of UXGA
4. Reduce xclk_freq_hz to 10MHz
5. Verify power supply (3.3V stable)
6. Check for GPIO conflicts
```

**Check Power**:
```
GPIO0 (XCLK): 1.5-2V
GPIO1 (TX): 3.0-3.3V
Power rails: 3.27-3.30V
```

### Issue: AI Server gets "Address already in use"

**Solution**:
```bash
# Find process on port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or change port in app.py
app.run(host='0.0.0.0', port=5001)
```

### Issue: Face detection always returns 0 faces

**Symptoms**: Pipeline processes but no faces detected

**Solutions**:
```
1. Check lighting (minimum 100 lux)
2. Verify face size: 30-300 pixels
3. Check image quality (JPEG corruption?)
4. Adjust detectMultiScale parameters:
   - Increase scaleFactor (1.05→1.15)
   - Decrease minNeighbors (5→3)
   - Adjust minSize (30→20)
5. Verify model file exists
```

**Test Detection Locally**:
```python
import cv2
cascade = cv2.CascadeClassifier('ai-server/ai-server/models/haarcascade_frontalface_default.xml')
img = cv2.imread('test_image.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
faces = cascade.detectMultiScale(gray, 1.1, 5)
print(f"Detected {len(faces)} faces")
```

### Issue: High latency in pipeline

**Symptoms**: >1 second between image capture and response

**Investigation**:
```
1. Check network latency: ping ESP32-CAM
2. Monitor AI server CPU: top
3. Check disk space: df -h
4. Reduce image resolution
5. Profile with timing logs
```

### Issue: Sensors reading 0 or max values

**Symptoms**: Analog sensors stuck at 0 or 4095

**Solutions**:
```
1. Verify GPIO connections
2. Check sensor power supply (3.3V)
3. Verify ADC reference: analogSetAttenuation(ADC_11db)
4. Test with analogRead() in loop
5. Check for voltage dividers (some sensors need them)
6. Verify no GPIO conflicts
```

## Maintenance Schedule

### Daily
- [ ] Check system logs for errors
- [ ] Monitor memory usage
- [ ] Verify WiFi connectivity
- [ ] Check sensor readings are reasonable

### Weekly
- [ ] Clean camera lens
- [ ] Review alert logs
- [ ] Verify API response times
- [ ] Check disk usage

### Monthly
- [ ] Sensor calibration check
- [ ] Full system test cycle
- [ ] Update firmware (if needed)
- [ ] Backup event logs
- [ ] Review and adjust thresholds

### Quarterly
- [ ] Full hardware inspection
- [ ] Update software dependencies
- [ ] Review and optimize performance
- [ ] Data protection & security audit

## Backup & Recovery

### Backup Critical Files
```bash
# Backup configuration
cp ESP32_CAM/src/main.cpp backups/esp32cam_main_$(date +%Y%m%d).cpp
cp ESP32_Main/src/main.cpp backups/esp32main_main_$(date +%Y%m%d).cpp

# Backup AI server
tar -czf backups/ai-server_$(date +%Y%m%d).tar.gz ai-server/

# Backup event logs
cp ai-server/uploads/* backups/images_$(date +%Y%m%d)/
```

### Recovery Procedures

**Recover ESP32-CAM**:
```bash
1. Connect USB programmer
2. Select correct board and port in PlatformIO
3. Click Upload
4. Verify via serial monitor
```

**Recover ESP32 Main**:
```bash
1. Same as ESP32-CAM but for ESP32_Main
2. Verify sensor readings
```

**Recover AI Server**:
```bash
1. Stop current instance: Ctrl+C
2. Check error logs
3. Clear old uploads: rm ai-server/uploads/*
4. Restart: python3 app.py
```

## Performance Optimization

### Reduce Latency
```cpp
// ESP32-CAM
config.jpeg_quality = 20;  // Lower quality = smaller file
config.fb_count = 1;       // Single frame buffer
CAPTURE_INTERVAL = 10000;  // Longer intervals
```

### Reduce Memory
```cpp
// ESP32-CAM
config.frame_size = FRAMESIZE_VGA;  // 640x480
config.xclk_freq_hz = 10000000;     // Lower clock
```

### Improve Detection
```python
# ai-server/detectors/face_detector.py
# Adjust Haar parameters
faces = self.cascade.detectMultiScale(
    gray,
    scaleFactor=1.05,      # Fine-grained search
    minNeighbors=4,        # More lenient
    minSize=(20, 20),      # Detect small faces
    flags=cv2.CASCADE_SCALE_IMAGE
)
```

## Privacy & Data Protection Hardening

### For Production Deployment

1. **WiFi Security**
```cpp
WiFi.begin(WIFI_SSID, WIFI_PASSWORD);  // Use WPA2/WPA3
```

2. **API Authentication**
```python
# Add token validation in app.py
@app.before_request
def validate_token():
    token = request.headers.get('Authorization')
    if not validate_auth_token(token):
        return {'error': 'Unauthorized'}, 401
```

3. **HTTPS/SSL**
```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365

# Use with Gunicorn
gunicorn --certfile=cert.pem --keyfile=key.pem app:app
```

4. **Firewall Rules**
```bash
# UFW (Ubuntu)
sudo ufw allow 5000/tcp
sudo ufw default deny incoming
```

## Production Deployment

### Using Gunicorn
```bash
cd ai-server
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Using systemd Service
```ini
[Unit]
Description=CareSyncVision AI Server
After=network.target

[Service]
Type=simple
User=caresynvision
WorkingDirectory=/home/caresynvision/ai-server
ExecStart=/home/caresynvision/ai-server/venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 app:app
Restart=on-failure
RestartSec=10s

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable caresynvision
sudo systemctl start caresynvision
sudo systemctl status caresynvision
```

## Documentation Updates

When deploying updates:
1. Update version number in code
2. Document changes in CHANGELOG
3. Update README if configuration changed
4. Test all verification steps
5. Update this guide if operational procedures changed

---

**Last Updated**: February 13, 2026  
**Version**: 1.0.0  
**Maintained by**: CareSyncVision Team
