/**
 * Dashboard Page Component
 *
 * Enhanced dashboard with:
 * - Tax deadline countdown (April 15, quarterly estimates)
 * - Personalized recommendations based on user profile
 * - Progress indicators for incomplete returns
 * - Tax savings tips and suggestions
 *
 * @version 1.1.0
 * @updated 2026-01-12 - Added deadline countdown, recommendations, and progress indicators
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import { taxApi, legalApi, filingApi, subscriptionApi, TaxReturn } from '@/lib/api';
import {
  FileText,
  Scale,
  FolderOpen,
  Calculator,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Clock,
  CalendarDays,
  TrendingUp,
  Lightbulb,
  DollarSign,
  ChevronRight,
  AlertTriangle,
  Target,
  Sparkles,
} from 'lucide-react';
import { useMemo } from 'react';

// ============================================================================
// Tax Deadline Utilities
// ============================================================================

interface TaxDeadline {
  name: string;
  date: Date;
  description: string;
  type: 'federal' | 'state' | 'quarterly' | 'extension';
  urgent: boolean;
}

/**
 * Get upcoming tax deadlines for the current year
 */
function getUpcomingDeadlines(): TaxDeadline[] {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Define all important tax deadlines
  const deadlines: TaxDeadline[] = [
    {
      name: 'Tax Filing Deadline',
      date: new Date(currentYear, 3, 15), // April 15
      description: 'Federal income tax return due',
      type: 'federal',
      urgent: false,
    },
    {
      name: 'Q1 Estimated Tax',
      date: new Date(currentYear, 3, 15), // April 15
      description: 'First quarterly estimated payment due',
      type: 'quarterly',
      urgent: false,
    },
    {
      name: 'Q2 Estimated Tax',
      date: new Date(currentYear, 5, 15), // June 15
      description: 'Second quarterly estimated payment due',
      type: 'quarterly',
      urgent: false,
    },
    {
      name: 'Q3 Estimated Tax',
      date: new Date(currentYear, 8, 15), // September 15
      description: 'Third quarterly estimated payment due',
      type: 'quarterly',
      urgent: false,
    },
    {
      name: 'Extension Deadline',
      date: new Date(currentYear, 9, 15), // October 15
      description: 'Extended federal return due',
      type: 'extension',
      urgent: false,
    },
    {
      name: 'Q4 Estimated Tax',
      date: new Date(currentYear, 0, 15), // January 15 (next year for current year's Q4)
      description: 'Fourth quarterly estimated payment due',
      type: 'quarterly',
      urgent: false,
    },
  ];

  // Adjust Q4 to next year if we're past January
  const q4Index = deadlines.findIndex(d => d.name === 'Q4 Estimated Tax');
  if (q4Index !== -1 && now.getMonth() > 0) {
    deadlines[q4Index].date = new Date(currentYear + 1, 0, 15);
  }

  // Filter to only upcoming deadlines and mark urgent ones (within 30 days)
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return deadlines
    .filter(d => d.date > now)
    .map(d => ({
      ...d,
      urgent: d.date <= thirtyDaysFromNow,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3); // Show top 3 upcoming deadlines
}

/**
 * Calculate days until a deadline
 */
function getDaysUntil(date: Date): number {
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format a date for display
 */
function formatDeadlineDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ============================================================================
// Tax Recommendations Generator
// ============================================================================

interface TaxRecommendation {
  id: string;
  title: string;
  description: string;
  potentialSavings?: number;
  action: string;
  actionUrl: string;
  priority: 'high' | 'medium' | 'low';
  icon: typeof Lightbulb;
}

/**
 * Generate personalized tax recommendations based on user data
 */
function generateRecommendations(
  taxReturns: TaxReturn[] | undefined,
  subscriptionTier: string
): TaxRecommendation[] {
  const recommendations: TaxRecommendation[] = [];
  const currentYear = new Date().getFullYear();

  // Check if user has started current year return
  const hasCurrentYearReturn = taxReturns?.some(r => r.taxYear === currentYear);

  if (!hasCurrentYearReturn) {
    recommendations.push({
      id: 'start-current-year',
      title: `Start Your ${currentYear} Tax Return`,
      description: 'Get ahead of the tax season by starting your return now.',
      action: 'Start Return',
      actionUrl: '/tax',
      priority: 'high',
      icon: FileText,
    });
  }

  // Check for incomplete returns
  const incompleteReturns = taxReturns?.filter(r =>
    r.status === 'draft' || r.status === 'in_progress'
  );

  if (incompleteReturns && incompleteReturns.length > 0) {
    recommendations.push({
      id: 'complete-returns',
      title: 'Complete Your Tax Return',
      description: `You have ${incompleteReturns.length} unfinished return(s). Complete them to see your refund estimate.`,
      action: 'Continue',
      actionUrl: `/tax/${incompleteReturns[0].id}`,
      priority: 'high',
      icon: Target,
    });
  }

  // Recommend document upload for efficiency
  recommendations.push({
    id: 'scan-documents',
    title: 'Scan Your W-2 or 1099',
    description: 'Save time by scanning your tax documents. Our OCR technology will auto-fill your return.',
    potentialSavings: undefined,
    action: 'Scan Documents',
    actionUrl: '/tax/documents',
    priority: 'medium',
    icon: Sparkles,
  });

  // Suggest retirement contributions if applicable
  const currentMonth = new Date().getMonth();
  if (currentMonth >= 0 && currentMonth <= 3) { // Jan-April
    recommendations.push({
      id: 'retirement-contribution',
      title: 'Maximize Retirement Contributions',
      description: `You can still contribute to an IRA for ${currentYear - 1} until April 15. This could reduce your taxable income.`,
      potentialSavings: 1500,
      action: 'Learn More',
      actionUrl: '/tax/tips#retirement',
      priority: 'medium',
      icon: DollarSign,
    });
  }

  // Premium feature suggestions for free users
  if (subscriptionTier === 'free') {
    recommendations.push({
      id: 'upgrade-premium',
      title: 'Unlock All Tax Credits',
      description: 'Premium users get automatic calculation of EITC, education credits, energy credits, and more.',
      action: 'View Plans',
      actionUrl: '/settings/subscription',
      priority: 'low',
      icon: TrendingUp,
    });
  }

  return recommendations.slice(0, 4); // Return top 4 recommendations
}

// ============================================================================
// Progress Calculator
// ============================================================================

interface ReturnProgress {
  taxReturnId: string;
  taxYear: number;
  status: string;
  progress: number;
  nextStep: string;
}

/**
 * Calculate progress for each tax return
 */
function calculateReturnProgress(taxReturns: TaxReturn[] | undefined): ReturnProgress[] {
  if (!taxReturns) return [];

  return taxReturns
    .filter(r => r.status !== 'filed' && r.status !== 'accepted')
    .map(r => {
      let progress = 0;
      let nextStep = 'Start your return';

      switch (r.status) {
        case 'draft':
          progress = 10;
          nextStep = 'Complete personal information';
          break;
        case 'in_progress':
          // Estimate progress based on available data
          if (r.filingStatus) progress = 30;
          if (r.totalIncome && r.totalIncome > 0) progress = 60;
          if (r.refundAmount !== undefined) progress = 80;
          nextStep = progress < 30
            ? 'Add income information'
            : progress < 60
              ? 'Add deductions and credits'
              : 'Review and file';
          break;
        case 'review':
          progress = 90;
          nextStep = 'Submit your return';
          break;
        case 'submitted':
          progress = 95;
          nextStep = 'Awaiting IRS acceptance';
          break;
        default:
          progress = 0;
      }

      return {
        taxReturnId: r.id,
        taxYear: r.taxYear,
        status: r.status,
        progress,
        nextStep,
      };
    })
    .slice(0, 3); // Show top 3
}

// ============================================================================
// Dashboard Component
// ============================================================================

export default function Dashboard() {
  const { user } = useAuthStore();

  // Fetch tax returns
  const { data: taxReturns } = useQuery({
    queryKey: ['taxReturns'],
    queryFn: async () => {
      const res = await taxApi.listReturns();
      return res.data?.returns || [];
    },
  });

  // Fetch legal documents
  const { data: legalDocs } = useQuery({
    queryKey: ['legalDocuments'],
    queryFn: async () => {
      const res = await legalApi.listDocuments({ limit: '5' } as unknown as { category?: string; status?: string });
      return res.data?.documents || [];
    },
  });

  // Fetch filings
  const { data: filings } = useQuery({
    queryKey: ['filings'],
    queryFn: async () => {
      const res = await filingApi.listFilings();
      return res.data?.filings || [];
    },
  });

  // Fetch usage stats
  const { data: usage } = useQuery({
    queryKey: ['usage'],
    queryFn: async () => {
      const res = await subscriptionApi.getUsage();
      return res.data;
    },
  });

  // Calculate derived data
  const upcomingDeadlines = useMemo(() => getUpcomingDeadlines(), []);
  const recommendations = useMemo(
    () => generateRecommendations(taxReturns, user?.subscriptionTier || 'free'),
    [taxReturns, user?.subscriptionTier]
  );
  const returnProgress = useMemo(
    () => calculateReturnProgress(taxReturns),
    [taxReturns]
  );

  // Quick actions configuration
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

  /**
   * Get status icon based on status string
   */
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
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.firstName || 'there'}!
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your account and recent activity.
        </p>
      </div>

      {/* Tax Deadline Countdown - NEW */}
      {upcomingDeadlines.length > 0 && (
        <div className="rounded-xl border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold">Upcoming Tax Deadlines</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {upcomingDeadlines.map((deadline) => {
              const daysUntil = getDaysUntil(deadline.date);
              return (
                <div
                  key={deadline.name}
                  className={`rounded-lg bg-white dark:bg-gray-900 p-4 border ${
                    deadline.urgent
                      ? 'border-orange-300 dark:border-orange-700'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{deadline.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDeadlineDate(deadline.date)}
                      </p>
                    </div>
                    {deadline.urgent && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Soon
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {daysUntil} <span className="text-sm font-normal text-muted-foreground">days</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {deadline.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Personalized Recommendations - NEW */}
      {recommendations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Recommendations for You</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className={`rounded-xl border bg-card p-4 hover:shadow-md transition-shadow ${
                  rec.priority === 'high'
                    ? 'border-l-4 border-l-blue-500'
                    : rec.priority === 'medium'
                      ? 'border-l-4 border-l-amber-500'
                      : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    rec.priority === 'high'
                      ? 'bg-blue-100 dark:bg-blue-900/20'
                      : 'bg-amber-100 dark:bg-amber-900/20'
                  }`}>
                    <rec.icon className={`h-5 w-5 ${
                      rec.priority === 'high'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{rec.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {rec.description}
                    </p>
                    {rec.potentialSavings && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1 font-medium">
                        Potential savings: ${rec.potentialSavings.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Link
                    to={rec.actionUrl}
                    className="inline-flex items-center text-sm text-primary font-medium hover:underline whitespace-nowrap"
                  >
                    {rec.action}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Return Progress Indicators - NEW */}
      {returnProgress.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-semibold">Tax Return Progress</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {returnProgress.map((item) => (
              <Link
                key={item.taxReturnId}
                to={`/tax/${item.taxReturnId}`}
                className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">{item.taxYear} Tax Return</h3>
                  <span className="text-sm text-muted-foreground capitalize">
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="mb-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{item.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Next: {item.nextStep}
                </p>
                <span className="inline-flex items-center text-sm text-primary font-medium mt-2 group-hover:gap-2 transition-all">
                  Continue
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

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

      {/* Tax Tips Section - NEW */}
      <div className="rounded-xl border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h2 className="text-lg font-semibold">Tax Savings Tips</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-sm mb-2">Maximize Deductions</h4>
            <p className="text-xs text-muted-foreground">
              Track charitable donations, medical expenses over 7.5% of AGI, and home office costs if self-employed.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-sm mb-2">Education Credits</h4>
            <p className="text-xs text-muted-foreground">
              The American Opportunity Credit can provide up to $2,500 per eligible student for college expenses.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-sm mb-2">Energy Savings</h4>
            <p className="text-xs text-muted-foreground">
              Solar panels, heat pumps, and EV purchases can qualify for substantial federal tax credits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
