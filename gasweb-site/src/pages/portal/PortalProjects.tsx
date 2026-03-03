import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  LifeBuoy,
  MessageSquare,
  Send,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCustomProjectRequests, type CreateRequestData } from '../../hooks/useCustomProjectRequests';
import { supabase } from '../../lib/supabase';

type TabType = 'request' | 'status';

interface UserTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  admin_response: string | null;
  admin_responded_at: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  pending: { label: 'Pending', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock },
  reviewing: { label: 'Reviewing', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: AlertCircle },
  approved: { label: 'Approved', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  in_progress: { label: 'In Progress', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: AlertCircle },
  completed: { label: 'Completed', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
};

const TICKET_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  resolved: { label: 'Resolved', color: 'bg-green-50 text-green-700 border-green-200' },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  normal: { label: 'Normal', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  medium: { label: 'Medium', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  high: { label: 'High', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  urgent: { label: 'Urgent', color: 'bg-red-50 text-red-700 border-red-200' },
};

const CATEGORY_LABELS: Record<string, string> = {
  app_setup: 'App Setup',
  billing: 'Billing',
  bug: 'Bug Report',
  feature_request: 'Feature Request',
  general: 'General',
};

export default function PortalProjects() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabType>(tabParam === 'status' ? 'status' : 'request');

  // Project request form
  const { requests, loading: requestsLoading, createRequest } = useCustomProjectRequests(true);
  const [formData, setFormData] = useState<CreateRequestData>({
    name: '',
    description: '',
    project_details: '',
    priority: 'medium',
    estimated_completion: '',
    budget: undefined,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Support tickets
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  // Expandable rows
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  // Search for status tab
  const [search, setSearch] = useState('');

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    setSearchParams(params);
  };

  // Load user's support tickets
  useEffect(() => {
    if (!user) return;
    async function loadTickets() {
      setTicketsLoading(true);
      const { data } = await supabase
        .from('support_tickets')
        .select('id, subject, description, category, status, priority, created_at, admin_response, admin_responded_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      setTickets((data ?? []) as UserTicket[]);
      setTicketsLoading(false);
    }
    loadTickets();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      await createRequest(formData);
      setFormData({
        name: '',
        description: '',
        project_details: '',
        priority: 'medium',
        estimated_completion: '',
        budget: undefined,
      });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      console.error('Error submitting project request:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter(
    (r) =>
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const openTickets = tickets.filter(
    (t) =>
      (!search ||
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        (t.description ?? '').toLowerCase().includes(search.toLowerCase())) &&
      (t.status === 'open' || t.status === 'in_progress')
  );

  const allTickets = tickets.filter(
    (t) =>
      !search ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <FolderKanban className="w-7 h-7 text-primary-600" />
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
        </div>
        <p className="text-slate-600 text-sm">Request custom projects and track your open requests and tickets.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          <button
            onClick={() => handleTabChange('request')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'request'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-1.5" />
            Request a Project
          </button>
          <button
            onClick={() => handleTabChange('status')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'status'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-1.5" />
            My Requests & Tickets
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'request' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Custom Project Request</h2>
          <p className="text-sm text-slate-500 mb-6">
            Fill out the form below to request a custom project. Our team will review your request and respond shortly.
          </p>

          {submitted && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              Your project request has been submitted successfully! You can track its status in the "My Requests & Tickets" tab.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white text-slate-900 placeholder-slate-400"
                  placeholder="e.g., Mobile App Development"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white text-slate-900"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Project Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none bg-white text-slate-900 placeholder-slate-400"
                placeholder="Brief description of what you need..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Project Details</label>
              <textarea
                value={formData.project_details}
                onChange={(e) => setFormData({ ...formData, project_details: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none bg-white text-slate-900 placeholder-slate-400"
                placeholder="Detailed requirements, specifications, features you'd like..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Estimated Timeline</label>
                <select
                  value={formData.estimated_completion}
                  onChange={(e) => setFormData({ ...formData, estimated_completion: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white text-slate-900"
                >
                  <option value="">Select timeline</option>
                  <option value="1-4-weeks">1-4 weeks</option>
                  <option value="1-3-months">1-3 months</option>
                  <option value="3-6-months">3-6 months</option>
                  <option value="6-months-plus">6 months+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Budget ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.budget ?? ''}
                  onChange={(e) =>
                    setFormData({ ...formData, budget: e.target.value ? parseFloat(e.target.value) : undefined })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white text-slate-900 placeholder-slate-400"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || !formData.name.trim()}
                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'status' && (
        <div className="space-y-6">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search requests & tickets..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Project Requests Section */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <FolderKanban className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-slate-900">Project Requests</h2>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {filteredRequests.length}
              </span>
            </div>

            {requestsLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500 mx-auto" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-12 text-center">
                <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No project requests yet.</p>
                <button
                  onClick={() => handleTabChange('request')}
                  className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Submit your first request
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredRequests.map((req) => {
                  const statusCfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending;
                  const StatusIcon = statusCfg.icon;
                  const priorityCfg = PRIORITY_CONFIG[req.priority] ?? PRIORITY_CONFIG.medium;
                  const isExpanded = expandedRequest === req.id;

                  return (
                    <div key={req.id}>
                      <button
                        onClick={() => setExpandedRequest(isExpanded ? null : req.id)}
                        className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition text-left"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{req.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Submitted {new Date(req.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${priorityCfg.color}`}>
                          {priorityCfg.label}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${statusCfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="px-6 pb-5 pl-14 space-y-3">
                          {req.description && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Description</p>
                              <p className="text-sm text-slate-700 whitespace-pre-line">{req.description}</p>
                            </div>
                          )}
                          {req.project_details && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Project Details</p>
                              <p className="text-sm text-slate-700 whitespace-pre-line">{req.project_details}</p>
                            </div>
                          )}
                          <div className="flex gap-6 text-sm">
                            {req.estimated_completion && (
                              <div>
                                <span className="text-slate-500">Timeline:</span>{' '}
                                <span className="text-slate-900">{req.estimated_completion.replace(/-/g, ' ')}</span>
                              </div>
                            )}
                            {req.budget != null && (
                              <div>
                                <span className="text-slate-500">Budget:</span>{' '}
                                <span className="text-slate-900 font-medium">${req.budget.toLocaleString()}</span>
                              </div>
                            )}
                          </div>

                          {/* Admin Response */}
                          {req.admin_response && (
                            <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                                  Admin Response
                                </span>
                                {req.admin_responded_at && (
                                  <span className="text-xs text-blue-500">
                                    {new Date(req.admin_responded_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-blue-900 whitespace-pre-line">{req.admin_response}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Support Tickets Section */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <LifeBuoy className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-slate-900">Support Tickets</h2>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {openTickets.length} open
              </span>
            </div>

            {ticketsLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500 mx-auto" />
              </div>
            ) : allTickets.length === 0 ? (
              <div className="py-12 text-center">
                <LifeBuoy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No support tickets found.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {allTickets.map((ticket) => {
                  const statusCfg = TICKET_STATUS_CONFIG[ticket.status] ?? TICKET_STATUS_CONFIG.open;
                  const priorityCfg = PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.normal;
                  const isExpanded = expandedTicket === ticket.id;

                  return (
                    <div key={ticket.id}>
                      <button
                        onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                        className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition text-left"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{ticket.subject}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {CATEGORY_LABELS[ticket.category] ?? ticket.category} &middot;{' '}
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${priorityCfg.color}`}>
                          {priorityCfg.label}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="px-6 pb-5 pl-14 space-y-3">
                          {ticket.description && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Description</p>
                              <p className="text-sm text-slate-700 whitespace-pre-line">{ticket.description}</p>
                            </div>
                          )}

                          {/* Admin Response */}
                          {ticket.admin_response && (
                            <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                                  Admin Response
                                </span>
                                {ticket.admin_responded_at && (
                                  <span className="text-xs text-blue-500">
                                    {new Date(ticket.admin_responded_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-blue-900 whitespace-pre-line">{ticket.admin_response}</p>
                            </div>
                          )}

                          {!ticket.admin_response && (ticket.status === 'open' || ticket.status === 'in_progress') && (
                            <p className="text-sm text-slate-400 italic">Awaiting response from our team...</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
