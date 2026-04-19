import { TrendingUp, Clock, CheckCircle, Activity, AlertTriangle } from 'lucide-react';

export const HealthSummary = ({ data, adherenceMetrics }) => {
  if (!data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 shadow-soft animate-pulse">
            <div className="h-3 bg-gray-100 rounded w-20 mb-3" />
            <div className="h-8 bg-gray-100 rounded w-16 mb-2" />
            <div className="h-2 bg-gray-100 rounded w-12" />
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
    if (score >= 70) return { label: 'Critical', color: '#dc2626', bg: '#fef2f2' };
    if (score >= 50) return { label: 'High', color: '#d97706', bg: '#fffbeb' };
    if (score >= 30) return { label: 'Medium', color: '#ca8a04', bg: '#fefce8' };
    return { label: 'Low', color: '#16a34a', bg: '#f0fdf4' };
  };

  const risk = getRiskLabel(riskScore);

  const stats = [
    {
      label: 'Risk Score',
      value: riskScore,
      suffix: '',
      sub: risk.label,
      icon: AlertTriangle,
      accent: risk.color,
      bg: risk.bg,
    },
    {
      label: 'Patient Age',
      value: data.age || '--',
      suffix: '',
      sub: 'years old',
      icon: Activity,
      accent: '#9f1211',
      bg: '#fdf2f2',
    },
    {
      label: 'Adherence Rate',
      value: `${Math.round(adherencePercent)}%`,
      suffix: '',
      sub: `${adherenceMetrics?.doses_taken || 0}/${adherenceMetrics?.total_doses || 0} doses`,
      icon: CheckCircle,
      accent: '#16a34a',
      bg: '#f0fdf4',
    },
    {
      label: 'Last Update',
      value: lastUpdated ? getTimeAgo(lastUpdated) : 'Never',
      suffix: '',
      sub: `${data.recent_records_count || 0} records`,
      icon: Clock,
      accent: '#6b7280',
      bg: '#f9fafb',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden"
        >
          <div className="h-0.5" style={{ backgroundColor: stat.accent }} />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.bg }}>
                <stat.icon className="w-3.5 h-3.5" style={{ color: stat.accent }} />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mb-0.5" style={{ letterSpacing: '-0.025em' }}>
              {stat.value}
            </p>
            <p className="text-xs text-gray-400">{stat.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

