# Frontend API Integration Guide

## Overview

The CareSyncVision frontend is now fully integrated with the backend APIs using JWT token-based authentication. All API calls go through a centralized axios client with automatic token management.

## Authentication Flow

### 1. Login Endpoint

**Endpoint:** `POST /api/auth/login`

```javascript
// Login with patient credentials
const response = await authService.login(patientId, password);
```

**Request:**
```json
{
  "patient_id": "4d8a9d39-ed16-4a74-a49d-b425cd3d7dda",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "patient_id": "4d8a9d39-ed16-4a74-a49d-b425cd3d7dda",
  "expires_in": 86400
}
```

### 2. Token Storage

Tokens are automatically stored in `localStorage` for persistence:
- **jwtToken:** JWT access token
- **patientId:** Current patient ID

### 3. Token Transmission

All API requests automatically include the token in the `Authorization` header:
```
Authorization: Bearer <jwtToken>
```

This is handled automatically by the axios interceptor in `frontend/src/services/api.js`.

### 4. Token Verification

**Endpoint:** `GET /api/auth/verify`

Verify token validity at any time:
```javascript
const response = await authService.verify();
// Returns: { success: true, valid: true, patient_id: "...", expires_at: ... }
```

### 5. Token Refresh

**Endpoint:** `POST /api/auth/refresh`

Refresh an expired token:
```javascript
const response = await authService.refresh();
// Returns new token in response.data.token
```

### 6. Logout

**Endpoint:** `POST /api/auth/logout`

Clear authentication state:
```javascript
const authStore = useAuthStore();
authStore.logout();
// Clears token and redirects to login
```

## API Services

The frontend API client is organized into service objects. All methods return axios promises.

### Health Service

```javascript
import { healthService } from '@/services/api';

// Check API health
await healthService.checkHealth();

// Get system status
await healthService.getStatus();
```

### Patient Service

```javascript
import { patientService } from '@/services/api';

// Create new patient
await patientService.createPatient(name, age, conditions);

// Get patient data
await patientService.getPatient(patientId);

// Update patient info
await patientService.updatePatient(patientId, { age, conditions });

// List all patients (with optional filtering)
await patientService.getPatientList({ active: true, limit: 50 });

// Submit vital signs
await patientService.submitVitals(patientId, {
  heart_rate: 78,
  spo2: 98,
  temperature: 37.1,
  blood_pressure: { systolic: 120, diastolic: 80 }
});

// Get patient health history
await patientService.getPatientHistory(patientId, { 
  days: 7, 
  limit: 100 
});
```

### Medication Service

```javascript
import { medicationService } from '@/services/api';

// Create medication
await medicationService.createMedication(patientId, {
  name: "Lisinopril",
  dosage: "10mg",
  frequency: "once_daily",
  scheduled_time: "08:00"
});

// Get medication schedule
await medicationService.getMedicationSchedule(patientId);

// Record medication taken
await medicationService.recordMedication(patientId, medicationId);

// Get adherence metrics
await medicationService.getAdherenceMetrics(patientId, { days: 30 });

// Check for missed doses
await medicationService.getMissedDoses(patientId);
```

## Authentication Store (Zustand)

The `useAuthStore` hook manages authentication state:

```javascript
import { useAuthStore } from '@/hooks/useStore';

const authStore = useAuthStore();

// State
console.log(authStore.user);           // { patient_id: "..." }
console.log(authStore.token);          // JWT token
console.log(authStore.isAuthenticated); // boolean
console.log(authStore.loading);        // boolean
console.log(authStore.error);          // error message or null

// Methods
await authStore.login(patientId, password);
authStore.logout();
authStore.initialize();  // Load auth state from localStorage (called on app load)
authStore.setUser(user);
authStore.setError(error);
authStore.setLoading(loading);
```

## Usage Examples

### Login Page

```javascript
import { useAuthStore } from '@/hooks/useStore';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const result = await login(patientId, password);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    // ... form UI
  );
};
```

### Protected Dashboard

```javascript
import { useAuthStore } from '@/hooks/useStore';
import { patientService } from '@/services/api';

export const Dashboard = () => {
  const { user } = useAuthStore();
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPatientData = async () => {
      try {
        const response = await patientService.getPatient(user.patient_id);
        setPatientData(response.data.data);
      } catch (error) {
        console.error('Failed to load patient data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.patient_id) {
      loadPatientData();
    }
  }, [user?.patient_id]);

  return (
    // ... dashboard UI
  );
};
```

