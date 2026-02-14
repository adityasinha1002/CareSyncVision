# CareSyncVision - Quick Start Guide

## Prerequisites

- **ESP32 Development Board** (for main controller)
- **ESP32-CAM MB Board** (for camera module)
- **Linux/macOS/Windows with Python 3.8+**
- **PlatformIO** installed in VS Code
- **Arduino IDE** (optional alternative to PlatformIO)

## 5-Minute Setup

### Step 1: Configure WiFi & Server (2 min)

Edit `ESP32_CAM/src/main.cpp`:
```cpp
const char* WIFI_SSID = "your-wifi-name";
const char* WIFI_PASSWORD = "your-wifi-password";
const char* SERVER_URL = "http://your-server-ip:5000";
```

### Step 2: Upload to ESP32 Boards (2 min)

**Upload ESP32-CAM MB**:
```bash
cd ESP32_CAM
# In VS Code PlatformIO: Click Upload to esp32cam environment
```

**Upload ESP32 Main**:
```bash
cd ESP32_Main
# In VS Code PlatformIO: Click Upload to esp32dev environment
```

### Step 3: Start AI Server (1 min)

```bash
# Make script executable
chmod +x start-server.sh

# Run startup script
./start-server.sh

# Server will start on http://0.0.0.0:5000
```

## Verify Installation

### 1. Check ESP32-CAM
- Open serial monitor: 115200 baud
- Should see: `[STARTUP] ESP32-CAM MB Board Initializing...`
- LED on GPIO4 should blink when capturing

### 2. Check ESP32 Main
- Open serial monitor: 115200 baud
- Should see: `[STARTUP] ESP32 Main Board Initializing...`
- Serial output should show sensor readings every 2 seconds

### 3. Check AI Server
```bash
curl http://localhost:5000/api/health
# Should return: {"status": "healthy", ...}
```

## Common Tasks

### Adjust Sensor Thresholds

In `ESP32_Main/src/main.cpp`:
```cpp
const float TEMP_THRESHOLD = 38.5;      // Temperature in °C
const float MOTION_THRESHOLD = 500;      // ADC value (0-4095)
const float LIGHT_THRESHOLD = 200;       // ADC value (0-4095)
```

### Change Camera Resolution

In `ESP32_CAM/src/main.cpp`:
```cpp
// In initializeCamera():
config.frame_size = FRAMESIZE_UXGA;  // UXGA, SVGA, CIF, QVGA, etc.
config.jpeg_quality = 10;             // 0-63 (lower = better)
```

### Monitor Live Logs

**ESP32-CAM**:
```bash
cd ESP32_CAM
pio device monitor --port /dev/ttyUSB0 -b 115200
```

**ESP32 Main**:
```bash
cd ESP32_Main
pio device monitor --port /dev/ttyUSB0 -b 115200
```

**AI Server**:
```bash
# Server logs will display in the terminal where it's running
# Look for pipeline stages and decisions
```

## Testing the Pipeline

### 1. Test Image Upload
```bash
# Create a test image and send it
curl -X POST \
  -H "X-Device-ID: ESP32-CAM-MB" \
  -H "X-Timestamp: $(date +%s)" \
  --data-binary @test_image.jpg \
  http://localhost:5000/api/sensor/image
```

### 2. Test Sensor Data
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
```

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Port 5000 in use | `lsof -i :5000` then `kill -9 <PID>` or change port in app.py |
| WiFi not connecting | Check SSID/password, verify WiFi signal strength |
| No face detection | Ensure lighting is adequate, face is 30-300px in size |
| Server not responding | Check firewall allows port 5000 |
| Sensor readings are 0 | Verify GPIO connections and power supply |

## Next Steps

1. **Integrate your sensors**: Connect temperature, motion, and light sensors
2. **Configure thresholds**: Adjust sensitivity based on your environment
3. **Set up notifications**: Implement email/SMS alerts in action_engine.py
4. **Fine-tune AI models**: Customize health/recommendation logic for your use case
5. **Deploy to production**: Use Gunicorn instead of Flask dev server

## Documentation

- Full setup guide: See `README.md`
- API documentation: See `README.md` API section
- Hardware schematics: Check individual board folders

## Support

For issues or questions:
1. Check the troubleshooting section in README.md
2. Review serial monitor logs
3. Check AI server console output
4. Verify all connections and power supplies

---

**Happy Coding! 🚀**

CareSyncVision System - v1.0.0
