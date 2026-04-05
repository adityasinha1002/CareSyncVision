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
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Risk Score Trend</h2>
        <div className="h-80 flex items-center justify-center text-gray-500">
          <p>No health data available yet. Submit vital signs to see trends.</p>
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-semibold">Risk Score Trend (7 Days)</h2>
          <p className="text-sm text-gray-600">Average: {avgRisk} | Min: {minRisk} | Max: {maxRisk}</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis domain={[0, 100]} />
          <Tooltip 
            formatter={(value) => [`${value}`, 'Risk Score']}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="risk" 
            stroke="#ef4444" 
            strokeWidth={2}
            name="Risk"
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
