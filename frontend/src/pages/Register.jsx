import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useStore';
import { GoogleLogin } from '@react-oauth/google';
import { Heart, AlertCircle, CheckCircle } from 'lucide-react';
import { authService } from '../services/api';

export const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated, googleLogin } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Validate password strength
  const checkPasswordStrength = (password) => {
    if (!password) return '';
    
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const isLongEnough = password.length >= 8;

    if (isLongEnough && hasUpper && hasLower && hasDigit) {
      return 'strong';
    } else if ((hasUpper || hasLower) && hasDigit) {
      return 'medium';
    }
    return 'weak';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.firstName || !formData.lastName) {
      setError('All fields are required');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    // Password strength
    if (passwordStrength === 'weak') {
      setError('Password must contain uppercase, lowercase, and numbers');
      return false;
    }

    // Passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    const result = await googleLogin(credentialResponse.credential);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Google sign-in failed');
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-up failed. Please try again.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await authService.register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );

      if (response.data.success) {
        // Auto-login after registration
        const { token, patient_id } = response.data;
        authService.setToken(token);
        localStorage.setItem('patientId', patient_id);
        
        setSuccess('Account created successfully! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (strength) => {
    switch(strength) {
      case 'strong': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'weak': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  const getStrengthText = (strength) => {
    switch(strength) {
      case 'strong': return 'Strong';
      case 'medium': return 'Medium';
      case 'weak': return 'Weak';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* NVIDIA-style green blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full mix-blend-screen filter blur-3xl opacity-5 animate-blob"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-primary rounded-full mix-blend-screen filter blur-3xl opacity-5 animate-blob animation-delay-2000"></div>
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
          <p className="text-gray-500 mt-2 font-light text-sm uppercase tracking-widest">Create Your Account</p>
        </div>

        {/* Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-950/40 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-950/40 border-l-4 border-green-500 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="John"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Doe"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="label flex justify-between items-center">
                <span>Password</span>
                {passwordStrength && (
                  <span className={`text-xs font-bold ${getStrengthColor(passwordStrength)}`}>
                    {getStrengthText(passwordStrength)}
                  </span>
                )}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                placeholder="••••••••"
                disabled={loading}
              />
              <p className="text-xs text-gray-600 mt-1">
                Min. 8 characters with uppercase, lowercase, and numbers
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !formData.email || !formData.password}
              className="btn-primary w-full py-3 font-bold"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-5">
            <div className="flex-1 border-t border-[#2a2a2a]" />
            <span className="mx-3 text-xs text-gray-600 uppercase tracking-widest">or</span>
            <div className="flex-1 border-t border-[#2a2a2a]" />
          </div>

          {/* Google Sign-Up */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              width="360"
              text="signup_with"
              shape="rectangular"
            />
          </div>

          <div className="mt-5 text-center text-gray-500 text-sm">
            <p>Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-primary font-semibold hover:text-primary-400 underline underline-offset-2">
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Requirements */}
        <div className="mt-5 card bg-primary/5 border-primary/20">
          <p className="text-xs font-bold text-primary mb-3 uppercase tracking-widest">Password Requirements</p>
          <ul className="space-y-1.5 text-xs text-gray-500 font-mono">
            <li className={formData.password.length >= 8 ? 'text-primary' : ''}>✓ At least 8 characters</li>
            <li className={/[A-Z]/.test(formData.password) ? 'text-primary' : ''}>✓ One uppercase letter</li>
            <li className={/[a-z]/.test(formData.password) ? 'text-primary' : ''}>✓ One lowercase letter</li>
            <li className={/\d/.test(formData.password) ? 'text-primary' : ''}>✓ One number</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Register;
