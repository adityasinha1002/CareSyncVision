import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useStore';
import { Heart, Chrome } from 'lucide-react';
import { authService } from '../services/api';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();
  const { login, loading, error, isAuthenticated } = useAuthStore();

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
      
      // Redirect to Google (backend will handle the callback)
      window.location.href = authorization_url;
    } catch (err) {
      console.error('Failed to start OAuth flow:', err);
      alert('Failed to start Google sign-in. Please try again.');
      setIsRedirecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-linear-to-br from-primary-600 to-primary-700 p-3 rounded-full">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-primary-600 to-primary-900 bg-clip-text text-transparent">
            CareSyncVision
          </h1>
          <p className="text-gray-600 mt-2 font-light">Intelligent Health Monitoring</p>
        </div>

        {/* Card */}
        <div className="card backdrop-blur-md bg-white/95 border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <p className="text-red-700 font-medium">{error}</p>
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
              className="btn-primary w-full py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isRedirecting || loading}
            className="w-full py-3 px-4 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Chrome className="w-5 h-5" />
            {isRedirecting ? 'Redirecting to Google...' : 'Sign in with Google'}
          </button>

          <div className="mt-4 text-center text-gray-600 text-sm">
            <p>Don't have an account? <button onClick={() => navigate('/register')} className="text-primary-600 font-semibold hover:underline">Sign up</button></p>
          </div>
        </div>

        {/* Demo Info */}
        <div className="mt-6 card bg-linear-to-r from-primary-50 to-primary-100 border-primary-200">
          <p className="text-sm font-semibold text-primary-900 mb-3">Test with Demo Account:</p>
          <div className="space-y-2 text-sm text-primary-800">
            <p><span className="font-semibold">Email:</span> demo@example.com</p>
            <p><span className="font-semibold">Password:</span> DemoPass123</p>
          </div>
          <p className="text-xs text-primary-700 mt-3">Or create a new account to get started</p>
        </div>
      </div>
    </div>
  );
};
