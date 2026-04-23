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
      <div className="dashboard-card flex flex-col justify-between border-primary/25">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Risk Score</span>
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
        <div className="text-3xl font-extrabold text-primary">{riskScore}</div>
        <div className="text-xs text-gray-500 mt-1 font-mono">
          {riskScore >= 70 ? 'Critical' : riskScore >= 50 ? 'High' : riskScore >= 30 ? 'Medium' : 'Low'}
        </div>
      </div>

      {/* Patient Info */}
      <div className="dashboard-card flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Patient Age</span>
          <Clock className="w-6 h-6 text-primary" />
        </div>
        <div className="text-3xl font-extrabold text-primary">{data.age || '--'}</div>
        <div className="text-xs text-gray-500 mt-1">years old</div>
      </div>

      {/* Medication Adherence */}
      <div className="dashboard-card flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Adherence</span>
          <CheckCircle className="w-6 h-6 text-primary" />
        </div>
        <div className="text-3xl font-extrabold text-primary">{Math.round(adherencePercent)}%</div>
        <div className="text-xs text-gray-500 mt-1 font-mono">
          {adherenceMetrics?.doses_taken || 0}/{adherenceMetrics?.total_doses || 0} doses
        </div>
      </div>

      {/* Last Check-in */}
      <div className="dashboard-card flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Last Update</span>
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
        <div className="text-lg font-bold text-primary">{timeAgo}</div>
        <div className="text-xs text-gray-500 mt-1 font-mono">{data.recent_records_count || 0} records</div>
      </div>
    </div>
  );
};
