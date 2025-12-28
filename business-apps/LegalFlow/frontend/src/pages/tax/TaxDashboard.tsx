import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { taxApi } from '@/lib/api';
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function TaxDashboard() {
  const navigate = useNavigate();

  const { data: returns, isLoading } = useQuery({
    queryKey: ['taxReturns'],
    queryFn: async () => {
      const res = await taxApi.listReturns();
      return res.data?.returns || [];
    },
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      ready_to_file: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      filed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'filed':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tax Filing</h1>
          <p className="text-muted-foreground">
            File your federal and state tax returns with AI assistance
          </p>
        </div>
        <button
          onClick={() => navigate('/tax/new')}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition"
        >
          <Plus className="h-5 w-5" />
          New Return
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Returns</p>
          <p className="text-3xl font-bold">{returns?.length || 0}</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground mb-1">Filed</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {returns?.filter((r) => r.status === 'filed').length || 0}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground mb-1">In Progress</p>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {returns?.filter((r) => ['draft', 'in_progress'].includes(r.status)).length || 0}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Refunds</p>
          <p className="text-3xl font-bold text-primary">
            ${returns?.reduce((sum, r) => sum + (r.refundAmount || 0), 0).toLocaleString() || '0'}
          </p>
        </div>
      </div>

      {/* Tax Returns List */}
      <div className="rounded-xl border bg-card">
        <div className="border-b p-4">
          <h2 className="font-semibold">Your Tax Returns</h2>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          </div>
        ) : returns && returns.length > 0 ? (
          <div className="divide-y">
            {returns.map((taxReturn) => (
              <Link
                key={taxReturn.id}
                to={`/tax/${taxReturn.id}`}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{taxReturn.taxYear} Tax Return</p>
                    <p className="text-sm text-muted-foreground">
                      {taxReturn.federalForms?.join(', ') || 'Federal'}{' '}
                      {taxReturn.stateReturns && `+ ${Object.keys(taxReturn.stateReturns).length} state(s)`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {taxReturn.refundAmount && taxReturn.refundAmount > 0 && (
                    <div className="text-right">
                      <p className="font-medium text-green-600 dark:text-green-400">
                        +${taxReturn.refundAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Refund</p>
                    </div>
                  )}
                  <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(taxReturn.status)}`}>
                    {getStatusIcon(taxReturn.status)}
                    {taxReturn.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No Tax Returns Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start your {currentYear - 1} tax return with our AI-guided process.
            </p>
            <button
              onClick={() => navigate('/tax/new')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition"
            >
              <Plus className="h-5 w-5" />
              Start {currentYear - 1} Return
            </button>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
            <TrendingUp className="h-5 w-5" />
          </div>
          <h3 className="font-semibold mb-2">Maximize Your Refund</h3>
          <p className="text-sm text-muted-foreground">
            Our AI finds every deduction and credit you qualify for to maximize your refund.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-4">
            <CheckCircle className="h-5 w-5" />
          </div>
          <h3 className="font-semibold mb-2">Accuracy Guaranteed</h3>
          <p className="text-sm text-muted-foreground">
            Real-time error checking ensures your return is accurate before filing.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-4">
            <FileText className="h-5 w-5" />
          </div>
          <h3 className="font-semibold mb-2">All Forms Supported</h3>
          <p className="text-sm text-muted-foreground">
            1040, W-2, 1099, Schedules A-E, and all common tax forms included.
          </p>
        </div>
      </div>
    </div>
  );
}

