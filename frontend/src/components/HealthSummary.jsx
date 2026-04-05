import { AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

export const HealthSummary = ({ data, adherenceMetrics }) => {
  if (!data) return <div className="p-4">Loading...</div>;

  const riskScore = Math.round(data.current_risk_score || 0);
  const getRiskColor = (score) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 50) return 'text-orange-600';
    if (score >= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskBgColor = (score) => {
    if (score >= 70) return 'bg-red-50';
    if (score >= 50) return 'bg-orange-50';
    if (score >= 30) return 'bg-yellow-50';
    return 'bg-green-50';
  };

  const adherencePercent = adherenceMetrics?.adherence_percentage || 0;
  const lastUpdated = data.last_updated ? new Date(data.last_updated) : null;
  const timeAgo = lastUpdated ? getTimeAgo(lastUpdated) : 'Unknown';

  function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
      {/* Risk Score Card */}
      <div className={`${getRiskBgColor(riskScore)} rounded-lg shadow p-4`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Risk Score</p>
            <p className={`text-3xl font-bold ${getRiskColor(riskScore)}`}>{riskScore}</p>
            <p className="text-xs text-gray-500 mt-1">
              {riskScore >= 70 ? 'Critical' : riskScore >= 50 ? 'High' : riskScore >= 30 ? 'Medium' : 'Low'}
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-gray-400" />
        </div>
      </div>

      {/* Patient Info */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Patient Age</p>
            <p className="text-3xl font-bold text-blue-600">{data.age || '--'}</p>
            <p className="text-xs text-gray-500 mt-1">years old</p>
          </div>
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
      </div>

      {/* Medication Adherence */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Adherence Rate</p>
            <p className="text-3xl font-bold text-green-600">{Math.round(adherencePercent)}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {adherenceMetrics?.doses_taken || 0}/{adherenceMetrics?.total_doses || 0} doses
            </p>
          </div>
          <CheckCircle className="w-8 h-8 text-gray-400" />
        </div>
      </div>

      {/* Last Check-in */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Last Update</p>
            <p className="text-lg font-semibold">{timeAgo}</p>
            <p className="text-xs text-gray-500 mt-1">{data.recent_records_count || 0} records</p>
          </div>
          <TrendingUp className="w-8 h-8 text-gray-400" />
        </div>
      </div>
    </div>
  );
};
