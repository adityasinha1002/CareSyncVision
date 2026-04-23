import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const RiskScoreChart = ({ data = [] }) => {
  // Transform health records into chart data
  const chartData = data
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map((record) => ({
      timestamp: new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      risk: Math.round(record.risk_score || 0),
      fullTime: new Date(record.timestamp),
    }))
    .slice(-24); // Show last 24 records

  if (chartData.length === 0) {
    return (
      <div className="bg-[#111] rounded-lg border border-[#2a2a2a] p-6">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Risk Score Trend</h2>
        <div className="h-80 flex items-center justify-center text-gray-600">
          <p className="text-sm">No health data available yet. Submit vital signs to see trends.</p>
        </div>
      </div>
    );
  }

  const avgRisk = chartData.length > 0
    ? Math.round(chartData.reduce((sum, d) => sum + d.risk, 0) / chartData.length)
    : 0;
  const maxRisk = Math.max(...chartData.map(d => d.risk));
  const minRisk = Math.min(...chartData.map(d => d.risk));

  return (
    <div className="dashboard-card">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Risk Score Trend (7 Days)</h2>
          <p className="text-xs text-gray-600 mt-1 font-mono">Avg: {avgRisk} · Min: {minRisk} · Max: {maxRisk}</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
          <XAxis dataKey="timestamp" stroke="#444" tick={{ fill: '#666', fontSize: 11 }} />
          <YAxis stroke="#444" tick={{ fill: '#666', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#111', border: '1px solid #2a2a2a', color: '#76b900', borderRadius: '6px' }}
            labelStyle={{ color: '#888' }}
          />
          <Line
            type="monotone"
            dataKey="risk"
            stroke="#76b900"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#76b900', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#96d900', boxShadow: '0 0 8px rgba(118,185,0,0.5)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
