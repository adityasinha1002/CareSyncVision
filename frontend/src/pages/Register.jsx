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
  const { isAuthenticated } = useAuthStore();

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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f8fafc' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl" style={{ background: '#9f1211' }}>
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold" style={{ color: '#9f1211' }}>CareSyncVision</h1>
          <p className="text-gray-500 mt-1 text-sm">Create your account</p>
        </div>

        {/* Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg border-l-4 flex items-start gap-3 text-sm"
                style={{ background: '#fff1f1', borderColor: '#9f1211', color: '#7d0f0e' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg border-l-4 flex items-start gap-3 text-sm"
                style={{ background: '#f0fdf4', borderColor: '#16a34a', color: '#166534' }}>
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{success}</p>
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
                autoComplete="email"
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
                autoComplete="new-password"
              />
              <div className="flex gap-1 mt-1.5">
                {['weak', 'medium', 'strong'].map((level, i) => (
                  <div
                    key={level}
                    className="h-1 flex-1 rounded-full transition-colors"
                    style={{
                      background: passwordStrength === 'strong'
                        ? '#16a34a'
                        : passwordStrength === 'medium' && i < 2
                          ? '#d97706'
                          : passwordStrength === 'weak' && i === 0
                            ? '#9f1211'
                            : '#e5e7eb'
                    }}
                  />
                ))}
              </div>
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
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !formData.email || !formData.password}
              className="btn-primary w-full py-3 text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating Account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-semibold hover:underline"
              style={{ color: '#9f1211' }}
            >
              Sign in
            </button>
          </div>
        </div>

        {/* Requirements */}
        <div className="mt-5 p-4 rounded-xl border text-sm"
          style={{ borderColor: '#fca5a5', background: '#fff1f1' }}>
          <p className="font-semibold mb-2" style={{ color: '#9f1211' }}>Password Requirements:</p>
          <ul className="space-y-1 text-xs" style={{ color: '#7d0f0e' }}>
            <li className={formData.password.length >= 8 ? 'text-green-600' : ''}>
              {formData.password.length >= 8 ? '✓' : '○'} At least 8 characters
            </li>
            <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}>
              {/[A-Z]/.test(formData.password) ? '✓' : '○'} One uppercase letter
            </li>
            <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : ''}>
              {/[a-z]/.test(formData.password) ? '✓' : '○'} One lowercase letter
            </li>
            <li className={/\d/.test(formData.password) ? 'text-green-600' : ''}>
              {/\d/.test(formData.password) ? '✓' : '○'} One number
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Register;
