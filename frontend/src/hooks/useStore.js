import { create } from 'zustand';
import { authService } from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  
  // Initialize auth state from localStorage
  initialize: () => {
    const token = localStorage.getItem('jwtToken');
    const patientId = localStorage.getItem('patientId');
    const email = localStorage.getItem('email');
    const name = localStorage.getItem('name');
    if (token && patientId) {
      set({ 
        token, 
        user: { patient_id: patientId, email, name }, 
        isAuthenticated: true 
      });
    }
  },
  
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.login(email, password);
      const { token, patient_id, name } = response.data;
      
      // Store token and user info
      authService.setToken(token);
      localStorage.setItem('patientId', patient_id);
      localStorage.setItem('email', email);
      localStorage.setItem('name', name);
      
      set({ 
        token, 
        user: { patient_id, email, name },
        isAuthenticated: true,
        loading: false 
      });
      
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Login failed';
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  googleLogin: async (credential) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.googleLogin(credential);
      const { token, patient_id, email, name } = response.data;

      authService.setToken(token);
      localStorage.setItem('patientId', patient_id);
      localStorage.setItem('email', email);
      localStorage.setItem('name', name);

      set({
        token,
        user: { patient_id, email, name },
        isAuthenticated: true,
        loading: false,
      });

      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Google login failed';
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },
  
  logout: () => {
    authService.clearToken();
    localStorage.removeItem('patientId');
    localStorage.removeItem('email');
    localStorage.removeItem('name');
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },
  
  setUser: (user) => set({ user }),
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),
}));

export const usePatientStore = create((set) => ({
  patients: [],
  currentPatient: null,
  loading: false,
  error: null,
  
  setPatients: (patients) => set({ patients }),
  setCurrentPatient: (patient) => set({ currentPatient: patient }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

export const useAlertStore = create((set) => ({
  alerts: [],
  unreadCount: 0,
  
  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts],
    unreadCount: state.unreadCount + 1,
  })),
  
  clearAlerts: () => set({ alerts: [], unreadCount: 0 }),
  
  markAsRead: (alertId) => set((state) => ({
    alerts: state.alerts.map((a) =>
      a.alert_id === alertId ? { ...a, read: true } : a
    ),
  })),
}));

// AI feature toggle – persisted to localStorage so the preference survives page reload
const storedAiEnabled = localStorage.getItem('aiEnabled') === 'true';

export const useAIStore = create((set) => ({
  aiEnabled: storedAiEnabled,

  setAiEnabled: (enabled) => {
    localStorage.setItem('aiEnabled', String(enabled));
    set({ aiEnabled: enabled });
  },
}));
