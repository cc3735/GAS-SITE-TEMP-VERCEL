import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  ExternalLink,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import legalFlowApi, { type TrademarkApplication } from '../../../lib/legalFlowApi';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

const STATUS_LABELS: Record<
  string,
  { label: string; color: string; bg: string; icon: typeof Clock }
> = {
  draft: { label: 'Draft', color: 'text-slate-700', bg: 'bg-slate-100', icon: FileText },
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
  filed: { label: 'Filed', color: 'text-blue-700', bg: 'bg-blue-100', icon: Clock },
  approved: { label: 'Approved', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle2 },
  refused: { label: 'Refused', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
  abandoned: { label: 'Abandoned', color: 'text-slate-500', bg: 'bg-slate-100', icon: AlertCircle },
};

interface IntakeTrademark {
  has_filed_trademark: boolean | null;
  trademark_name: string | null;
  trademark_status: string | null;
}

export default function LegalFlowTrademark() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<TrademarkApplication[]>([]);
  const [intake, setIntake] = useState<IntakeTrademark | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    // Fetch from backend API + client_intake in parallel
    const [apiRes, intakeRes] = await Promise.all([
      legalFlowApi.trademark.listApplications(),
      supabase
        .from('client_intake')
        .select('has_filed_trademark, trademark_name, trademark_status')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    if (apiRes.success && apiRes.data) {
      setApplications(apiRes.data.applications ?? []);
    }
    setIntake(intakeRes.data);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Combine API applications with intake data for stats
  const total = applications.length + (intake?.has_filed_trademark ? 1 : 0);
  const active = applications.filter(
    (a) => a.status === 'pending' || a.status === 'filed',
  ).length + (intake?.has_filed_trademark && (intake?.trademark_status === 'pending' || intake?.trademark_status === 'filed') ? 1 : 0);
  const approved = applications.filter((a) => a.status === 'approved').length +
    (intake?.has_filed_trademark && intake?.trademark_status === 'approved' ? 1 : 0);

  const handleNewApplication = async () => {
    setCreating(true);
    const res = await legalFlowApi.trademark.createApplication({
      markName: 'New Trademark',
    });
    setCreating(false);
    if (res.success && res.data) {
      await fetchData();
    } else {
      alert(
        res.error?.message ??
          'Could not create application. Make sure the LegalFlow backend is running.',
      );
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    setSearchError(null);
    const res = await legalFlowApi.trademark.search(searchTerm.trim());
    setSearching(false);
    if (res.success && res.data) {
      alert(
        `Found ${res.data.resultCount} results for "${searchTerm}". Risk score: ${res.data.riskScore ?? 'N/A'}/100`,
      );
      setShowSearchModal(false);
      setSearchTerm('');
    } else {
      setSearchError(
        res.error?.message ??
          'Search failed. Make sure the LegalFlow backend is running.',
      );
    }
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          to="/portal/legalflow"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          LegalFlow
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-900">Trademark</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trademark & Service Mark</h1>
          <p className="mt-1 text-sm text-slate-500">
            File, track, and manage your trademark applications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSearchModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Search className="w-4 h-4" />
            Search Marks
          </button>
          <button
            onClick={handleNewApplication}
            disabled={creating}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            New Application
          </button>
        </div>
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Search USPTO Database
            </h3>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter mark name to search..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-3"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            {searchError && (
              <p className="text-sm text-red-600 mb-3">{searchError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchTerm('');
                  setSearchError(null);
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSearch}
                disabled={searching || !searchTerm.trim()}
                className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
              >
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Applications', value: total, icon: Award, color: 'text-orange-600' },
          { label: 'Active / Pending', value: active, icon: Clock, color: 'text-amber-600' },
          { label: 'Approved / Registered', value: approved, icon: CheckCircle2, color: 'text-green-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {isLoading ? '\u2014' : value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Applications list */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Applications</h2>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : applications.length > 0 || (intake?.has_filed_trademark && intake?.trademark_name) ? (
            <div className="space-y-3">
              {/* Backend API applications */}
              {applications.map((app) => {
                const badge = STATUS_LABELS[app.status] ?? STATUS_LABELS.draft;
                const BadgeIcon = badge.icon;
                return (
                  <div
                    key={app.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                        <Award className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900 truncate">
                            {app.markName}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.bg} ${badge.color}`}
                          >
                            <BadgeIcon className="w-3 h-3" />
                            {badge.label}
                          </span>
                          <span className="text-xs text-slate-500 capitalize">
                            {app.jurisdiction}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                          {app.goodsServices && (
                            <span className="truncate max-w-[220px]">
                              {app.goodsServices}
                            </span>
                          )}
                          <span>
                            Created{' '}
                            {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {app.interviewProgress !== undefined &&
                          app.status === 'draft' && (
                            <div className="mt-1.5 flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                                <div
                                  className="h-1.5 rounded-full bg-orange-500 transition-all"
                                  style={{
                                    width: `${app.interviewProgress}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-slate-500">
                                {app.interviewProgress}%
                              </span>
                            </div>
                          )}
                      </div>
                      <span className="flex-shrink-0 text-sm font-medium text-orange-600">
                        {app.status === 'draft' ? 'Continue' : 'View'}
                        <ArrowRight className="inline w-4 h-4 ml-1" />
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Intake-based trademark (if not in API results) */}
              {intake?.has_filed_trademark && intake.trademark_name && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900 truncate">
                          {intake.trademark_name}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${(STATUS_LABELS[intake.trademark_status ?? ''] ?? STATUS_LABELS.draft).bg} ${(STATUS_LABELS[intake.trademark_status ?? ''] ?? STATUS_LABELS.draft).color}`}
                        >
                          {(STATUS_LABELS[intake.trademark_status ?? ''] ?? STATUS_LABELS.draft).label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        From intake questionnaire
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center bg-white">
              <Award className="mx-auto w-10 h-10 text-slate-300" />
              <p className="mt-3 font-medium text-slate-700">
                No trademark applications yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Start by searching for existing marks or filing a new application.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Search className="w-4 h-4" />
                  Search First
                </button>
                <button
                  onClick={handleNewApplication}
                  disabled={creating}
                  className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Start Application
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick actions sidebar */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Quick Actions</h2>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
            <button
              onClick={() => setShowSearchModal(true)}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <Search className="w-4 h-4" />
              Search USPTO Database
            </button>
            <button
              onClick={handleNewApplication}
              disabled={creating}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              File Federal Application
            </button>
            <a
              href="https://www.uspto.gov/trademarks"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <FileText className="w-4 h-4" />
              USPTO Resources
              <ExternalLink className="w-3 h-3 ml-auto text-slate-400" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
