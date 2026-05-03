import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useStore';
import { Heart, Chrome, Eye, EyeOff, Zap } from 'lucide-react';
import { authService } from '../services/api';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();
  const { login, loading, error, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    const result = await login(email, password);
    if (result.success) navigate('/dashboard');
  };

  const handleDemoLogin = () => {
    setEmail('demo@example.com');
    setPassword('DemoPass123');
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsRedirecting(true);
      const response = await authService.getOAuthAuthorizationUrl();
      const { authorization_url } = response.data;
      if (!authorization_url) {
        alert('Failed to get authorization URL. Please try again.');
        setIsRedirecting(false);
        return;
      }
      window.location.href = authorization_url;
    } catch (err) {
      console.error('Failed to start OAuth flow:', err);
      alert('Failed to start Google sign-in. Please try again.');
      setIsRedirecting(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafc' }}>
      {/* Left panel – brand */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a0404 0%, #3d0a0a 50%, #7d0f0e 100%)' }}
      >
        {/* decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: '#9f1211', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: '#9f1211', transform: 'translate(-30%, 30%)' }} />

        <div className="relative z-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <Heart className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">CareSyncVision</h1>
          <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Intelligent Health Monitoring Platform
          </p>
          <div className="grid grid-cols-1 gap-4 text-left max-w-xs mx-auto">
            {[
              { icon: '📊', title: 'Real-time Analytics', desc: 'Track vital signs live' },
              { icon: '💊', title: 'Medication Tracking', desc: 'Never miss a dose' },
              { icon: '🤖', title: 'AI Risk Assessment', desc: 'Predictive health insights' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.07)' }}>
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl" style={{ background: '#9f1211' }}>
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#9f1211' }}>CareSyncVision</h1>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 mt-1">Sign in to your account to continue</p>
          </div>

          <div className="card">
            {error && (
              <div className="mb-4 p-3 rounded-lg border-l-4 text-sm"
                style={{ background: '#fff1f1', borderColor: '#9f1211', color: '#7d0f0e' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="••••••••"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="btn-primary w-full py-3 text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-400 font-medium">OR</span>
              </div>
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isRedirecting || loading}
              className="w-full py-2.5 px-4 border border-gray-200 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Chrome className="w-4 h-4" />
              {isRedirecting ? 'Redirecting to Google...' : 'Continue with Google'}
            </button>

            <div className="mt-4 text-center text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="font-semibold hover:underline"
                style={{ color: '#9f1211' }}
              >
                Create one
              </button>
            </div>
          </div>

          {/* Demo account card */}
          <div className="mt-5 p-4 rounded-xl border border-dashed"
            style={{ borderColor: '#fca5a5', background: '#fff1f1' }}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4" style={{ color: '#9f1211' }} />
              <p className="text-sm font-semibold" style={{ color: '#9f1211' }}>Quick Demo Access</p>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Try the platform with pre-seeded health data — no sign-up needed.
            </p>
            <div className="flex items-center justify-between mb-3 text-xs text-gray-600">
              <span><strong>Email:</strong> demo@example.com</span>
              <span><strong>Password:</strong> DemoPass123</span>
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2 rounded-lg text-xs font-semibold border transition-colors"
              style={{ borderColor: '#9f1211', color: '#9f1211', background: 'white' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#9f1211'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#9f1211'; }}
            >
              Fill Demo Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
