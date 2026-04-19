import { useEffect, useState } from 'react';
import { useAuthStore } from '../hooks/useStore';
import { patientService, medicationService } from '../services/api';
import { HealthSummary } from '../components/HealthSummary';
import { RiskScoreChart } from '../components/RiskScoreChart';
import MedicationTracker from '../components/MedicationTracker';
import { AlertPanel } from '../components/AlertPanel';
import { ESPDeviceDemo } from '../components/ESPDeviceDemo';
import { LogOut, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState(null);
  const [healthHistory, setHealthHistory] = useState([]);
  const [medications, setMedications] = useState([]);
  const [adherenceMetrics, setAdherenceMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.patient_id) {
        setLoading(false);
        return;
      }

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">CareSyncVision</h1>
          <p className="text-sm text-gray-500">Welcome back, {user?.name || 'User'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/health-input')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition"
          >
            <Plus className="w-4 h-4" /> Add Vitals
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 border border-gray-200 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Error banner */}
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Health Summary Cards */}
        <HealthSummary data={patientData} adherenceMetrics={adherenceMetrics} />

        {/* Risk Score Chart */}
        <RiskScoreChart data={healthHistory} />

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <MedicationTracker />
          </div>
          <div className="lg:col-span-1">
            <AlertPanel patientId={user?.patient_id} />
          </div>
          <div className="lg:col-span-1">
            <ESPDeviceDemo />
          </div>
        </div>
      </div>
    </div>
  );
};
