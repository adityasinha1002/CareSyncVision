import { useEffect, useState } from 'react';
import { useAuthStore } from '../hooks/useStore';
import { patientService, medicationService } from '../services/api';
import { HealthSummary } from '../components/HealthSummary';
import { RiskScoreChart } from '../components/RiskScoreChart';
import MedicationTracker from '../components/MedicationTracker';
import { AlertPanel } from '../components/AlertPanel';
import { ESPDeviceDemo } from '../components/ESPDeviceDemo';
import {
  LogOut, Plus, LayoutDashboard, Activity, Pill,
  Bell, ChevronRight, User, Menu, X, ChevronDown, LogIn
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { user, logout, isDemoMode } = useAuthStore();
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState(null);
  const [healthHistory, setHealthHistory] = useState([]);
  const [medications, setMedications] = useState([]);
  const [adherenceMetrics, setAdherenceMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.patient_id) return;
      try {
        setLoading(true);
        setError(null);

        // Demo mode: skip real API calls and use placeholder data
        if (isDemoMode) {
          setPatientData({ name: 'Demo User', age: 45, medical_conditions: [] });
          setHealthHistory([]);
          setMedications([]);
          setAdherenceMetrics({});
          setLoading(false);
          return;
        }

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
        setError('Failed to load dashboard data. Please try again.');
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

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, active: true },
    { label: 'Health Input', icon: Activity, onClick: () => navigate('/health-input') },
    { label: 'Medications', icon: Pill },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div
            className="inline-block w-12 h-12 rounded-full border-4 border-gray-100 mb-4"
            style={{ borderTopColor: '#9f1211', animation: 'spin 0.8s linear infinite' }}
          />
          <p className="text-gray-500 text-sm font-medium">Loading dashboard...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Demo mode banner */}
      {isDemoMode && (
        <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between flex-shrink-0 z-40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Demo Mode</span>
            <span className="hidden sm:inline text-xs text-amber-600">· Sample data — no real account needed</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 underline underline-offset-2"
          >
            <LogIn className="w-3.5 h-3.5" />
            Exit Demo &amp; Sign In
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
      {/* Sidebar — Desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-gray-100 shadow-soft">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-100 shadow-sm">
              <img src="/logo.svg" alt="CareSyncVision logo" className="w-6 h-6" />
            </div>
            <span className="font-bold text-gray-900 text-base tracking-tight">CareSyncVision</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`nav-item w-full text-left ${item.active ? 'active' : ''}`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.name || 'Patient'}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          {isDemoMode && (
            <div className="px-3 mb-1">
              <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded">Demo Mode</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="nav-item w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="w-4 h-4" />
            {isDemoMode ? 'Exit Demo & Sign In' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 w-64 bg-white flex flex-col h-full shadow-xl">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-100 shadow-sm">
                  <img src="/logo.svg" alt="CareSyncVision logo" className="w-6 h-6" />
                </div>
                <span className="font-bold text-gray-900 text-base">CareSyncVision</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5">
              {navItems.map((item) => (
                <button key={item.label} onClick={() => { item.onClick?.(); setSidebarOpen(false); }}
                  className={`nav-item w-full text-left ${item.active ? 'active' : ''}`}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="px-3 py-4 border-t border-gray-100">
              {isDemoMode && (
                <div className="px-3 mb-2">
                  <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded">Demo Mode</span>
                </div>
              )}
              <button onClick={handleLogout} className="nav-item w-full text-left text-red-500 hover:bg-red-50">
                <LogOut className="w-4 h-4" /> {isDemoMode ? 'Exit Demo & Sign In' : 'Sign Out'}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900" style={{ letterSpacing: '-0.02em' }}>
                Health Dashboard
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">
                Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/health-input')}
              className="btn-primary px-4 py-2 text-sm hidden sm:flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Record Vitals
            </button>
            <button className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 transition-colors">
              <Bell className="w-4 h-4" />
            </button>

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[7rem] truncate">
                  {user?.name || 'Patient'}
                </span>
                {isDemoMode && (
                  <span className="hidden sm:inline text-xs bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">
                    Demo
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
              </button>

              {userMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 overflow-hidden">
                    {/* User info */}
                    <div className="px-3.5 py-2.5 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-900 truncate">{user?.name || 'Patient'}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                      {isDemoMode && (
                        <span className="mt-1 inline-block text-xs bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">
                          Demo Mode
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                      className="w-full text-left px-3.5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      {isDemoMode ? 'Exit Demo & Sign In' : 'Sign Out'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#9f1211' }} />
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* Quick action — mobile */}
          <div className="sm:hidden">
            <button
              onClick={() => navigate('/health-input')}
              className="btn-primary w-full py-3 text-sm"
            >
              <Plus className="w-4 h-4" /> Record Vital Signs
            </button>
          </div>

          {/* Summary stats */}
          <HealthSummary data={patientData} adherenceMetrics={adherenceMetrics} />

          {/* Charts row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <RiskScoreChart data={healthHistory} />
            <AlertPanel patientId={user?.patient_id} />
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <MedicationTracker medications={medications} patientId={user?.patient_id} />
            <ESPDeviceDemo patientId={user?.patient_id} />
          </div>

          {/* Record vitals CTA */}
          {healthHistory.length === 0 && !error && (
            <div
              className="rounded-xl p-8 text-center"
              style={{ background: 'linear-gradient(135deg, #9f1211 0%, #6e0d0d 100%)' }}
            >
              <Activity className="w-10 h-10 text-white/60 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">Start Tracking Your Health</h3>
              <p className="text-red-200 text-sm mb-5">Record your first vital signs to see trends and insights.</p>
              <button
                onClick={() => navigate('/health-input')}
                className="inline-flex items-center gap-2 bg-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-red-50 transition-colors"
                style={{ color: '#9f1211' }}
              >
                <Plus className="w-4 h-4" /> Record Vital Signs
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>
      </div>
    </div>
  );
};

