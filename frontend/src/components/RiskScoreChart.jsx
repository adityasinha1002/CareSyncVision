import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const color = val >= 70 ? '#dc2626' : val >= 50 ? '#d97706' : val >= 30 ? '#ca8a04' : '#16a34a';
    return (
      <div className="bg-white border border-gray-100 rounded-lg shadow-lg px-3 py-2.5">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-sm font-bold" style={{ color }}>Risk: {val}</p>
      </div>
    );
  }
  return null;
};

export const RiskScoreChart = ({ data = [] }) => {
  const chartData = data
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map((record) => ({
      timestamp: new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      risk: Math.round(record.risk_score || 0),
    }))
    .slice(-24);

  const avgRisk = chartData.length > 0
    ? Math.round(chartData.reduce((sum, d) => sum + d.risk, 0) / chartData.length)
    : 0;
  const maxRisk = chartData.length > 0 ? Math.max(...chartData.map(d => d.risk)) : 0;

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden">
        <div className="h-0.5" style={{ backgroundColor: '#9f1211' }} />
        <div className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4" style={{ color: '#9f1211' }} />
            <h2 className="text-base font-bold text-gray-900">Risk Score Trend</h2>
          </div>
          <div className="h-56 flex flex-col items-center justify-center text-gray-400">
            <TrendingUp className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No data yet. Submit vitals to see trends.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden">
      <div className="h-0.5" style={{ backgroundColor: '#9f1211' }} />
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4" style={{ color: '#9f1211' }} />
              <h2 className="text-base font-bold text-gray-900">Risk Score Trend</h2>
            </div>
            <p className="text-xs text-gray-400">Last 7 days · {chartData.length} readings</p>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <p className="text-xs text-gray-400">Avg</p>
              <p className="text-lg font-extrabold text-gray-900">{avgRisk}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Peak</p>
              <p className="text-lg font-extrabold" style={{ color: '#9f1211' }}>{maxRisk}</p>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="timestamp"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={70} stroke="#fca5a5" strokeDasharray="4 4" strokeWidth={1} />
            <ReferenceLine y={50} stroke="#fcd34d" strokeDasharray="4 4" strokeWidth={1} />
            <Line
              type="monotone"
              dataKey="risk"
              stroke="#9f1211"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#9f1211', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#9f1211', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3">
          {[
            { color: '#fca5a5', label: 'Critical (70+)' },
            { color: '#fcd34d', label: 'High (50+)' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-0.5" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

