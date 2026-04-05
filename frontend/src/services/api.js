import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost/api';

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
  login: (patientId, password) =>
    api.post('/auth/login', { patient_id: patientId, password }),
  
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

export default api;
