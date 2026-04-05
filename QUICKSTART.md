# CareSyncVision MVP - Quick Start Guide

## ✅ System Status

All services running and tested:
- ✅ NGINX Reverse Proxy (HTTPS/443)
- ✅ Flask REST API (Authenticated)
- ✅ PostgreSQL Database (Persistent)
- ✅ React Dashboard (Real-time)
- ✅ Redis Cache (Ready)

## 🚀 Access the Application

### Option 1: Web Browser (Easiest)
```
1. Open: https://localhost
2. Accept self-signed certificate warning
3. Login with demo credentials:
   - Patient ID: 4d8a9d39-ed16-4a74-a49d-b425cd3d7dda
   - Password: password
4. View Jane Smith's dashboard
```

### Option 2: API Testing (curl)
```bash
# Login and get JWT token
TOKEN=$(curl -sk -X POST https://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"patient_id":"4d8a9d39-ed16-4a74-a49d-b425cd3d7dda","password":"password"}' \
  | jq -r '.token')

# Test protected endpoint
curl -sk -X GET https://localhost/api/patient/4d8a9d39-ed16-4a74-a49d-b425cd3d7dda \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

## 📊 Dashboard Features

### Real Data Displayed
✅ Patient Info - Name, age, medical conditions  
✅ Health Summary - 4-card status panel with key metrics  
✅ Risk Score Trend - 7-day chart with visualization  
✅ Medication Tracker - Interactive dose logging  
✅ Alert Panel - Risk-based alerts (auto-generated)

### What You Can Do
- View patient health overview
- Submit vital signs (HR, SpO2, Temp, BP)
- Track medication adherence
- Monitor risk score trends
- See generated health alerts
- Auto-logout on token expiration

## 🔌 Container Management

### View Logs
```bash
docker logs caresynvision-backend -f   # Backend API logs
docker logs caresynvision-frontend -f  # Frontend/NGINX logs
docker logs caresynvision-db -f        # Database logs
```

### Restart Services
```bash
docker-compose -f docker-compose.new.yml restart
```

### Stop All
```bash
docker-compose -f docker-compose.new.yml down
```

### Start All
```bash
docker-compose -f docker-compose.new.yml up -d
```

## 🗄️ Database Access

### Connect to Database
```bash
docker exec -it caresynvision-db psql -U caresynvision -d caresynvision
```

### Useful Queries
```sql
-- View all patients
SELECT patient_id, name, age FROM patients;

-- View medications for demo patient
SELECT medication_name, dosage, adherence_status 
FROM medications 
WHERE patient_id = '4d8a9d39-ed16-4a74-a49d-b425cd3d7dda';

-- View health records
SELECT timestamp, risk_score 
FROM health_records 
WHERE patient_id = '4d8a9d39-ed16-4a74-a49d-b425cd3d7dda' 
ORDER BY timestamp DESC LIMIT 5;
```

## 📚 API Endpoints (All 12 Implemented)

### Authentication
- `POST /api/auth/login` - Get JWT token
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/logout` - Logout

### Patient Management
- `POST /api/patient` - Create patient
- `GET /api/patient/:id` - Get patient details
- `PUT /api/patient/:id` - Update patient
- `GET /api/patient` - List patients
- `POST /api/patient/:id/vitals` - Submit vitals
- `GET /api/patient/:id/history` - Get health history

### Medication Management
- `POST /api/medication` - Create medication
- `GET /api/patient/:id/medication` - Get schedule
- `POST /api/patient/:id/medication/log` - Log dose taken
- `GET /api/patient/:id/medication/adherence` - Get adherence %
- `GET /api/patient/:id/medication/missed` - Check missed doses

## 🏗️ Architecture

```
Browser (HTTPS/443)
    ↓
NGINX Reverse Proxy
    ↓
├─→ Frontend (React) → API calls to backend
└─→ Backend (Flask)
    ↓
PostgreSQL Database
    ↓
├─ Patients table
├─ Medications table
├─ HealthRecords table
├─ Alerts table
└─ Sessions table
```

## ⚡ Test Patient Data

**Name:** Jane Smith  
**ID:** 4d8a9d39-ed16-4a74-a49d-b425cd3d7dda  
**Age:** 68  
**Conditions:** Hypertension, Heart Disease  
**Risk Score:** 25 (Normal - Green)  
**Medication:** Lisinopril 10mg (100% adherent)  
**Last Vitals:** HR 78, SpO2 98%, Temp 37.1°C, BP 120/80
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
