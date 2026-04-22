import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://caresyncvision-api-production.up.railway.app/api';

// AI server is an optional separate service.
// Set VITE_AI_SERVER_URL in Vercel env vars if you deploy the AI server.
const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios instance for the AI server — only used when aiEnabled is true.
const aiApi = AI_SERVER_URL
  ? axios.create({
      baseURL: AI_SERVER_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    })
  : null;

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Attach the same JWT token to AI server requests when it's available.
if (aiApi) {
  aiApi.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('jwtToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
}

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Don't redirect to login when running in client-side demo mode
      if (localStorage.getItem('isDemoMode') !== 'true') {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('patientId');
        window.location.href = '/login';
      }
    }
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Authentication Service
export const authService = {
  register: (email, password, firstName, lastName) =>
    api.post('/auth/register', { 
      email, 
      password, 
      first_name: firstName, 
      last_name: lastName 
    }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  googleAuth: (credential) =>
    api.post('/auth/google', { credential }),
  
  verify: () =>
    api.get('/auth/verify'),
  
  refresh: () =>
    api.post('/auth/refresh'),
  
  logout: () =>
    api.post('/auth/logout'),
  
  setToken: (token) => {
    localStorage.setItem('jwtToken', token);
  },
  
  getToken: () =>
    localStorage.getItem('jwtToken'),
  
  clearToken: () => {
    localStorage.removeItem('jwtToken');
  },
};

export const healthService = {
  checkHealth: () => api.get('/health'),
  getStatus: () => api.get('/status'),
  
  submitVitals: (vitalsData) =>
    api.post('/vitals', vitalsData),
  
  getRecentVitals: (limit = 10) =>
    api.get('/vitals/recent', { params: { limit } }),
};

export const patientService = {
  createPatient: (name, age, conditions) =>
    api.post('/patient', { name, age, conditions }),
  
  getPatient: (patientId) =>
    api.get(`/patient/${patientId}`),
  
  updatePatient: (patientId, data) =>
    api.put(`/patient/${patientId}`, data),
  
  getPatientList: (params) =>
    api.get('/patient', { params }),
  
  submitVitals: (patientId, vitals) =>
    api.post(`/patient/${patientId}/vitals`, vitals),
  
  getPatientHistory: (patientId, params) =>
    api.get(`/patient/${patientId}/history`, { params }),
};

export const medicationService = {
  createMedication: (patientId, medicationData) =>
    api.post('/medication', { ...medicationData, patient_id: patientId }),
  
  getMedicationSchedule: (patientId) =>
    api.get(`/patient/${patientId}/medication`),
  
  recordMedication: (patientId, medicationId) =>
    api.post(`/patient/${patientId}/medication/log`, { medication_id: medicationId }),
  
  getAdherenceMetrics: (patientId, params) =>
    api.get(`/patient/${patientId}/medication/adherence`, { params }),
  
  getMissedDoses: (patientId) =>
    api.get(`/patient/${patientId}/medication/missed`),
};

// ESP32 Device Integration Service (Demo Mode)
export const espDeviceService = {
  getStatus: () =>
    api.get('/esp-device/status'),
  
  connect: (deviceId, connectionMethod = 'bluetooth') =>
    api.post('/esp-device/connect', { device_id: deviceId, connection_method: connectionMethod }),
  
  disconnect: () =>
    api.post('/esp-device/disconnect'),
  
  getFirmwareInfo: () =>
    api.get('/esp-device/firmware'),
};

// AI Analysis Service
// All methods throw if the AI server URL is not configured.
const _requireAiApi = () => {
  if (!aiApi) throw new Error('AI server URL is not configured (VITE_AI_SERVER_URL)');
  return aiApi;
};

export const aiService = {
  isAvailable: () => Boolean(aiApi),

  getStatus: () =>
    _requireAiApi().get('/api/health'),

  submitVitals: (patientId, vitals) =>
    _requireAiApi().post('/api/patient/vitals', { patient_id: patientId, ...vitals }),

  submitHealthData: (imageBlob, patientId, sessionId) => {
    const instance = _requireAiApi();
    return instance.post('/api/patient/health-data', imageBlob, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Patient-ID': patientId,
        'X-Session-ID': sessionId || '',
      },
    });
  },

  logMedication: (patientId, medicationData) =>
    _requireAiApi().post('/api/patient/medication', {
      patient_id: patientId,
      ...medicationData,
    }),
};

export default api;
