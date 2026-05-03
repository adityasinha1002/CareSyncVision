import { AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

const BRAND = '#9f1211';

export const HealthSummary = ({ data, adherenceMetrics }) => {
  if (!data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
            <div className="h-8 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  const riskScore = Math.round(data.current_risk_score || 0);
  const adherencePercent = adherenceMetrics?.adherence_percentage || 0;
  const lastUpdated = data.last_updated ? new Date(data.last_updated) : null;

  function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  const getRiskLabel = (score) => {
    if (score >= 70) return { label: 'Critical', color: '#dc2626' };
    if (score >= 50) return { label: 'High', color: '#ea580c' };
    if (score >= 30) return { label: 'Medium', color: '#d97706' };
    return { label: 'Low', color: '#16a34a' };
  };

  const risk = getRiskLabel(riskScore);

  const stats = [
    {
      label: 'Risk Score',
      value: riskScore,
      sub: risk.label,
      icon: TrendingUp,
      valueColor: risk.color,
    },
    {
      label: 'Patient Age',
      value: data.age || '--',
      sub: 'years old',
      icon: Clock,
      valueColor: BRAND,
    },
    {
      label: 'Adherence Rate',
      value: `${Math.round(adherencePercent)}%`,
      sub: `${adherenceMetrics?.doses_taken || 0}/${adherenceMetrics?.total_doses || 0} doses`,
      icon: CheckCircle,
      valueColor: adherencePercent >= 80 ? '#16a34a' : adherencePercent >= 50 ? '#d97706' : '#dc2626',
    },
    {
      label: 'Last Update',
      value: lastUpdated ? getTimeAgo(lastUpdated) : 'N/A',
      sub: `${data.recent_records_count || 0} records`,
      icon: TrendingUp,
      valueColor: BRAND,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">{stat.label}</span>
              <Icon className="w-4 h-4" style={{ color: BRAND, opacity: 0.6 }} />
            </div>
            <div
              className="text-2xl font-bold mb-0.5"
              style={{ color: stat.valueColor }}
            >
              {stat.value}
            </div>
            <div className="text-xs text-gray-400">{stat.sub}</div>
          </div>
        );
      })}
    </div>
  );
};
