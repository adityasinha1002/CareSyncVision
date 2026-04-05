import { useEffect, useState } from 'react';
import { useAuthStore } from '../hooks/useStore';
import { patientService, medicationService } from '../services/api';
import { HealthSummary } from '../components/HealthSummary';
import { RiskScoreChart } from '../components/RiskScoreChart';
import { MedicationTracker } from '../components/MedicationTracker';
import { AlertPanel } from '../components/AlertPanel';
import { LogOut } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CareSyncVision Dashboard</h1>
            <p className="text-gray-600 mt-1">
              {patientData?.name || 'Patient'} • Patient Health Monitoring & Medication Tracking
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 mt-4">
          {error}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Health Summary Cards */}
        <HealthSummary data={patientData} adherenceMetrics={adherenceMetrics} />

        {/* Charts and Alerts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Risk Score Chart */}
          <div className="lg:col-span-2">
            <RiskScoreChart data={healthHistory} />
          </div>

          {/* Alert Panel */}
          <div>
            <AlertPanel patientId={user?.patient_id} />
          </div>
        </div>

        {/* Medication Tracker */}
        <div className="mt-6">
          <MedicationTracker medications={medications} patientId={user?.patient_id} />
        </div>
      </main>
    </div>
  );
};
