import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, Legend } from 'recharts';
import { useDeals } from '../hooks/useDeals';
import { useContacts } from '../hooks/useContacts';
import { useAgents } from '../hooks/useAgents';
import { Loader2 } from 'lucide-react';

export default function MissionControlAnalytics() {
  const { deals, loading: dealsLoading } = useDeals();
  const { contacts, loading: contactsLoading } = useContacts();
  const { agents, loading: agentsLoading } = useAgents();

  const loading = dealsLoading || contactsLoading || agentsLoading;

  // 1. Revenue Trend (Last 30 Days)
  const revenueData = useMemo(() => {
    const last30Days = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split('T')[0]; // YYYY-MM-DD
    });

    return last30Days.map(date => {
      const dayDeals = deals.filter(d => 
        d.status === 'won' && 
        d.created_at.startsWith(date) // Ideally use 'closed_at' but 'created_at' works for MVP
      );
      const dailyRevenue = dayDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      
      return {
        date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        revenue: dailyRevenue
      };
    });
  }, [deals]);

  // 2. Lead Velocity (Last 30 Days)
  const leadData = useMemo(() => {
    const last30Days = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    });

    return last30Days.map(date => {
      const dayContacts = contacts.filter(c => c.created_at.startsWith(date));
      return {
        date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        leads: dayContacts.length
      };
    });
  }, [contacts]);

  // 3. Agent Activity (Current Status Snapshot)
  const agentStatusData = useMemo(() => {
      const active = agents.filter(a => a.status === 'active').length;
      const paused = agents.filter(a => a.status === 'paused').length;
      const error = agents.filter(a => a.status === 'error').length;
      const idle = agents.length - active - paused - error;

      return [
        { name: 'Active', count: active, fill: '#10b981' }, // green-500
        { name: 'Idle', count: idle, fill: '#6b7280' },   // gray-500
        { name: 'Paused', count: paused, fill: '#f59e0b' }, // amber-500
        { name: 'Error', count: error, fill: '#ef4444' },  // red-500
      ];
  }, [agents]);


  if (loading) {
    return <div className="h-64 flex items-center justify-center text-gray-500"><Loader2 className="animate-spin mr-2" /> Loading Analytics...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Top Row: Revenue & Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Chart */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">Revenue Trend (30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                  itemStyle={{ color: '#60a5fa' }}
                  formatter={(value) => [`$${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Velocity Chart */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">New Leads (30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#374151', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                />
                <Bar dataKey="leads" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Agent Health */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">Real-Time Agent Health</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentStatusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
                <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip 
                  cursor={{ fill: '#374151', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {
                    agentStatusData.map((entry, index) => (
                      <cell key={`cell-${index}`} fill={entry.fill} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
}
