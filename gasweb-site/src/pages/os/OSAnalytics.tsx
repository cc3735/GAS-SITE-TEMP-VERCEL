import { useEffect, useState } from 'react';
import { BarChart3, Users, CreditCard, LifeBuoy, GraduationCap, TrendingUp, Loader2 } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { supabase } from '../../lib/supabase';

interface TimePoint {
  label: string;
  count: number;
}

interface AppBreakdown {
  name: string;
  count: number;
}

const APP_LABELS: Record<string, string> = {
  legalflow: 'LegalFlow',
  financeflow: 'FinanceFlow',
  socialflow: 'SocialFlow',
  hrflow: 'HRFlow',
  courseflow: 'CourseFlow',
  foodtruck: 'FoodTruck',
  buildflow: 'BuildFlow',
  keysflow: 'KeysFlow',
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#f97316'];

export default function OSAnalytics() {
  const [loading, setLoading] = useState(true);
  const [clientGrowth, setClientGrowth] = useState<TimePoint[]>([]);
  const [subscriptionGrowth, setSubscriptionGrowth] = useState<TimePoint[]>([]);
  const [appBreakdown, setAppBreakdown] = useState<AppBreakdown[]>([]);
  const [ticketsByStatus, setTicketsByStatus] = useState<{ name: string; count: number }[]>([]);
  const [educationStats, setEducationStats] = useState<{ name: string; value: number }[]>([]);
  const [totals, setTotals] = useState({ clients: 0, subscriptions: 0, tickets: 0, students: 0 });

  useEffect(() => {
    async function load() {
      const [profilesRes, subsRes, ticketsRes, enrollmentsRes, purchasesRes, completedRes] = await Promise.all([
        supabase.from('user_profiles').select('id, created_at'),
        supabase.from('user_app_subscriptions').select('app_id, status, created_at').eq('status', 'active'),
        supabase.from('support_tickets').select('status, created_at'),
        supabase.from('courseflow_enrollments').select('id, created_at', { count: 'exact', head: false }),
        supabase.from('course_purchases').select('id').eq('payment_status', 'completed'),
        supabase.from('courseflow_enrollments').select('id').eq('is_completed', true),
      ]);

      const profiles = profilesRes.data ?? [];
      const subs = subsRes.data ?? [];
      const tickets = ticketsRes.data ?? [];
      const enrollments = enrollmentsRes.data ?? [];

      // Totals
      setTotals({
        clients: profiles.length,
        subscriptions: subs.length,
        tickets: tickets.filter(t => t.status === 'open').length,
        students: enrollments.length,
      });

      // Client growth by month (last 6 months)
      setClientGrowth(aggregateByMonth(profiles, 6));

      // Subscription growth by month
      setSubscriptionGrowth(aggregateByMonth(subs, 6));

      // App breakdown
      const appCounts: Record<string, number> = {};
      subs.forEach((s: { app_id: string }) => {
        appCounts[s.app_id] = (appCounts[s.app_id] ?? 0) + 1;
      });
      setAppBreakdown(
        Object.entries(appCounts)
          .map(([id, count]) => ({ name: APP_LABELS[id] || id, count }))
          .sort((a, b) => b.count - a.count)
      );

      // Tickets by status
      const statusCounts: Record<string, number> = {};
      tickets.forEach((t: { status: string }) => {
        statusCounts[t.status] = (statusCounts[t.status] ?? 0) + 1;
      });
      setTicketsByStatus(
        Object.entries(statusCounts).map(([name, count]) => ({
          name: name.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
          count,
        }))
      );

      // Education stats
      setEducationStats([
        { name: 'Enrolled', value: enrollments.length },
        { name: 'Completed', value: completedRes.data?.length ?? 0 },
        { name: 'Purchased', value: purchasesRes.data?.length ?? 0 },
      ]);

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-8 h-8 text-blue-400" />
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard icon={Users} label="Total Clients" value={totals.clients} color="text-blue-400" bg="bg-blue-900/20" />
        <SummaryCard icon={CreditCard} label="Active Subscriptions" value={totals.subscriptions} color="text-green-400" bg="bg-green-900/20" />
        <SummaryCard icon={LifeBuoy} label="Open Tickets" value={totals.tickets} color="text-orange-400" bg="bg-orange-900/20" />
        <SummaryCard icon={GraduationCap} label="Students Enrolled" value={totals.students} color="text-purple-400" bg="bg-purple-900/20" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Client Growth */}
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Client Growth</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={clientGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f680" name="New Clients" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Subscription Growth */}
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Subscription Growth</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={subscriptionGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
              <Area type="monotone" dataKey="count" stroke="#10b981" fill="#10b98180" name="New Subscriptions" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* App Breakdown */}
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Subscriptions by App</h3>
          {appBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={appBreakdown} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {appBreakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No subscription data yet</p>
          )}
        </div>

        {/* Tickets by Status */}
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Tickets by Status</h3>
          {ticketsByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ticketsByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Tickets" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No ticket data yet</p>
          )}
        </div>

        {/* Education Stats */}
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Education Hub</h3>
          {educationStats.some(s => s.value > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={educationStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No education data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color, bg }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <TrendingUp className="w-5 h-5 text-green-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-400 mb-1">{label}</h3>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function aggregateByMonth(items: { created_at: string }[], months: number): TimePoint[] {
  const now = new Date();
  const buckets: Record<string, number> = {};

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    buckets[key] = 0;
  }

  items.forEach(item => {
    if (!item.created_at) return;
    const d = new Date(item.created_at);
    const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    if (key in buckets) {
      buckets[key]++;
    }
  });

  return Object.entries(buckets).map(([label, count]) => ({ label, count }));
}
