import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, LifeBuoy, Send, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TicketRow {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  email: string;
  full_name: string | null;
  admin_response: string | null;
  admin_responded_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-900/50 text-blue-300 border-blue-700/30',
  in_progress: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/30',
  resolved: 'bg-green-900/50 text-green-300 border-green-700/30',
  closed: 'bg-gray-800 text-gray-400 border-gray-700',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-800 text-gray-400 border-gray-700',
  normal: 'bg-blue-900/50 text-blue-300 border-blue-700/30',
  high: 'bg-orange-900/50 text-orange-300 border-orange-700/30',
  urgent: 'bg-red-900/50 text-red-300 border-red-700/30',
};

const CATEGORY_LABELS: Record<string, string> = {
  app_setup: 'App Setup',
  billing: 'Billing',
  bug: 'Bug Report',
  feature_request: 'Feature Request',
  general: 'General',
};

export default function OSSupportTickets() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<Record<string, string>>({});
  const [savingResponseId, setSavingResponseId] = useState<string | null>(null);
  const filterStatus = searchParams.get('status') ?? '';
  const filterPriority = searchParams.get('priority') ?? '';

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setIsLoading(true);

    const { data: tix } = await supabase
      .from('support_tickets')
      .select('id, user_id, subject, description, category, status, priority, created_at, admin_response, admin_responded_at')
      .order('created_at', { ascending: false });

    const userIds = [...new Set((tix ?? []).map((t: { user_id: string }) => t.user_id))];

    let profiles: { id: string; email: string; full_name: string | null }[] = [];
    if (userIds.length > 0) {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, email, full_name')
        .in('id', userIds);
      profiles = (data ?? []) as typeof profiles;
    }

    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    const rows: TicketRow[] = (tix ?? []).map(
      (t: { id: string; user_id: string; subject: string; description: string; category: string; status: string; priority: string; created_at: string; admin_response: string | null; admin_responded_at: string | null }) => ({
        ...t,
        email: profileMap.get(t.user_id)?.email ?? 'Unknown',
        full_name: profileMap.get(t.user_id)?.full_name ?? null,
      })
    );

    setTickets(rows);
    setIsLoading(false);
  }

  const filtered = tickets.filter((t) => {
    const matchesSearch =
      !search ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      (t.full_name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filterStatus || t.status === filterStatus;
    const matchesPriority = !filterPriority || t.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    setUpdatingId(ticketId);
    await supabase
      .from('support_tickets')
      .update({ status: newStatus })
      .eq('id', ticketId);

    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );
    setUpdatingId(null);
  };

  const saveAdminResponse = async (ticketId: string) => {
    const text = responseText[ticketId];
    if (!text?.trim()) return;
    setSavingResponseId(ticketId);
    await supabase
      .from('support_tickets')
      .update({
        admin_response: text.trim(),
        admin_responded_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, admin_response: text.trim(), admin_responded_at: new Date().toISOString() }
          : t
      )
    );
    setSavingResponseId(null);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
        <p className="text-gray-400 mt-1 text-sm">
          {isLoading ? '…' : `${filtered.length} ticket${filtered.length !== 1 ? 's' : ''}`}
          {filterStatus ? ` (${STATUS_LABELS[filterStatus] ?? filterStatus})` : ''}
          {filterPriority ? ` · ${filterPriority} priority` : ''}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject, name, or email…"
            className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => updateParams('status', e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={filterPriority}
          onChange={(e) => updateParams('priority', e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 rounded bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <LifeBuoy className="mx-auto w-10 h-10 text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">No support tickets found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium">Subject</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium hidden md:table-cell">Client</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium hidden lg:table-cell">Category</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium">Priority</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium">Status</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium hidden lg:table-cell">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((ticket) => (
                <>
                  <tr
                    key={ticket.id}
                    onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
                    className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-white font-medium truncate max-w-[220px]">{ticket.subject}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <p className="text-white truncate max-w-[160px]">
                        {ticket.full_name || ticket.email}
                      </p>
                      {ticket.full_name && (
                        <p className="text-xs text-gray-500 truncate max-w-[160px]">{ticket.email}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-primary-900/50 text-primary-300 border border-primary-700/30">
                        {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs border capitalize ${PRIORITY_COLORS[ticket.priority] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[ticket.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                        {STATUS_LABELS[ticket.status] ?? ticket.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-gray-500 text-xs">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                  {expandedId === ticket.id && (
                    <tr key={`${ticket.id}-detail`} className="bg-gray-800/30">
                      <td colSpan={6} className="px-5 py-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Description</p>
                            <p className="text-sm text-gray-300 whitespace-pre-line">
                              {ticket.description || 'No description provided.'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Update Status:</p>
                            {['open', 'in_progress', 'resolved', 'closed'].map((s) => (
                              <button
                                key={s}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateTicketStatus(ticket.id, s);
                                }}
                                disabled={ticket.status === s || updatingId === ticket.id}
                                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                                  ticket.status === s
                                    ? STATUS_COLORS[s] + ' font-semibold'
                                    : 'border-gray-700 text-gray-500 hover:text-white hover:border-gray-500'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {STATUS_LABELS[s]}
                              </button>
                            ))}
                          </div>
                          {/* Admin Response */}
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                              <MessageSquare className="w-3 h-3 inline mr-1" />
                              Admin Response
                            </p>
                            <textarea
                              value={responseText[ticket.id] ?? ticket.admin_response ?? ''}
                              onChange={(e) =>
                                setResponseText((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                              }
                              onClick={(e) => e.stopPropagation()}
                              rows={3}
                              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                              placeholder="Write a response to the client..."
                            />
                            <div className="flex items-center gap-3 mt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveAdminResponse(ticket.id);
                                }}
                                disabled={savingResponseId === ticket.id}
                                className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs transition disabled:opacity-50"
                              >
                                <Send className="w-3 h-3" />
                                Save Response
                              </button>
                              {ticket.admin_responded_at && (
                                <span className="text-xs text-gray-500">
                                  Last responded: {new Date(ticket.admin_responded_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="md:hidden">
                            <p className="text-xs text-gray-500">
                              Client: {ticket.full_name || ticket.email}
                              {ticket.full_name && ` (${ticket.email})`}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
