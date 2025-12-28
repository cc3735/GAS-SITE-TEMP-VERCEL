import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import { taxApi, legalApi, filingApi, subscriptionApi } from '@/lib/api';
import {
  FileText,
  Scale,
  FolderOpen,
  Calculator,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();

  const { data: taxReturns } = useQuery({
    queryKey: ['taxReturns'],
    queryFn: async () => {
      const res = await taxApi.listReturns();
      return res.data?.returns || [];
    },
  });

  const { data: legalDocs } = useQuery({
    queryKey: ['legalDocuments'],
    queryFn: async () => {
      const res = await legalApi.listDocuments({ limit: '5' } as unknown as { category?: string; status?: string });
      return res.data?.documents || [];
    },
  });

  const { data: filings } = useQuery({
    queryKey: ['filings'],
    queryFn: async () => {
      const res = await filingApi.listFilings();
      return res.data?.filings || [];
    },
  });

  const { data: usage } = useQuery({
    queryKey: ['usage'],
    queryFn: async () => {
      const res = await subscriptionApi.getUsage();
      return res.data;
    },
  });

  const quickActions = [
    {
      title: 'Start Tax Return',
      description: 'File your federal and state taxes',
      icon: FileText,
      href: '/tax',
      color: 'bg-blue-500',
    },
    {
      title: 'Create Legal Document',
      description: 'LLC, Will, NDA, and more',
      icon: Scale,
      href: '/legal',
      color: 'bg-purple-500',
    },
    {
      title: 'Start Legal Filing',
      description: 'Divorce, custody, name change',
      icon: FolderOpen,
      href: '/filing',
      color: 'bg-orange-500',
    },
    {
      title: 'Child Support Calculator',
      description: 'Calculate support payments',
      icon: Calculator,
      href: '/child-support',
      color: 'bg-teal-500',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'filed':
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
      case 'draft':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.firstName || 'there'}!
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your account and recent activity.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tax Returns</p>
              <p className="text-2xl font-bold">{taxReturns?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <Scale className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Legal Documents</p>
              <p className="text-2xl font-bold">{legalDocs?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
              <FolderOpen className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Legal Filings</p>
              <p className="text-2xl font-bold">{filings?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/20">
              <Calculator className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Calculations</p>
              <p className="text-2xl font-bold">
                {usage?.usage?.childSupportCalculations?.used || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="group rounded-xl border bg-card p-6 hover:border-primary hover:shadow-md transition-all"
            >
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${action.color} text-white mb-4`}>
                <action.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mb-1">{action.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
              <span className="inline-flex items-center text-sm text-primary font-medium group-hover:gap-2 transition-all">
                Get Started
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tax Returns */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="font-semibold">Recent Tax Returns</h3>
            <Link to="/tax" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="p-4">
            {taxReturns && taxReturns.length > 0 ? (
              <div className="space-y-3">
                {taxReturns.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(item.status)}
                      <div>
                        <p className="font-medium">{item.taxYear} Tax Return</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {item.status.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    {item.refundAmount && item.refundAmount > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                          +${item.refundAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Refund</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No tax returns yet</p>
                <Link to="/tax" className="text-primary text-sm hover:underline">
                  Start your first return
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Legal Documents */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="font-semibold">Recent Legal Documents</h3>
            <Link to="/legal" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="p-4">
            {legalDocs && legalDocs.length > 0 ? (
              <div className="space-y-3">
                {legalDocs.slice(0, 3).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(doc.status)}
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {doc.documentType.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Scale className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No documents yet</p>
                <Link to="/legal" className="text-primary text-sm hover:underline">
                  Create your first document
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Usage */}
      {user?.subscriptionTier !== 'free' && usage && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">This Month's Usage</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Tax Returns</span>
                <span className="font-medium">
                  {usage.usage.taxReturns.unlimited 
                    ? 'Unlimited' 
                    : `${usage.usage.taxReturns.used} / ${usage.usage.taxReturns.limit}`}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ 
                    width: usage.usage.taxReturns.unlimited 
                      ? '0%' 
                      : `${(usage.usage.taxReturns.used / usage.usage.taxReturns.limit) * 100}%` 
                  }} 
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Legal Documents</span>
                <span className="font-medium">
                  {usage.usage.legalDocuments.unlimited 
                    ? 'Unlimited' 
                    : `${usage.usage.legalDocuments.used} / ${usage.usage.legalDocuments.limit}`}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full" 
                  style={{ 
                    width: usage.usage.legalDocuments.unlimited 
                      ? '0%' 
                      : `${(usage.usage.legalDocuments.used / usage.usage.legalDocuments.limit) * 100}%` 
                  }} 
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Child Support Calcs</span>
                <span className="font-medium">
                  {usage.usage.childSupportCalculations.unlimited 
                    ? 'Unlimited' 
                    : `${usage.usage.childSupportCalculations.used} / ${usage.usage.childSupportCalculations.limit}`}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-teal-500 rounded-full" 
                  style={{ 
                    width: usage.usage.childSupportCalculations.unlimited 
                      ? '0%' 
                      : `${(usage.usage.childSupportCalculations.used / usage.usage.childSupportCalculations.limit) * 100}%` 
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

