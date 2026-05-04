import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../hooks/useStore';
import { healthService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Check, AlertCircle, Activity, TrendingUp, Droplet, Thermometer, Weight, ArrowLeft } from 'lucide-react';

export const HealthInput = () => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    heart_rate: '',
    systolic_bp: '',
    diastolic_bp: '',
    temperature: '',
    weight: '',
    notes: ''
  });

  const [recentVitals, setRecentVitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [loadingVitals, setLoadingVitals] = useState(true);

  // Field-level validation rules
  const validationRules = {
    heart_rate: {
      min: 30,
      max: 200,
      unit: 'BPM',
      label: 'Heart Rate',
      message: 'Heart rate must be between 30 and 200 BPM'
    },
    systolic_bp: {
      min: 50,
      max: 250,
      unit: 'mmHg',
      label: 'Systolic BP',
      message: 'Systolic BP must be between 50 and 250 mmHg'
    },
    diastolic_bp: {
      min: 30,
      max: 150,
      unit: 'mmHg',
      label: 'Diastolic BP',
      message: 'Diastolic BP must be between 30 and 150 mmHg'
    },
    temperature: {
      min: 95,
      max: 106,
      unit: '°F',
      label: 'Temperature',
      message: 'Temperature must be between 95°F and 106°F'
    },
    weight: {
      min: 50,
      max: 500,
      unit: 'lbs',
      label: 'Weight',
      message: 'Weight must be between 50 and 500 lbs'
    }
  };

  // Load recent vitals on component mount
  useEffect(() => {
    const loadRecentVitals = async () => {
      if (!token) return;
      try {
        setLoadingVitals(true);
        const response = await healthService.getRecentVitals(5);
        setRecentVitals(response.data.vitals || []);
      } catch (err) {
        console.error('Failed to load recent vitals:', err);
      } finally {
        setLoadingVitals(false);
      }
    };

    loadRecentVitals();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateForm = () => {
    // Check all required fields are filled
    const requiredFields = ['heart_rate', 'systolic_bp', 'diastolic_bp', 'temperature', 'weight'];
    for (let field of requiredFields) {
      if (!formData[field] || formData[field].trim() === '') {
        setError(`${validationRules[field].label} is required`);
        return false;
      }
    }

    // Validate field values
    try {
      const heartRate = parseFloat(formData.heart_rate);
      const systolicBp = parseFloat(formData.systolic_bp);
      const diastolicBp = parseFloat(formData.diastolic_bp);
      const temperature = parseFloat(formData.temperature);
      const weight = parseFloat(formData.weight);

      // Check ranges
      if (isNaN(heartRate) || heartRate < 30 || heartRate > 200) {
        setError(validationRules.heart_rate.message);
        return false;
      }
      if (isNaN(systolicBp) || systolicBp < 50 || systolicBp > 250) {
        setError(validationRules.systolic_bp.message);
        return false;
      }
      if (isNaN(diastolicBp) || diastolicBp < 30 || diastolicBp > 150) {
        setError(validationRules.diastolic_bp.message);
        return false;
      }
      if (diastolicBp >= systolicBp) {
        setError('Diastolic BP must be less than Systolic BP');
        return false;
      }
      if (isNaN(temperature) || temperature < 95 || temperature > 106) {
        setError(validationRules.temperature.message);
        return false;
      }
      if (isNaN(weight) || weight < 50 || weight > 500) {
        setError(validationRules.weight.message);
        return false;
      }
    } catch (err) {
      setError('Please enter valid numbers');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitted(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await healthService.submitVitals(formData);
      
      if (response.data.success) {
        setSubmitted(true);
        setFormData({
          heart_rate: '',
          systolic_bp: '',
          diastolic_bp: '',
          temperature: '',
          weight: '',
          notes: ''
        });

        // Reload recent vitals
        try {
          const vitalsResponse = await healthService.getRecentVitals(5);
          setRecentVitals(vitalsResponse.data.vitals || []);
        } catch (err) {
          console.error('Failed to reload vitals:', err);
        }

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSubmitted(false);
        }, 3000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to submit vital signs';
      setError(errorMsg);
      console.error('Error submitting vitals:', err);
    } finally {
      setLoading(false);
    }
  };

  const getVitalStatus = (field, value) => {
    if (!value) return null;
    const numValue = parseFloat(value);
    const rule = validationRules[field];

    // Define normal ranges (typical values)
    const normalRanges = {
      heart_rate: { min: 60, max: 100 },
      systolic_bp: { min: 90, max: 120 },
      diastolic_bp: { min: 60, max: 80 },
      temperature: { min: 97.5, max: 99.5 },
      weight: { min: 0, max: 300 } // Just for validation
    };

    const range = normalRanges[field];
    if (numValue >= range.min && numValue <= range.max) {
      return 'normal';
    } else if (numValue < rule.min || numValue > rule.max) {
      return 'error';
    }
    return 'caution';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal':
        return 'text-green-600';
      case 'caution':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#f8fafc' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm font-medium mb-4 transition-colors"
            style={{ color: '#9f1211' }}
            onMouseEnter={e => e.currentTarget.style.color = '#7d0f0e'}
            onMouseLeave={e => e.currentTarget.style.color = '#9f1211'}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-7 h-7" style={{ color: '#9f1211' }} />
            Record Vital Signs
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Enter your health measurements. This data helps monitor your health status.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="card">
              {submitted && (
                <div className="mb-5 p-4 rounded-lg border-l-4 flex items-start gap-3"
                  style={{ background: '#f0fdf4', borderColor: '#16a34a' }}>
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-800 font-medium text-sm">Vital signs recorded!</p>
                    <p className="text-green-700 text-xs">Your data has been saved to your health history.</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-5 p-4 rounded-lg border-l-4 flex items-start gap-3"
                  style={{ background: '#fff1f1', borderColor: '#9f1211' }}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#9f1211' }} />
                  <p className="text-sm" style={{ color: '#7d0f0e' }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Heart Rate */}
                <div>
                  <label className="label">Heart Rate (BPM) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="heart_rate"
                      value={formData.heart_rate}
                      onChange={handleInputChange}
                      placeholder="72"
                      className="input-field pr-10"
                      min="30" max="200" step="1"
                    />
                    {formData.heart_rate && (
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 ${getStatusColor(getVitalStatus('heart_rate', formData.heart_rate))}`}>
                        <TrendingUp className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Normal range: 60–100 BPM</p>
                </div>

                {/* Blood Pressure */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Systolic BP (mmHg) *</label>
                    <input
                      type="number"
                      name="systolic_bp"
                      value={formData.systolic_bp}
                      onChange={handleInputChange}
                      placeholder="120"
                      className="input-field"
                      min="50" max="250" step="1"
                    />
                    <p className="text-xs text-gray-400 mt-1">Normal: 90–120</p>
                  </div>
                  <div>
                    <label className="label">Diastolic BP (mmHg) *</label>
                    <input
                      type="number"
                      name="diastolic_bp"
                      value={formData.diastolic_bp}
                      onChange={handleInputChange}
                      placeholder="80"
                      className="input-field"
                      min="30" max="150" step="1"
                    />
                    <p className="text-xs text-gray-400 mt-1">Normal: 60–80</p>
                  </div>
                </div>

                {/* Temperature */}
                <div>
                  <label className="label">Temperature (°F) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="temperature"
                      value={formData.temperature}
                      onChange={handleInputChange}
                      placeholder="98.6"
                      className="input-field pr-10"
                      min="95" max="106" step="0.1"
                    />
                    {formData.temperature && (
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 ${getStatusColor(getVitalStatus('temperature', formData.temperature))}`}>
                        <Thermometer className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Normal range: 97.5–99.5°F</p>
                </div>

                {/* Weight */}
                <div>
                  <label className="label">Weight (lbs) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      placeholder="175"
                      className="input-field pr-10"
                      min="50" max="500" step="0.1"
                    />
                    {formData.weight && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Weight className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Range: 50–500 lbs</p>
                </div>

                {/* Notes */}
                <div>
                  <label className="label">Notes (Optional)</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="e.g., Felt dizzy this morning, took medication at 8am"
                    rows="3"
                    className="input-field resize-none"
                    maxLength="500"
                  />
                  <p className="text-xs text-gray-400 mt-1">{formData.notes.length}/500</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      Record Vital Signs
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Droplet className="w-4 h-4" style={{ color: '#9f1211' }} />
                Recent Vitals
              </h2>

              {loadingVitals ? (
                <div className="text-center py-8">
                  <div className="h-8 w-8 rounded-full border-4 border-gray-200 border-t-red-700 animate-spin mx-auto mb-2"
                    style={{ borderTopColor: '#9f1211' }} />
                  <p className="text-gray-500 text-sm">Loading…</p>
                </div>
              ) : recentVitals.length === 0 ? (
                <p className="text-gray-400 text-sm">No records yet. Submit your first vitals above.</p>
              ) : (
                <div className="space-y-4">
                  {recentVitals.map((vital, index) => (
                    <div key={vital.record_id || index} className="pb-4 border-b border-gray-100 last:border-b-0">
                      <p className="text-xs text-gray-400 mb-1.5">{formatTime(vital.timestamp)}</p>
                      <div className="space-y-1 text-xs text-gray-600">
                        <p><span className="font-medium">HR:</span> {vital.data.heart_rate} BPM</p>
                        <p><span className="font-medium">BP:</span> {vital.data.systolic_bp}/{vital.data.diastolic_bp} mmHg</p>
                        <p><span className="font-medium">Temp:</span> {vital.data.temperature}°F</p>
                        <p><span className="font-medium">Weight:</span> {vital.data.weight} lbs</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl text-sm" style={{ background: '#fff1f1', border: '1px solid #fca5a5' }}>
              <h3 className="font-semibold mb-2" style={{ color: '#9f1211' }}>💡 Measurement Tips</h3>
              <ul className="text-xs space-y-1" style={{ color: '#7d0f0e' }}>
                <li>• Record at the same time each day</li>
                <li>• Rest 5 min before measuring BP</li>
                <li>• Use a calibrated thermometer</li>
                <li>• Weigh yourself in the morning</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
