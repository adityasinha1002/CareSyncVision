import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useStore';
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
  const { isAuthenticated, initialize } = useAuthStore();

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
        // Auto-login after registration: persist credentials and sync store
        const { token, patient_id, name } = response.data;
        authService.setToken(token);
        localStorage.setItem('patientId', patient_id);
        localStorage.setItem('email', formData.email);
        localStorage.setItem('name', name || '');
        // Sync the Zustand store so isAuthenticated becomes true before navigation
        initialize();
        
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-3 rounded-full">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-900 bg-clip-text text-transparent">
            CareSyncVision
          </h1>
          <p className="text-gray-600 mt-2 font-light">Create Your Account</p>
        </div>

        {/* Card */}
        <div className="card backdrop-blur-md bg-white/95 border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-700 text-sm">{success}</p>
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
                  <span className={`text-xs font-semibold ${getStrengthColor(passwordStrength)}`}>
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
              <p className="text-xs text-gray-500 mt-1">
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
              className="btn-primary w-full py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-4 text-center text-gray-600 text-sm">
            <p>Already have an account? <button onClick={() => navigate('/login')} className="text-primary-600 font-semibold hover:underline">Sign in</button></p>
          </div>
        </div>

        {/* Requirements */}
        <div className="mt-6 card bg-blue-50 border-blue-200">
          <p className="text-sm font-semibold text-blue-900 mb-3">Password Requirements:</p>
          <ul className="space-y-2 text-xs text-blue-800">
            <li className={formData.password.length >= 8 ? 'text-green-600' : ''}>✓ At least 8 characters</li>
            <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}>✓ One uppercase letter</li>
            <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : ''}>✓ One lowercase letter</li>
            <li className={/\d/.test(formData.password) ? 'text-green-600' : ''}>✓ One number</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Register;
