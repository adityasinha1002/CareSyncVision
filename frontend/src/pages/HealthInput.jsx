import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../hooks/useStore';
import { healthService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Check, AlertCircle, Activity, TrendingUp, Droplet,
  Thermometer, Weight, ArrowLeft, Heart, Clock
} from 'lucide-react';

export const HealthInput = () => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    heart_rate: '', systolic_bp: '', diastolic_bp: '',
    temperature: '', weight: '', notes: ''
  });
  const [recentVitals, setRecentVitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [loadingVitals, setLoadingVitals] = useState(true);

  const validationRules = {
    heart_rate:   { min: 30,  max: 200, unit: 'BPM',   label: 'Heart Rate',    message: 'Heart rate must be between 30 and 200 BPM' },
    systolic_bp:  { min: 50,  max: 250, unit: 'mmHg',  label: 'Systolic BP',   message: 'Systolic BP must be between 50 and 250 mmHg' },
    diastolic_bp: { min: 30,  max: 150, unit: 'mmHg',  label: 'Diastolic BP',  message: 'Diastolic BP must be between 30 and 150 mmHg' },
    temperature:  { min: 95,  max: 106, unit: '°F',    label: 'Temperature',   message: 'Temperature must be between 95°F and 106°F' },
    weight:       { min: 50,  max: 500, unit: 'lbs',   label: 'Weight',        message: 'Weight must be between 50 and 500 lbs' },
  };

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
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const validateForm = () => {
    const requiredFields = ['heart_rate', 'systolic_bp', 'diastolic_bp', 'temperature', 'weight'];
    for (let field of requiredFields) {
      if (!formData[field] || formData[field].trim() === '') {
        setError(`${validationRules[field].label} is required`); return false;
      }
    }
    try {
      const hr = parseFloat(formData.heart_rate);
      const sbp = parseFloat(formData.systolic_bp);
      const dbp = parseFloat(formData.diastolic_bp);
      const temp = parseFloat(formData.temperature);
      const wt = parseFloat(formData.weight);
      if (isNaN(hr) || hr < 30 || hr > 200)      { setError(validationRules.heart_rate.message); return false; }
      if (isNaN(sbp) || sbp < 50 || sbp > 250)   { setError(validationRules.systolic_bp.message); return false; }
      if (isNaN(dbp) || dbp < 30 || dbp > 150)   { setError(validationRules.diastolic_bp.message); return false; }
      if (dbp >= sbp)                              { setError('Diastolic BP must be less than Systolic BP'); return false; }
      if (isNaN(temp) || temp < 95 || temp > 106) { setError(validationRules.temperature.message); return false; }
      if (isNaN(wt) || wt < 50 || wt > 500)      { setError(validationRules.weight.message); return false; }
    } catch (err) {
      setError('Please enter valid numbers'); return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setSubmitted(false);
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await healthService.submitVitals(formData);
      if (response.data.success) {
        setSubmitted(true);
        setFormData({ heart_rate: '', systolic_bp: '', diastolic_bp: '', temperature: '', weight: '', notes: '' });
        try {
          const vitalsResponse = await healthService.getRecentVitals(5);
          setRecentVitals(vitalsResponse.data.vitals || []);
        } catch (err) { console.error('Failed to reload vitals:', err); }
        setTimeout(() => setSubmitted(false), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit vital signs');
    } finally {
      setLoading(false);
    }
  };

  const getVitalStatus = (field, value) => {
    if (!value) return null;
    const numValue = parseFloat(value);
    const rule = validationRules[field];
    const normalRanges = {
      heart_rate: { min: 60, max: 100 }, systolic_bp: { min: 90, max: 120 },
      diastolic_bp: { min: 60, max: 80 }, temperature: { min: 97.5, max: 99.5 }, weight: { min: 0, max: 300 },
    };
    const range = normalRanges[field];
    if (numValue >= range.min && numValue <= range.max) return 'normal';
    if (numValue < rule.min || numValue > rule.max) return 'error';
    return 'caution';
  };

  const statusColors = {
    normal:  { border: 'border-green-400',  ring: 'focus:ring-green-100',  icon: 'text-green-500'  },
    caution: { border: 'border-yellow-400', ring: 'focus:ring-yellow-100', icon: 'text-yellow-500' },
    error:   { border: 'border-red-400',    ring: 'focus:ring-red-100',    icon: 'text-red-500'    },
  };

  const getInputClass = (field) => {
    const st = formData[field] ? getVitalStatus(field, formData[field]) : null;
    const base = 'w-full px-4 py-2.5 border rounded-lg text-sm transition-all outline-none focus:ring-2';
    if (!st) return `${base} border-gray-200 focus:border-[#9f1211] focus:ring-[#9f1211]/10`;
    return `${base} ${statusColors[st]?.border} ${statusColors[st]?.ring}`;
  };

  const formatTime = (timestamp) => new Date(timestamp).toLocaleString();

  const vitalFields = [
    { name: 'heart_rate',   label: 'Heart Rate',     unit: 'BPM',   placeholder: '72',   hint: 'Normal: 60–100 BPM',   icon: Activity,     min: 30,  max: 200, step: 1 },
    { name: 'systolic_bp',  label: 'Systolic BP',    unit: 'mmHg',  placeholder: '120',  hint: 'Normal: 90–120',       icon: TrendingUp,   min: 50,  max: 250, step: 1 },
    { name: 'diastolic_bp', label: 'Diastolic BP',   unit: 'mmHg',  placeholder: '80',   hint: 'Normal: 60–80',        icon: TrendingUp,   min: 30,  max: 150, step: 1 },
    { name: 'temperature',  label: 'Temperature',    unit: '°F',    placeholder: '98.6', hint: 'Normal: 97.5–99.5°F',  icon: Thermometer,  min: 95,  max: 106, step: 0.1 },
    { name: 'weight',       label: 'Weight',         unit: 'lbs',   placeholder: '175',  hint: 'Range: 50–500 lbs',    icon: Weight,       min: 50,  max: 500, step: 0.1 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
            <span className="text-gray-200 select-none">|</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded flex items-center justify-center" style={{ backgroundColor: '#9f1211' }}>
                <Activity className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-base font-bold text-gray-900" style={{ letterSpacing: '-0.015em' }}>
                Record Vital Signs
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
              {/* Card header accent */}
              <div className="h-1" style={{ backgroundColor: '#9f1211' }} />
              <div className="p-6">
                {submitted && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-green-800 font-semibold text-sm">Vital signs recorded successfully!</p>
                      <p className="text-green-600 text-xs mt-0.5">Your data has been saved to your health history.</p>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#9f1211' }} />
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#9f1211' }}>Validation Error</p>
                      <p className="text-red-600 text-xs mt-0.5">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {vitalFields.map((field) => {
                      const st = formData[field.name] ? getVitalStatus(field.name, formData[field.name]) : null;
                      return (
                        <div key={field.name}>
                          <label className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-semibold text-gray-700">{field.label} *</span>
                            <span className="text-xs text-gray-400">{field.unit}</span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              name={field.name}
                              value={formData[field.name]}
                              onChange={handleInputChange}
                              placeholder={field.placeholder}
                              className={getInputClass(field.name)}
                              min={field.min} max={field.max} step={field.step}
                            />
                            {formData[field.name] && (
                              <span className={`absolute right-3 top-1/2 -translate-y-1/2 ${statusColors[st]?.icon || 'text-gray-400'}`}>
                                <field.icon className="w-4 h-4" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{field.hint}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                      Notes <span className="font-normal text-gray-400">(Optional)</span>
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="e.g., Felt dizzy this morning, took medication at 8am"
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#9f1211] focus:ring-2 focus:ring-[#9f1211]/10 transition-all resize-none"
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">{formData.notes.length}/500</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving...
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
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Recent vitals */}
            <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
              <div className="h-1" style={{ backgroundColor: '#9f1211' }} />
              <div className="p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Droplet className="w-4 h-4" style={{ color: '#9f1211' }} />
                  Recent Readings
                </h2>
                {loadingVitals ? (
                  <div className="py-6 text-center">
                    <div className="inline-block w-6 h-6 rounded-full border-2 border-gray-100"
                      style={{ borderTopColor: '#9f1211', animation: 'spin 0.8s linear infinite' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                ) : recentVitals.length === 0 ? (
                  <p className="text-gray-400 text-xs text-center py-4">No records yet. Record your first vitals.</p>
                ) : (
                  <div className="space-y-3">
                    {recentVitals.map((vital, index) => (
                      <div key={vital.record_id || index} className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Clock className="w-3 h-3 text-gray-300" />
                          <p className="text-xs text-gray-400">{formatTime(vital.timestamp)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                          <p><span className="text-gray-400">HR:</span> <span className="font-semibold text-gray-700">{vital.data.heart_rate} BPM</span></p>
                          <p><span className="text-gray-400">BP:</span> <span className="font-semibold text-gray-700">{vital.data.systolic_bp}/{vital.data.diastolic_bp}</span></p>
                          <p><span className="text-gray-400">Temp:</span> <span className="font-semibold text-gray-700">{vital.data.temperature}°F</span></p>
                          <p><span className="text-gray-400">Wt:</span> <span className="font-semibold text-gray-700">{vital.data.weight} lbs</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4" style={{ color: '#9f1211' }} />
                Measurement Tips
              </h3>
              <ul className="space-y-2 text-xs text-gray-500">
                {[
                  'Record at the same time each day',
                  'Rest 5 min before measuring blood pressure',
                  'Use a calibrated thermometer',
                  'Weigh yourself in the morning',
                ].map(tip => (
                  <li key={tip} className="flex items-start gap-1.5">
                    <span className="mt-1 w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

