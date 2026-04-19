import { useEffect, useState } from 'react';
import { AlertCircle, X, Bell, CheckCircle } from 'lucide-react';
import { patientService } from '../services/api';

export const AlertPanel = ({ patientId }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true);
      try {
        let generatedAlerts = [];
        setAlerts(generatedAlerts);
      } catch (err) {
        console.error('Failed to load alerts:', err);
      } finally {
        setLoading(false);
      }
    };
    if (patientId) loadAlerts();
  }, [patientId]);

  const severityConfig = {
    critical: { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    dot: '#dc2626', label: 'Critical' },
    high:     { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: '#d97706', label: 'High'     },
    medium:   { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', dot: '#ca8a04', label: 'Medium'   },
    low:      { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: '#2563eb', label: 'Low'      },
  };

  const handleDismiss = (alertId) => {
    setDismissedAlerts(prev => new Set(prev).add(alertId));
  };

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.alert_id));

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden">
      <div className="h-0.5" style={{ backgroundColor: '#9f1211' }} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" style={{ color: '#9f1211' }} />
            <h2 className="text-base font-bold text-gray-900">Active Alerts</h2>
          </div>
          {visibleAlerts.length > 0 && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: '#9f1211' }}
            >
              {visibleAlerts.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-8 flex items-center justify-center">
            <div
              className="w-6 h-6 rounded-full border-2 border-gray-100"
              style={{ borderTopColor: '#9f1211', animation: 'spin 0.8s linear infinite' }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : visibleAlerts.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm font-medium text-gray-700">All clear</p>
            <p className="text-xs text-gray-400 mt-1">No active alerts at this time</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {visibleAlerts.map((alert) => {
              const cfg = severityConfig[alert.severity] || severityConfig.low;
              return (
                <div
                  key={alert.alert_id}
                  className={`rounded-lg border p-3.5 flex items-start justify-between ${cfg.bg} ${cfg.border}`}
                >
                  <div className="flex items-start gap-2.5 flex-1">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: cfg.dot }} />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-xs font-bold uppercase tracking-wide ${cfg.text}`}>{cfg.label}</p>
                        <p className={`text-xs font-semibold ${cfg.text} opacity-75 capitalize`}>{alert.alert_type}</p>
                      </div>
                      <p className={`text-sm ${cfg.text}`}>{alert.message}</p>
                      <p className={`text-xs mt-1 ${cfg.text} opacity-60`}>{alert.created_at}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDismiss(alert.alert_id)}
                    className={`ml-2 flex-shrink-0 ${cfg.text} opacity-50 hover:opacity-100 transition-opacity p-0.5`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

