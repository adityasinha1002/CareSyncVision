import { useEffect, useState } from 'react';
import { useAuthStore, useAIStore } from '../hooks/useStore';
import { patientService, medicationService } from '../services/api';
import { HealthSummary } from '../components/HealthSummary';
import { RiskScoreChart } from '../components/RiskScoreChart';
import MedicationTracker from '../components/MedicationTracker';
import { AlertPanel } from '../components/AlertPanel';
import { ESPDeviceDemo } from '../components/ESPDeviceDemo';
import { LogOut, Plus, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const { aiEnabled, setAiEnabled } = useAIStore();
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState(null);
  const [healthHistory, setHealthHistory] = useState([]);
  const [medications, setMedications] = useState([]);
  const [adherenceMetrics, setAdherenceMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.patient_id) return;

      try {
        setLoading(true);
        setError(null);

        // Load patient data
        const patientRes = await patientService.getPatient(user.patient_id);
        setPatientData(patientRes.data.data);

        // Load health history (last 7 days)
        const historyRes = await patientService.getPatientHistory(user.patient_id, { days: 7 });
        setHealthHistory(historyRes.data.records || []);

        // Load medications
        const medsRes = await medicationService.getMedicationSchedule(user.patient_id);
        setMedications(medsRes.data.medications || []);

        // Load adherence metrics
        const adherenceRes = await medicationService.getAdherenceMetrics(user.patient_id, { days: 30 });
        setAdherenceMetrics(adherenceRes.data.metrics || {});
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [user?.patient_id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header with AI toggle */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="dashboard-header">CareSyncVision Dashboard</h1>
        <div className="flex items-center gap-3">
          {/* AI Service Toggle */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
            <Cpu className={`w-4 h-4 ${aiEnabled ? 'text-green-600' : 'text-gray-400'}`} />
            <span className="text-sm font-medium text-gray-700">AI Analysis</span>
            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                aiEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
              title={aiEnabled ? 'Disable AI Analysis' : 'Enable AI Analysis'}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  aiEnabled ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* AI status banner */}
      {aiEnabled && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-800">
          <Cpu className="w-4 h-4 flex-shrink-0" />
          AI Analysis is <strong className="ml-1">enabled</strong>. The AI server will process your health data in real time.
        </div>
      )}

      <div className="dashboard-card">
        {/* ...existing dashboard content... */}
      </div>
    </div>
  );
};
