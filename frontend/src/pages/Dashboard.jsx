import { useEffect, useState } from 'react';
import { useAuthStore } from '../hooks/useStore';
import { patientService, medicationService } from '../services/api';
import { HealthSummary } from '../components/HealthSummary';
import { RiskScoreChart } from '../components/RiskScoreChart';
import MedicationTracker from '../components/MedicationTracker';
import { AlertPanel } from '../components/AlertPanel';
import { ESPDeviceDemo } from '../components/ESPDeviceDemo';
import Sidebar from '../components/Sidebar';
import { LogOut, Plus, AlertCircle } from 'lucide-react';
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

        const patientRes = await patientService.getPatient(user.patient_id);
        setPatientData(patientRes.data.data);

        const historyRes = await patientService.getPatientHistory(user.patient_id, { days: 7 });
        setHealthHistory(historyRes.data.records || []);

        const medsRes = await medicationService.getMedicationSchedule(user.patient_id);
        setMedications(medsRes.data.medications || []);

        const adherenceRes = await medicationService.getAdherenceMetrics(user.patient_id, { days: 30 });
        setAdherenceMetrics(adherenceRes.data.metrics || {});
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load some dashboard data. Please refresh the page or try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [user?.patient_id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Welcome back,{' '}
              <span className="font-semibold text-primary">{user?.name || user?.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/health-input')}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Vitals
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-primary-50 border-l-4 border-primary rounded-lg">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-primary-800">{error}</p>
            </div>
          )}

          {/* Health summary cards */}
          <section>
            <HealthSummary data={patientData} adherenceMetrics={adherenceMetrics} />
          </section>

          {/* Risk chart + alerts */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RiskScoreChart data={healthHistory} />
            </div>
            <div>
              <AlertPanel patientId={user?.patient_id} />
            </div>
          </section>

          {/* Medication tracker + ESP device */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MedicationTracker medications={medications} />
            <ESPDeviceDemo />
          </section>
        </main>
      </div>
    </div>
  );
};
