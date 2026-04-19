import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useStore';
import { Heart, AlertCircle, CheckCircle, Eye, EyeOff, ArrowRight, Activity, Shield, Zap } from 'lucide-react';
import { authService } from '../services/api';

export const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const checkPasswordStrength = (password) => {
    if (!password) return '';
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const isLongEnough = password.length >= 8;
    if (isLongEnough && hasUpper && hasLower && hasDigit) return 'strong';
    if ((hasUpper || hasLower) && hasDigit) return 'medium';
    return 'weak';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'password') setPasswordStrength(checkPasswordStrength(value));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.firstName || !formData.lastName) {
      setError('All fields are required'); return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) { setError('Please enter a valid email address'); return false; }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters long'); return false; }
    if (passwordStrength === 'weak') { setError('Password must contain uppercase, lowercase, and numbers'); return false; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await authService.register(formData.email, formData.password, formData.firstName, formData.lastName);
      if (response.data.success) {
        const { token, patient_id } = response.data;
        authService.setToken(token);
        localStorage.setItem('patientId', patient_id);
        setSuccess('Account created successfully! Redirecting...');
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strengthConfig = {
    strong: { color: '#16a34a', label: 'Strong', bar: 'w-full' },
    medium: { color: '#ca8a04', label: 'Medium', bar: 'w-2/3' },
    weak:   { color: '#dc2626', label: 'Weak',   bar: 'w-1/3' },
  };

  const reqs = [
    { label: 'At least 8 characters', met: formData.password.length >= 8 },
    { label: 'One uppercase letter',  met: /[A-Z]/.test(formData.password) },
    { label: 'One lowercase letter',  met: /[a-z]/.test(formData.password) },
    { label: 'One number',            met: /\d/.test(formData.password) },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left — Brand Panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: '#9f1211' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: '#ffffff' }} />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: '#ffffff' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6" style={{ color: '#9f1211' }} />
            </div>
            <span className="text-white text-xl font-bold tracking-tight">CareSyncVision</span>
          </div>

          <h1 className="text-5xl font-extrabold text-white leading-tight mb-6" style={{ letterSpacing: '-0.03em' }}>
            Start Your<br />Health<br />Journey
          </h1>
          <p className="text-red-200 text-lg leading-relaxed max-w-sm">
            Join thousands of patients and caregivers monitoring health in real time with AI-powered insights.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            { icon: Activity, text: 'Track vitals every day' },
            { icon: Shield, text: 'Private & secure data' },
            { icon: Zap, text: 'AI-powered health insights' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-red-100">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Form Panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-white overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#9f1211' }}>
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">CareSyncVision</span>
        </div>

        <div className="w-full max-w-sm mx-auto animate-slide-up">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2" style={{ letterSpacing: '-0.025em' }}>
              Create account
            </h2>
            <p className="text-gray-500 text-sm">Fill in your details to get started</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#9f1211' }} />
              <p className="text-sm font-medium" style={{ color: '#9f1211' }}>{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-5 p-3.5 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-green-700">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First Name</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                  className="input-field" placeholder="John" disabled={loading} />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                  className="input-field" placeholder="Doe" disabled={loading} />
              </div>
            </div>

            <div>
              <label className="label">Email address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                className="input-field" placeholder="you@example.com" disabled={loading} autoComplete="email" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Password</label>
                {passwordStrength && (
                  <span className="text-xs font-semibold" style={{ color: strengthConfig[passwordStrength]?.color }}>
                    {strengthConfig[passwordStrength]?.label}
                  </span>
                )}
              </div>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password}
                  onChange={handleChange} className="input-field pr-10" placeholder="••••••••"
                  disabled={loading} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength bar */}
              {passwordStrength && (
                <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strengthConfig[passwordStrength]?.bar}`}
                    style={{ backgroundColor: strengthConfig[passwordStrength]?.color }}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword}
                  onChange={handleChange} className="input-field pr-10" placeholder="••••••••"
                  disabled={loading} autoComplete="new-password" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Requirements */}
            {formData.password && (
              <div className="grid grid-cols-2 gap-1.5">
                {reqs.map(({ label, met }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${met ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={met ? 'text-green-700' : 'text-gray-400'}>{label}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !formData.email || !formData.password}
              className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating Account...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create Account <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="font-semibold hover:underline" style={{ color: '#9f1211' }}>
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
