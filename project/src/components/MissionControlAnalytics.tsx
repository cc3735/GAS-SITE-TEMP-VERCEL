import React, { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  Cell
} from 'recharts';

export default function MissionControlAnalytics() {
  // Generate mock revenue data for the last 30 days
  const revenueData = useMemo(() => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      data.push({
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        revenue: Math.floor(Math.random() * 500) + 100,
      });
    }
    return data;
  }, []);

  // Generate mock lead data for the last 30 days
  const leadData = useMemo(() => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      data.push({
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        leads: Math.floor(Math.random() * 10) + 1,
      });
    }
    return data;
  }, []);

  // Agent status data
  const agentStatusData = useMemo(() => [
    { name: 'Active', count: 2, fill: '#10b981' },
    { name: 'Idle', count: 1, fill: '#6b7280' },
    { name: 'Paused', count: 0, fill: '#f59e0b' },
    { name: 'Error', count: 0, fill: '#ef4444' },
  ], []);

  return (
    <div className="space-y-6">
      {/* Top Row: Revenue & Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-surface p-6 rounded-lg border border-border">
          <h3 className="text-lg font-medium text-primary mb-4">Revenue Trend (30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--color-subtle)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="var(--color-subtle)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `$${value}`} 
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'var(--color-surface)', 
                    borderColor: 'var(--color-border)', 
                    color: 'var(--color-primary)' 
                  }}
                  itemStyle={{ color: '#60a5fa' }}
                  formatter={(value) => [`$${value}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Velocity Chart */}
        <div className="bg-surface p-6 rounded-lg border border-border">
          <h3 className="text-lg font-medium text-primary mb-4">New Leads (30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--color-subtle)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="var(--color-subtle)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  allowDecimals={false} 
                />
                <Tooltip
                  cursor={{ fill: 'var(--color-surface-hover)', opacity: 0.4 }}
                  contentStyle={{ 
                    backgroundColor: 'var(--color-surface)', 
                    borderColor: 'var(--color-border)', 
                    color: 'var(--color-primary)' 
                  }}
                />
                <Bar dataKey="leads" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Agent Health */}
      <div className="bg-surface p-6 rounded-lg border border-border">
        <h3 className="text-lg font-medium text-primary mb-4">Real-Time Agent Health</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={agentStatusData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis 
                type="number" 
                stroke="var(--color-subtle)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                allowDecimals={false} 
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="var(--color-subtle)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                width={80} 
              />
              <Tooltip
                cursor={{ fill: 'var(--color-surface-hover)', opacity: 0.4 }}
                contentStyle={{ 
                  backgroundColor: 'var(--color-surface)', 
                  borderColor: 'var(--color-border)', 
                  color: 'var(--color-primary)' 
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {agentStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
