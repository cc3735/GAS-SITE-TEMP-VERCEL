import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

interface IntakeTrademark {
  has_filed_trademark: boolean | null;
  trademark_name: string | null;
  trademark_status: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'text-slate-700', bg: 'bg-slate-100' },
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-100' },
  filed: { label: 'Filed', color: 'text-blue-700', bg: 'bg-blue-100' },
  approved: { label: 'Approved', color: 'text-green-700', bg: 'bg-green-100' },
  refused: { label: 'Refused', color: 'text-red-700', bg: 'bg-red-100' },
  abandoned: { label: 'Abandoned', color: 'text-slate-500', bg: 'bg-slate-100' },
};

export default function LegalFlowTrademark() {
  const { user } = useAuth();
  const [intake, setIntake] = useState<IntakeTrademark | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('client_intake')
      .select('has_filed_trademark, trademark_name, trademark_status')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setIntake(data);
        setIsLoading(false);
      });
  }, [user]);

  const hasTrademark = intake?.has_filed_trademark === true;
  const statusCfg = STATUS_LABELS[intake?.trademark_status ?? ''] ?? STATUS_LABELS.draft;

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
            onClick={() => alert('USPTO trademark search coming soon.')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Search className="w-4 h-4" />
            Search Marks
          </button>
          <button
            onClick={() => alert('Trademark application filing coming soon.')}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Application
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: 'Total Applications',
            value: hasTrademark ? 1 : 0,
            icon: Award,
            color: 'text-orange-600',
          },
          {
            label: 'Active / Pending',
            value:
              hasTrademark &&
              (intake?.trademark_status === 'pending' || intake?.trademark_status === 'filed')
                ? 1
                : 0,
            icon: Clock,
            color: 'text-amber-600',
          },
          {
            label: 'Approved / Registered',
            value: hasTrademark && intake?.trademark_status === 'approved' ? 1 : 0,
            icon: CheckCircle2,
            color: 'text-green-600',
          },
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
          ) : hasTrademark && intake?.trademark_name ? (
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
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}
                    >
                      {statusCfg.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">From intake questionnaire</p>
                </div>
              </div>
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
                  onClick={() => alert('USPTO trademark search coming soon.')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Search className="w-4 h-4" />
                  Search First
                </button>
                <button
                  onClick={() => alert('Trademark application filing coming soon.')}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
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
              onClick={() => alert('USPTO trademark search coming soon.')}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <Search className="w-4 h-4" />
              Search USPTO Database
            </button>
            <button
              onClick={() => alert('Trademark application filing coming soon.')}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <Plus className="w-4 h-4" />
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
