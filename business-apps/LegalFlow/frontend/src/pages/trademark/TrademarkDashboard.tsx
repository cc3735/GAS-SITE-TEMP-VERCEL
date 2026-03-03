import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  FileText,
  Calendar,
  Loader2,
} from 'lucide-react';
import { trademarkApi, type TrademarkApplication } from '@/lib/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700', icon: FileText },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  filed: { label: 'Filed', color: 'bg-blue-100 text-blue-700', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  refused: { label: 'Refused', color: 'bg-red-100 text-red-700', icon: XCircle },
  abandoned: { label: 'Abandoned', color: 'bg-slate-100 text-slate-500', icon: AlertCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function DeadlineCard({ app }: { app: TrademarkApplication }) {
  if (!app.nextActionDate || !app.nextActionType) return null;
  const date = new Date(app.nextActionDate);
  const daysOut = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const urgent = daysOut <= 30;
  return (
    <div className={`rounded-lg border p-4 ${urgent ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${urgent ? 'text-red-600' : 'text-yellow-700'}`}>
            {urgent ? '⚠ Urgent' : 'Upcoming'}
          </p>
          <p className="mt-0.5 font-medium text-slate-900 text-sm">{app.markName}</p>
          <p className="text-xs text-slate-600">{app.nextActionType}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`text-sm font-bold ${urgent ? 'text-red-600' : 'text-yellow-700'}`}>
            {daysOut <= 0 ? 'Overdue' : `${daysOut}d`}
          </p>
          <p className="text-xs text-slate-500">{date.toLocaleDateString()}</p>
        </div>
      </div>
      <Link
        to={`/trademark/apply/${app.id}`}
        className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${urgent ? 'text-red-600 hover:text-red-700' : 'text-yellow-700 hover:text-yellow-800'}`}
      >
        View application <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

export default function TrademarkDashboard() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['trademark-applications'],
    queryFn: () => trademarkApi.listApplications(),
  });

  const applications: TrademarkApplication[] = data?.data?.applications ?? [];
  const total = applications.length;
  const active = applications.filter((a) => a.status === 'pending' || a.status === 'filed').length;
  const approved = applications.filter((a) => a.status === 'approved').length;
  const deadlines = applications.filter((a) => a.nextActionDate);

  const handleNew = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      const res = await trademarkApi.createApplication({ markName: 'New Trademark' });
      if (res.success && res.data) {
        navigate(`/trademark/apply/${res.data.id}`);
      } else {
        setCreateError('Could not create application. Please try again.');
      }
    } catch {
      setCreateError('Could not create application. Please check your connection and try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Create error banner */}
      {createError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {createError}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trademark & Service Mark</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            File, track, and manage your trademark applications across all 50 states and federally.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/trademark/search"
            className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <Search className="h-4 w-4" />
            Search Marks
          </Link>
          <button
            onClick={handleNew}
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {creating ? 'Creating...' : 'New Application'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Applications', value: total, icon: Award, color: 'text-primary' },
          { label: 'Active / Pending', value: active, icon: Clock, color: 'text-yellow-600' },
          { label: 'Approved / Registered', value: approved, icon: CheckCircle2, color: 'text-green-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">{isLoading ? '—' : value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Applications list */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Applications</h2>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl border bg-muted" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <Award className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium text-foreground">No trademark applications yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Start by searching for existing marks or filing a new application.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <Link
                  to="/trademark/search"
                  className="inline-flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  <Search className="h-4 w-4" />
                  Search First
                </Link>
                <button
                  onClick={handleNew}
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {creating ? 'Creating...' : 'Start Application'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center gap-4 rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground truncate">{app.markName}</p>
                      <StatusBadge status={app.status} />
                      <span className="text-xs text-muted-foreground capitalize">
                        {app.jurisdiction}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      {app.goodsServices && (
                        <span className="truncate max-w-[220px]">{app.goodsServices}</span>
                      )}
                      {app.niceClasses && app.niceClasses.length > 0 && (
                        <span>Class {app.niceClasses.join(', ')}</span>
                      )}
                      <span>Created {new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                    {app.interviewProgress !== undefined && app.status === 'draft' && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-primary transition-all"
                            style={{ width: `${app.interviewProgress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{app.interviewProgress}%</span>
                      </div>
                    )}
                  </div>
                  <Link
                    to={`/trademark/apply/${app.id}`}
                    className="flex-shrink-0 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
                  >
                    {app.status === 'draft' ? 'Continue' : 'View'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deadlines sidebar */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Upcoming Deadlines</h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : deadlines.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-green-500/60" />
              <p className="mt-2 text-sm text-muted-foreground">No upcoming deadlines</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deadlines
                .sort((a, b) => new Date(a.nextActionDate!).getTime() - new Date(b.nextActionDate!).getTime())
                .slice(0, 5)
                .map((app) => (
                  <DeadlineCard key={app.id} app={app} />
                ))}
            </div>
          )}

          {/* Quick links */}
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground">Quick Actions</p>
            <Link
              to="/trademark/search"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Search className="h-4 w-4" />
              Search USPTO Database
            </Link>
            <button
              onClick={handleNew}
              disabled={creating}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-60"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              File Federal Application
            </button>
            <a
              href="https://www.uspto.gov/trademarks"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <FileText className="h-4 w-4" />
              USPTO Resources
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
