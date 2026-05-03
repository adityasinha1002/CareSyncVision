import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../hooks/useStore';
import { patientService, medicationService } from '../services/api';
import { HealthSummary } from '../components/HealthSummary';
import { RiskScoreChart } from '../components/RiskScoreChart';
import MedicationTracker from '../components/MedicationTracker';
import { AlertPanel } from '../components/AlertPanel';
import Sidebar from '../components/Sidebar';
import { Plus, RefreshCw, Settings, Zap, ZapOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { user, logout, aiEnabled, setAiEnabled } = useAuthStore();
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState(null);
  const [healthHistory, setHealthHistory] = useState([]);
  const [medications, setMedications] = useState([]);
  const [adherenceMetrics, setAdherenceMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadDashboardData = useCallback(async () => {
    if (!user?.patient_id) return;
    try {
      setLoading(true);
      setError(null);

      const [patientRes, historyRes, medsRes, adherenceRes] = await Promise.allSettled([
        patientService.getPatient(user.patient_id),
        patientService.getPatientHistory(user.patient_id, { days: 7 }),
        medicationService.getMedicationSchedule(user.patient_id),
        medicationService.getAdherenceMetrics(user.patient_id, { days: 30 }),
      ]);

      if (patientRes.status === 'fulfilled') setPatientData(patientRes.value.data.data);
      if (historyRes.status === 'fulfilled') setHealthHistory(historyRes.value.data.records || []);
      if (medsRes.status === 'fulfilled') setMedications(medsRes.value.data.medications || []);
      if (adherenceRes.status === 'fulfilled') setAdherenceMetrics(adherenceRes.value.data.metrics || {});
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.patient_id]);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 60000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading && !patientData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="text-center">
          <div
            className="h-10 w-10 rounded-full border-4 border-gray-200 animate-spin mx-auto mb-4"
            style={{ borderTopColor: '#9f1211' }}
          />
          <p className="text-gray-600 font-medium">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#f8fafc' }}>
      <Sidebar onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-10"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Hello, {user?.name?.split(' ')[0] || 'User'} 👋
            </h1>
            <p className="text-xs text-gray-400">
              {lastRefresh ? `Last updated ${lastRefresh.toLocaleTimeString()}` : 'Loading data…'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadDashboardData}
              className="btn-ghost p-2 rounded-lg"
              title="Refresh"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                style={{ color: '#9f1211' }}
              />
            </button>
            <button
              onClick={() => navigate('/health-input')}
              className="btn-primary text-xs px-3 py-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Record Vitals
            </button>
            <button
              onClick={() => setShowSettings((v) => !v)}
              className="btn-ghost p-2 rounded-lg"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </header>

        {/* Settings panel */}
        {showSettings && (
          <div className="bg-white border-b border-gray-100 px-6 py-4 animate-fade-in">
            <div className="max-w-sm">
              <p className="text-sm font-semibold text-gray-700 mb-3">Settings</p>
              <div
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: '#f8fafc' }}
              >
                <div className="flex items-center gap-2.5">
                  {aiEnabled
                    ? <Zap className="w-4 h-4" style={{ color: '#9f1211' }} />
                    : <ZapOff className="w-4 h-4 text-gray-400" />}
                  <div>
                    <p className="text-sm font-semibold text-gray-800">AI Analysis</p>
                    <p className="text-xs text-gray-500">Enable AI-powered health insights</p>
                  </div>
                </div>
                <button
                  onClick={() => setAiEnabled(!aiEnabled)}
                  className={`toggle-track ${aiEnabled ? 'on' : ''}`}
                  aria-label="Toggle AI analysis"
                >
                  <div className="toggle-thumb" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div
            className="mx-6 mt-4 p-3 rounded-lg border-l-4 text-sm"
            style={{ background: '#fff1f1', borderColor: '#9f1211', color: '#7d0f0e' }}
          >
            {error}
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 p-6 space-y-6">
          {/* Stats */}
          <HealthSummary data={patientData} adherenceMetrics={adherenceMetrics} />

          {/* Chart + Alerts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <RiskScoreChart data={healthHistory} />
            </div>
            <div>
              <AlertPanel patientId={user?.patient_id} />
            </div>
          </div>

          {/* Medications */}
          <MedicationTracker patientId={user?.patient_id} medications={medications} />

          {/* AI panel – only when enabled */}
          {aiEnabled && (
            <div className="card animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5" style={{ color: '#9f1211' }} />
                <h2 className="text-base font-semibold text-gray-800">AI Health Insights</h2>
                <span
                  className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: '#fff1f1', color: '#9f1211' }}
                >
                  Beta
                </span>
              </div>
              <p className="text-sm text-gray-500">
                AI-powered analysis is enabled. Connect the AI server to receive predictive health
                risk assessments and personalised recommendations based on your vitals history.
              </p>
              <div
                className="mt-3 p-3 rounded-lg text-xs text-gray-500"
                style={{ background: '#f8fafc' }}
              >
                <strong>Note:</strong> Ensure the AI server is running and accessible. Disable AI
                analysis from the Settings panel above when not needed.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
