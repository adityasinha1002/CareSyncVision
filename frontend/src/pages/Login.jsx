import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useStore';
import { GoogleLogin } from '@react-oauth/google';
import { Heart } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login, googleLogin, loading, error, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const result = await googleLogin(credentialResponse.credential);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  const handleGoogleError = () => {
    useAuthStore.getState().setError('Google sign-in failed. Please try again.');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* NVIDIA-style green blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full mix-blend-screen filter blur-3xl opacity-5 animate-blob"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-primary rounded-full mix-blend-screen filter blur-3xl opacity-5 animate-blob animation-delay-2000"></div>
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)'}}></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 border border-primary/30 p-3 rounded-full glow-green-sm">
              <Heart className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-primary tracking-tight">
            CareSyncVision
          </h1>
          <p className="text-gray-500 mt-2 font-light text-sm uppercase tracking-widest">Intelligent Health Monitoring</p>
        </div>

        {/* Card */}
        <div className="card border-[#2a2a2a]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-950/40 border-l-4 border-red-500 rounded-lg">
                <p className="text-red-400 font-medium text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn-primary w-full py-3 font-bold"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-5">
            <div className="flex-1 border-t border-[#2a2a2a]" />
            <span className="mx-3 text-xs text-gray-600 uppercase tracking-widest">or</span>
            <div className="flex-1 border-t border-[#2a2a2a]" />
          </div>

          {/* Google Sign-In */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              width="360"
              text="signin_with"
              shape="rectangular"
            />
          </div>

          <div className="mt-5 text-center text-gray-500 text-sm">
            <p>Don't have an account?{' '}
              <button onClick={() => navigate('/register')} className="text-primary font-semibold hover:text-primary-400 underline underline-offset-2">
                Sign up
              </button>
            </p>
          </div>
        </div>

        {/* Demo Info */}
        <div className="mt-5 card bg-primary/5 border-primary/20">
          <p className="text-xs font-bold text-primary mb-3 uppercase tracking-widest">Demo Account</p>
          <div className="space-y-1 text-sm text-gray-300 font-mono">
            <p><span className="text-gray-500">Email:</span> demo@example.com</p>
            <p><span className="text-gray-500">Password:</span> DemoPass123</p>
          </div>
          <p className="text-xs text-gray-600 mt-3">Or create a new account to get started</p>
        </div>
      </div>
    </div>
  );
};
