import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { patientService } from '../services/api';

export const AlertPanel = ({ patientId }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const response = await patientService.getPatient(patientId);
        // Extract alerts from patient data if available
        // For now, we'll create mock alerts based on risk score
        const patientData = response.data.data;
        const generatedAlerts = [];

        if (patientData.current_risk_score >= 70) {
          generatedAlerts.push({
            alert_id: 'risk-high',
            severity: 'critical',
            alert_type: 'health',
            message: 'High risk score detected. Review vitals and consider contacting healthcare provider.',
            created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        }

        if (patientData.current_risk_score >= 50) {
          generatedAlerts.push({
            alert_id: 'risk-medium',
            severity: 'high',
            alert_type: 'health',
            message: 'Medium-high risk score. Monitor vital signs closely.',
            created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        }

        setAlerts(generatedAlerts);
      } catch (err) {
        console.error('Failed to load alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      loadAlerts();
    }
  }, [patientId]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const handleDismiss = (alertId) => {
    setDismissedAlerts(prev => new Set(prev).add(alertId));
  };

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.alert_id));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Active Alerts</h2>
      {loading ? (
        <p className="text-gray-600 text-sm">Loading alerts...</p>
      ) : visibleAlerts.length === 0 ? (
        <p className="text-gray-600 text-sm">✓ No active alerts</p>
      ) : (
        <div className="space-y-3">
          {visibleAlerts.map((alert) => (
            <div
              key={alert.alert_id}
              className={`border-l-4 p-3 rounded flex items-start justify-between ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="font-semibold capitalize text-sm">{alert.alert_type}</p>
                </div>
                <p className="text-sm mt-1">{alert.message}</p>
                <p className="text-xs opacity-75 mt-1">{alert.created_at}</p>
              </div>
              <button
                onClick={() => handleDismiss(alert.alert_id)}
                className="ml-2 flex-shrink-0 opacity-50 hover:opacity-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
