# CareSyncVision Backend API Documentation

**Status**: ✅ MVP Backend Implementation Complete  
**Last Updated**: April 5, 2026  
**Base URL**: `https://localhost` (via NGINX reverse proxy)

---

## Quick Test Commands

### 1. Health Check
```bash
curl -sk https://localhost/api/health
```
**Response**: Service status and timestamp

---

## Patient Management Endpoints

### Create Patient
**POST** `/api/patient`

```bash
curl -sk -X POST https://localhost/api/patient \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "age": 68,
    "medical_conditions": ["Hypertension", "Heart Disease"],
    "contact_info": {"phone": "555-0456", "email": "jane@example.com"}
  }'
```

**Response Status**: 201 (Created)
**Response Body**:
```json
{
  "success": true,
  "patient_id": "uuid",
  "message": "Patient created successfully",
  "data": { /* patient object */ }
}
```

---

### Get Patient
**GET** `/api/patient/<patient_id>`

```bash
curl -sk https://localhost/api/patient/{patient_id}
```

**Response**: Patient data with current health status
- `current_risk_score`: Latest risk calculation
- `recent_records_count`: Number of health records in last 7 days
- `last_updated`: Timestamp of latest health record

---

### List Patients
**GET** `/api/patient?active_only=true&limit=100`

```bash
curl -sk "https://localhost/api/patient?active_only=true&limit=50"
```

**Query Parameters**:
- `active_only` (bool): Filter to active patients only (default: true)
- `limit` (int): Maximum records to return (default: 100)

---

### Update Patient
**PUT** `/api/patient/<patient_id>`

```bash
curl -sk -X PUT https://localhost/api/patient/{patient_id} \
  -H "Content-Type: application/json" \
  -d '{
    "age": 70,
    "medical_conditions": ["Hypertension"],
    "active": true
  }'
```

**Updatable Fields**: `name`, `age`, `medical_conditions`, `contact_info`, `active`

---

### Submit Vital Signs
**POST** `/api/patient/<patient_id>/vitals`

```bash
curl -sk -X POST https://localhost/api/patient/{patient_id}/vitals \
  -H "Content-Type: application/json" \
  -d '{
    "heart_rate": 78,
    "spo2": 98.0,
    "temperature": 37.1,
    "blood_pressure": {
      "systolic": 120,
      "diastolic": 80
    }
  }'
```

**Response**: 
- `risk_score`: Calculated risk based on vitals
- Health record created in database

---

### Get Patient Health History
**GET** `/api/patient/<patient_id>/history?days=7&limit=100`

```bash
curl -sk "https://localhost/api/patient/{patient_id}/history?days=7&limit=50"
```

**Response**: List of health records (vitals, images, etc.) from specified period

---

## Medication Management Endpoints

### Create Medication
**POST** `/api/medication`

```bash
curl -sk -X POST https://localhost/api/medication \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "{patient_id}",
    "medication_name": "Lisinopril",
    "dosage": "10mg",
    "frequency": "once_daily",
    "scheduled_time": "09:00:00"
  }'
```

**Frequency Options**: `once_daily`, `twice_daily`, `as_needed`

**Response Status**: 201 (Created)

---

### Get Medication Schedule
**GET** `/api/patient/<patient_id>/medication`

```bash
curl -sk https://localhost/api/patient/{patient_id}/medication
```

**Response**:
- `medications`: Array of medication records
- `medications_count`: Total medications
- `next_medication_time`: Time of next scheduled dose

---

### Record Medication (Mark as Taken)
**POST** `/api/patient/<patient_id>/medication/log`

```bash
curl -sk -X POST https://localhost/api/patient/{patient_id}/medication/log \
  -H "Content-Type: application/json" \
  -d '{
    "med_id": "{med_id}",
    "notes": "Patient took medication with breakfast"
  }'
```

**Updates**:
- `administered`: true
- `administered_time`: current timestamp
- `last_taken`: current timestamp
- `adherence_status`: "taken"

---

