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
    <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-primary hover:text-primary-400 mb-4 font-medium text-sm uppercase tracking-wide transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            Record Vital Signs
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Enter your health measurements for today. This data helps monitor your health status.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-[#111] rounded-lg border border-[#2a2a2a] p-6">
              {/* Success Message */}
              {submitted && (
                <div className="mb-6 p-4 bg-green-950/40 border border-green-700/50 rounded-lg flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-400 font-medium">Vital signs recorded successfully!</p>
                    <p className="text-green-600 text-sm">Your data has been saved to your health history.</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-950/40 border border-red-700/50 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-medium">Error</p>
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Heart Rate */}
                <div>
                  <label className="label">
                    Heart Rate (BPM) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="heart_rate"
                      value={formData.heart_rate}
                      onChange={handleInputChange}
                      placeholder="72"
                      className={`input-field ${
                        formData.heart_rate && getVitalStatus('heart_rate', formData.heart_rate) === 'error'
                          ? '!border-red-500'
                          : ''
                      }`}
                      min="30"
                      max="200"
                      step="1"
                    />
                    {formData.heart_rate && (
                      <span className={`absolute right-3 top-3 ${getStatusColor(getVitalStatus('heart_rate', formData.heart_rate))}`}>
                        <TrendingUp className="w-5 h-5" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Normal range: 60-100 BPM</p>
                </div>

                {/* Blood Pressure */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      Systolic BP (mmHg) *
                    </label>
                    <input
                      type="number"
                      name="systolic_bp"
                      value={formData.systolic_bp}
                      onChange={handleInputChange}
                      placeholder="120"
                      className={`input-field ${
                        formData.systolic_bp && getVitalStatus('systolic_bp', formData.systolic_bp) === 'error'
                          ? '!border-red-500'
                          : ''
                      }`}
                      min="50"
                      max="250"
                      step="1"
                    />
                    <p className="text-xs text-gray-600 mt-1">Normal: 90-120</p>
                  </div>
                  <div>
                    <label className="label">
                      Diastolic BP (mmHg) *
                    </label>
                    <input
                      type="number"
                      name="diastolic_bp"
                      value={formData.diastolic_bp}
                      onChange={handleInputChange}
                      placeholder="80"
                      className={`input-field ${
                        formData.diastolic_bp && getVitalStatus('diastolic_bp', formData.diastolic_bp) === 'error'
                          ? '!border-red-500'
                          : ''
                      }`}
                      min="30"
                      max="150"
                      step="1"
                    />
                    <p className="text-xs text-gray-600 mt-1">Normal: 60-80</p>
                  </div>
                </div>

                {/* Temperature */}
                <div>
                  <label className="label">
                    Temperature (°F) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="temperature"
                      value={formData.temperature}
                      onChange={handleInputChange}
                      placeholder="98.6"
                      className={`input-field ${
                        formData.temperature && getVitalStatus('temperature', formData.temperature) === 'error'
                          ? '!border-red-500'
                          : ''
                      }`}
                      min="95"
                      max="106"
                      step="0.1"
                    />
                    {formData.temperature && (
                      <span className={`absolute right-3 top-3 ${getStatusColor(getVitalStatus('temperature', formData.temperature))}`}>
                        <Thermometer className="w-5 h-5" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Normal range: 97.5-99.5°F</p>
                </div>

                {/* Weight */}
                <div>
                  <label className="label">
                    Weight (lbs) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      placeholder="175"
                      className="input-field"
                      min="50"
                      max="500"
                      step="0.1"
                    />
                    {formData.weight && (
                      <span className="absolute right-3 top-3 text-gray-500">
                        <Weight className="w-5 h-5" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Range: 50-500 lbs</p>
                </div>

                {/* Notes */}
                <div>
                  <label className="label">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="e.g., Felt dizzy this morning, took medication at 8am"
                    rows="3"
                    className="input-field resize-none"
                    maxLength="500"
                  />
                  <p className="text-xs text-gray-600 mt-1">{formData.notes.length}/500 characters</p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 font-bold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Record Vital Signs
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Recent Vitals Sidebar */}
          <div>
            <div className="bg-[#111] rounded-lg border border-[#2a2a2a] p-6">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Droplet className="w-5 h-5 text-primary" />
                Recent Vitals
              </h2>

              {loadingVitals ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-gray-600 text-sm">Loading...</p>
                </div>
              ) : recentVitals.length === 0 ? (
                <p className="text-gray-600 text-sm">No vital records yet. Start by recording your first vitals above.</p>
              ) : (
                <div className="space-y-4">
                  {recentVitals.map((vital, index) => (
                    <div key={vital.record_id || index} className="pb-4 border-b border-[#2a2a2a] last:border-b-0">
                      <p className="text-xs text-gray-600 mb-2 font-mono">{formatTime(vital.timestamp)}</p>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-gray-500">HR:</span>
                          <span className="font-medium text-gray-200 ml-2">{vital.data.heart_rate} BPM</span>
                        </p>
                        <p>
                          <span className="text-gray-500">BP:</span>
                          <span className="font-medium text-gray-200 ml-2">
                            {vital.data.systolic_bp}/{vital.data.diastolic_bp} mmHg
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-500">Temp:</span>
                          <span className="font-medium text-gray-200 ml-2">{vital.data.temperature}°F</span>
                        </p>
                        <p>
                          <span className="text-gray-500">Weight:</span>
                          <span className="font-medium text-gray-200 ml-2">{vital.data.weight} lbs</span>
                        </p>
                        {vital.data.notes && (
                          <p className="text-gray-600 italic text-xs mt-2">
                            "{vital.data.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tips Card */}
            <div className="mt-4 bg-primary/5 rounded-lg border border-primary/20 p-4">
              <h3 className="font-semibold text-primary mb-2 text-sm uppercase tracking-wide">💡 Measurement Tips</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Record at the same time each day for consistency</li>
                <li>• Rest 5 minutes before measuring blood pressure</li>
                <li>• Use a calibrated thermometer</li>
                <li>• Weigh yourself in the morning if possible</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
