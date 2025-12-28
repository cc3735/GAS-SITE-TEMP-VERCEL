import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { filingApi } from '@/lib/api';
import {
  Plus,
  FolderOpen,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Users,
  Heart,
  Scale,
  DollarSign,
} from 'lucide-react';

const filingTypes = [
  {
    id: 'child_support_modification',
    name: 'Child Support Modification',
    icon: DollarSign,
    description: 'Modify existing child support orders',
    estimatedTime: '20-30 min',
  },
  {
    id: 'uncontested_divorce',
    name: 'Uncontested Divorce',
    icon: Heart,
    description: 'File for divorce when both parties agree',
    estimatedTime: '45-60 min',
  },
  {
    id: 'parenting_time',
    name: 'Parenting Time / Custody',
    icon: Users,
    description: 'Modify custody or visitation schedules',
    estimatedTime: '30-45 min',
  },
  {
    id: 'name_change',
    name: 'Name Change',
    icon: FileText,
    description: 'Petition for legal name change',
    estimatedTime: '15-20 min',
  },
];

export default function FilingDashboard() {
  const navigate = useNavigate();

  const { data: filings, isLoading } = useQuery({
    queryKey: ['legalFilings'],
    queryFn: async () => {
      const res = await filingApi.listFilings();
      return res.data?.filings || [];
    },
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      in_review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Legal Filings</h1>
          <p className="text-muted-foreground">
            Prepare and file court documents with AI-guided assistance
          </p>
        </div>
        <button
          onClick={() => navigate('/filing/new')}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition"
        >
          <Plus className="h-5 w-5" />
          New Filing
        </button>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium mb-1">Document Preparation Service</p>
            <p>
              LegalFlow provides document preparation assistance for pro se (self-represented) filers. 
              We are not a law firm and do not provide legal advice. Complex cases should be reviewed 
              by an attorney.
            </p>
          </div>
        </div>
      </div>

      {/* Filing Types */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Start a New Filing</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filingTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => navigate(`/filing/new?type=${type.id}`)}
              className="rounded-xl border bg-card p-6 text-left hover:border-primary hover:shadow-md transition group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition">
                <type.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mb-1">{type.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{type.description}</p>
              <p className="text-xs text-muted-foreground">
                ⏱️ {type.estimatedTime}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Filings List */}
      <div className="rounded-xl border bg-card">
        <div className="border-b p-4">
          <h2 className="font-semibold">Your Filings</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          </div>
        ) : filings && filings.length > 0 ? (
          <div className="divide-y">
            {filings.map((filing) => (
              <Link
                key={filing.id}
                to={`/filing/${filing.id}`}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <FolderOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {filing.filingType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {filing.jurisdiction} • {new Date(filing.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(filing.status)}`}>
                    {getStatusIcon(filing.status)}
                    {filing.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No Filings Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start your first legal filing with our step-by-step guide.
            </p>
            <button
              onClick={() => navigate('/filing/new')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition"
            >
              <Plus className="h-5 w-5" />
              Start Filing
            </button>
          </div>
        )}
      </div>

      {/* How It Works */}
      <div>
        <h2 className="text-lg font-semibold mb-4">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { step: 1, title: 'Select Filing Type', desc: 'Choose the type of court filing you need' },
            { step: 2, title: 'Answer Questions', desc: 'AI guides you through required information' },
            { step: 3, title: 'Review Forms', desc: 'Preview auto-generated court documents' },
            { step: 4, title: 'File or Print', desc: 'E-file where available or print for manual filing' },
          ].map((item) => (
            <div key={item.step} className="rounded-xl border bg-card p-6 relative">
              <div className="absolute -top-3 left-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {item.step}
              </div>
              <h3 className="font-semibold mt-2 mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

