import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://caresyncvision-api-production.up.railway.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth state
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('patientId');
      window.location.href = '/login';
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

export default api;