### Vitals Submission

```javascript
import { patientService } from '@/services/api';
import { useAuthStore } from '@/hooks/useStore';

export const VitalsForm = () => {
  const { user } = useAuthStore();
  const [vitals, setVitals] = useState({
    heart_rate: '',
    spo2: '',
    temperature: '',
    blood_pressure: { systolic: '', diastolic: '' }
  });

  const handleSubmit = async () => {
    try {
      const response = await patientService.submitVitals(
        user.patient_id,
        vitals
      );
      console.log('Vitals submitted:', response.data);
    } catch (error) {
      console.error('Failed to submit vitals:', error);
    }
  };

  return (
    // ... form UI
  );
};
```

## Error Handling

### 401 Unauthorized

Automatically handled by the axios interceptor:
- Clears stored token and patient ID
- Redirects to login page

```javascript
// In api.js interceptor:
if (error.response?.status === 401) {
  localStorage.removeItem('jwtToken');
  localStorage.removeItem('patientId');
  window.location.href = '/login';
}
```

### Other Errors

Handle in components using try-catch:

```javascript
try {
  const response = await patientService.getPatient(patientId);
  // Success
} catch (error) {
  if (error.response?.status === 404) {
    // Patient not found
  } else if (error.response?.status === 500) {
    // Server error
  } else {
    // Network error
  }
}
```

## Demo Credentials

For testing, use these credentials:

```
Patient ID: 4d8a9d39-ed16-4a74-a49d-b425cd3d7dda
Password: password
```

## Environment Configuration

### Development (.env)

```
VITE_API_URL=https://localhost/api
```

### Production (.env.production)

```
VITE_API_URL=https://api.caresyncvision.com/api
```

## API Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional success message"
}
```

Error responses:

```json
{
  "error": "Error description",
  "message": "Detailed error message"
}
```

## Common API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/verify` | Verify token validity |
| POST | `/api/auth/refresh` | Refresh expired token |
| POST | `/api/auth/logout` | Logout (frontend only) |
| POST | `/api/patient` | Create new patient |
| GET | `/api/patient/:id` | Get patient details |
| PUT | `/api/patient/:id` | Update patient |
| GET | `/api/patient` | List patients |
| POST | `/api/patient/:id/vitals` | Submit vital signs |
| GET | `/api/patient/:id/history` | Get health history |
| POST | `/api/medication` | Create medication |
| GET | `/api/patient/:id/medication` | Get medication schedule |
| POST | `/api/patient/:id/medication/log` | Record medication taken |
| GET | `/api/patient/:id/medication/adherence` | Get adherence metrics |
| GET | `/api/patient/:id/medication/missed` | Check missed doses |

## Testing the API

### Using curl

```bash
# Login
TOKEN=$(curl -sk -X POST https://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"patient_id": "4d8a9d39-ed16-4a74-a49d-b425cd3d7dda", "password": "password"}' \
  | jq -r '.token')

# Use token in subsequent requests
curl -sk -X GET https://localhost/api/patient/4d8a9d39-ed16-4a74-a49d-b425cd3d7dda \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman

1. Create a POST request to `https://localhost/api/auth/login`
2. In Body (JSON), add:
   ```json
   {
     "patient_id": "4d8a9d39-ed16-4a74-a49d-b425cd3d7dda",
     "password": "password"
   }
   ```
3. Copy the `token` from response
4. For subsequent requests, add header: `Authorization: Bearer <token>`

## Troubleshooting

### "Token is missing" error
- Check that token was successfully saved to localStorage
- Verify Authorization header is being sent
- Try logging in again and copying the new token

### 401 Unauthorized on protected routes
- Token may have expired (24 hour TTL)
- Call `/api/auth/refresh` to get a new token
- Or login again with credentials

### CORS errors
- CORS is enabled on backend
- Check that request includes proper headers
- Verify API_BASE_URL is correctly pointing to backend

### "Invalid credentials" on login
- Patient ID is case-sensitive
- Password must match exactly (default: "password")
- Verify patient exists in database

## Next Steps

1. **Update Dashboard components** to fetch and display real patient data
2. **Implement real-time updates** using WebSockets for vitals
3. **Add medication reminder notifications**
4. **Create patient creation flow** in settings
5. **Add data export** functionality for health history
