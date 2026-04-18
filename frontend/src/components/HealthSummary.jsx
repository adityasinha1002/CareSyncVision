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
      <div className="dashboard-card flex flex-col justify-between border-primary">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Risk Score</span>
          <TrendingUp className="w-7 h-7 text-primary" />
        </div>
        <div className="text-3xl font-bold text-primary">{riskScore}</div>
        <div className="text-xs text-gray-500 mt-1">
          {riskScore >= 70 ? 'Critical' : riskScore >= 50 ? 'High' : riskScore >= 30 ? 'Medium' : 'Low'}
        </div>
      </div>

      {/* Patient Info */}
      <div className="dashboard-card flex flex-col justify-between border-primary">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Patient Age</span>
          <Clock className="w-7 h-7 text-primary" />
        </div>
        <div className="text-3xl font-bold text-primary">{data.age || '--'}</div>
        <div className="text-xs text-gray-500 mt-1">years old</div>
      </div>

      {/* Medication Adherence */}
      <div className="dashboard-card flex flex-col justify-between border-primary">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Adherence Rate</span>
          <CheckCircle className="w-7 h-7 text-primary" />
        </div>
        <div className="text-3xl font-bold text-primary">{Math.round(adherencePercent)}%</div>
        <div className="text-xs text-gray-500 mt-1">
          {adherenceMetrics?.doses_taken || 0}/{adherenceMetrics?.total_doses || 0} doses
        </div>
      </div>

      {/* Last Check-in */}
      <div className="dashboard-card flex flex-col justify-between border-primary">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Last Update</span>
          <TrendingUp className="w-7 h-7 text-primary" />
        </div>
        <div className="text-lg font-semibold text-primary">{timeAgo}</div>
        <div className="text-xs text-gray-500 mt-1">{data.recent_records_count || 0} records</div>
      </div>
    </div>
  );
};