### Get Medication Adherence
**GET** `/api/patient/<patient_id>/medication/adherence?days=30`

```bash
curl -sk "https://localhost/api/patient/{patient_id}/medication/adherence?days=30"
```

**Response Metrics**:
```json
{
  "success": true,
  "patient_id": "...",
  "adherence_rate": 92.5,  // percentage
  "total_doses": 40,
  "doses_taken": 37,
  "doses_missed": 2,
  "doses_pending": 1,
  "period_days": 30,
  "last_updated": "ISO 8601 timestamp"
}
```

---

### Check Missed Doses
**GET** `/api/patient/<patient_id>/medication/missed`

```bash
curl -sk https://localhost/api/patient/{patient_id}/medication/missed
```

**Response**:
- Automatically creates alerts for any missed medications
- Updates adherence_status to "missed"

---

## Health Data Submission (ESP32-CAM)

### Submit Health Data Image
**POST** `/api/patient/health-data`

**Headers Required**:
- `X-Patient-ID`: Patient UUID
- `X-Session-ID`: Unique session ID
- `X-Device-ID`: Device identifier (e.g., "ESP32-CAM")
- `X-Timestamp`: Unix timestamp (optional)
- `Content-Type`: application/octet-stream

```bash
curl -sk -X POST https://localhost/api/patient/health-data \
  -H "X-Patient-ID: {patient_id}" \
  -H "X-Session-ID: {session_id}" \
  -H "X-Device-ID: ESP32-CAM" \
  --data-binary @image.jpg
```

**Response**:
- `record_id`: Health record ID
- `risk_score`: Calculated risk from image analysis
- Image saved to disk

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request data |
| 404 | Not Found - Resource doesn't exist |
| 413 | Payload Too Large - File exceeds size limit |
| 500 | Server Error - Internal server error |

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "status_code": 400
}
```

---

## Risk Score Calculation

Risk scores are calculated on a 0-100 scale:

### From Vitals:
- **Normal vitals** (HR: 60-100, SpO2: >95, Temp: 36.5-37.5): +25 baseline
- **Elevated HR** (100-120): +5
- **Low O2** (<95): +10, (<90): +25
- **Abnormal Temp** (36.5-38°C): +5, (>38°C): +20

### From Health Records:
- **Low Risk** (0-30): Green, routine monitoring
- **Medium Risk** (30-70): Orange, regular check-ins advised
- **High Risk** (70-85): Red, close monitoring recommended
- **Critical** (>85): Critical, immediate intervention needed

Alerts are automatically created when risk_score >= 70.

---

## Database Models

All data persists in PostgreSQL with the following schema:

**Tables**:
- `patients` - Patient demographic and medical history
- `health_records` - Vitals, images, behavioral observations
- `medications` - Medication schedules and administration logs
- `sessions` - Authentication and device sessions
- `alerts` - System alerts and notifications

All tables have proper indexes on frequently queried fields for optimal performance.

---

## Testing Checklist (MVP Complete)

- ✅ Patient CRUD operations
- ✅ Medication scheduling and logging
- ✅ Adherence tracking and metrics
- ✅ Vital signs submission
- ✅ Health history retrieval
- ✅ Risk score calculation
- ✅ Database persistence
- ✅ Error handling
- ✅ HTTPS/TLS encryption
- ✅ CORS enabled for frontend

---

## Next Steps

1. **JWT Authentication** - Secure API access (Task 6)
2. **Frontend Integration** - Connect React dashboard to backend (Task 7)
3. **Image Analysis** - Integrate AI health analysis engine
4. **Real-time Alerts** - WebSocket support for live notifications
5. **Production Deployment** - Docker registry, CI/CD, monitoring

---

## Known Limitations (MVP)

- Authentication not yet implemented (use for internal testing)
- Image analysis integrated but using placeholder calculations
- WebSockets not implemented (polling required for real-time)
- Rate limiting not configured

---

**For bugs or questions, check `backend/logs/` directory for application logs.**
