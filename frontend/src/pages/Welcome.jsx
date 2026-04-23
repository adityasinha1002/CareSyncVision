import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useStore';
import { Activity, Shield, Zap, ArrowRight, LogIn } from 'lucide-react';

export const Welcome = () => {
  const navigate = useNavigate();
  const { user, isDemoMode, logout } = useAuthStore();

  const handleExitDemo = () => {
    logout();
    navigate('/login');
  };

  const features = [
    {
      icon: Activity,
      title: 'Real-time Monitoring',
      desc: 'Track heart rate, blood pressure, temperature and weight continuously.',
    },
    {
      icon: Shield,
      title: 'AI Risk Assessment',
      desc: 'Intelligent health risk scores flag concerns before they become critical.',
    },
    {
      icon: Zap,
      title: 'Instant Alerts',
      desc: 'Critical health events trigger immediate notifications to care teams.',
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Demo mode top-banner */}
      {isDemoMode && (
        <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Demo Mode</span>
            <span className="hidden sm:inline text-xs text-amber-600">· Exploring with sample data — no real account needed</span>
          </div>
          <button
            onClick={handleExitDemo}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 underline underline-offset-2"
          >
            <LogIn className="w-3.5 h-3.5" />
            Exit Demo &amp; Sign In
          </button>
        </div>
      )}

      {/* Main content — vertically centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 animate-fade-in">
        <div className="w-full max-w-2xl text-center">

          {/* Logo */}
          <div className="flex justify-center mb-7">
            <div className="w-24 h-24 bg-white rounded-2xl shadow-md border border-gray-100 flex items-center justify-center">
              <img src="/logo.svg" alt="CareSyncVision" className="w-16 h-16" />
            </div>
          </div>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4"
            style={{ letterSpacing: '-0.03em' }}
          >
            Welcome to{' '}
            <span style={{ color: '#9f1211' }}>CareSyncVision</span>
          </h1>
          <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
            An intelligent health monitoring platform powered by AI.
            Track vitals, receive risk assessments, and stay ahead of
            critical health events — all in one place.
          </p>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-5 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: '#9f1211' }}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-base"
          >
            Enter Dashboard
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Footer note */}
          {isDemoMode ? (
            <p className="mt-5 text-sm text-gray-400">
              You&apos;re exploring in demo mode.{' '}
              <button
                onClick={handleExitDemo}
                className="font-semibold hover:underline"
                style={{ color: '#9f1211' }}
              >
                Sign in with your own account
              </button>
            </p>
          ) : (
            user?.name && (
              <p className="mt-5 text-sm text-gray-400">
                Signed in as{' '}
                <span className="font-semibold text-gray-600">{user.name}</span>
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Welcome;
