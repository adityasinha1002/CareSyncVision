import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../hooks/useStore';
import { Heart, Loader } from 'lucide-react';
import { authService } from '../services/api';

export const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth, setError, setLoading } = useAuthStore();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        setLoading(true);

        // Extract authorization code from URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          const errorMsg = errorDescription || error;
          console.error(`OAuth error: ${errorMsg}`);
          setError(`Google sign-in failed: ${errorMsg}`);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!code) {
          setError('No authorization code received from Google');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Exchange code for token
        const response = await authService.handleOAuthCallback(code);
        
        if (!response.data.success) {
          setError('Failed to complete authentication');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        const { token, patient_id, email, name } = response.data;

        if (!token || !patient_id) {
          setError('Invalid authentication response');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Store authentication data
        authService.setToken(token);
        localStorage.setItem('patientId', patient_id);
        localStorage.setItem('email', email);
        localStorage.setItem('name', name);
        localStorage.setItem('oauthLogin', 'true');

        // Update store
        setAuth({
          user: { patient_id, email, name },
          token
        });

        // Redirect to dashboard
        navigate('/dashboard');
      } catch (err) {
        console.error('OAuth callback error:', err);
        const errorMsg = err.response?.data?.error || 'Authentication failed. Please try again.';
        setError(errorMsg);
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setLoading(false);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, setAuth, setError, setLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-3 rounded-full">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-900 bg-clip-text text-transparent">
            CareSyncVision
          </h1>
          <p className="text-gray-600 mt-2 font-light">Completing sign-in...</p>
        </div>

        <div className="card backdrop-blur-md bg-white/95 border-gray-200 mt-8">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader className="w-12 h-12 text-primary-600 animate-spin mb-4" />
            <p className="text-gray-600 text-center">
              Please wait while we complete your Google sign-in...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
