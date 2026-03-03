import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useState, useCallback } from 'react';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

const LEGALFLOW_URL = import.meta.env.VITE_LEGALFLOW_URL ?? 'http://localhost:5173';

const SECTION_MAP: Record<string, string> = {
  bookkeeping: '/bookkeeping',
  legal:       '/legal',
  trademark:   '/trademark',
  tax:         '/tax',
  accounting:  '/accounting/chart-of-accounts',
  businesses:  '/businesses',
};

const SECTION_LABELS: Record<string, string> = {
  bookkeeping: 'Bookkeeping',
  legal:       'Legal Documents',
  trademark:   'Trademark',
  tax:         'Tax Filing',
  accounting:  'Accounting',
  businesses:  'Businesses',
};

export default function LegalFlowFrame() {
  const { section = 'bookkeeping' } = useParams<{ section: string }>();
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const legalPath = SECTION_MAP[section] ?? '/dashboard';
  const token = session?.access_token ?? '';

  const iframeSrc = token
    ? `${LEGALFLOW_URL}${legalPath}?token=${encodeURIComponent(token)}&embedded=true`
    : `${LEGALFLOW_URL}${legalPath}?embedded=true`;

  const handleLoad = useCallback(() => setIsLoading(false), []);
  const handleError = useCallback(() => { setIsLoading(false); setHasError(true); }, []);

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 48px)' }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <Link
          to="/portal/legalflow"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          LegalFlow
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-900">
          {SECTION_LABELS[section] ?? section}
        </span>
      </div>

      {/* Iframe container */}
      <div className="relative flex-1 rounded-xl overflow-hidden border border-slate-200 bg-white">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}
        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-sm text-slate-600">Could not load LegalFlow.</p>
            <p className="text-xs text-slate-400">
              Make sure LegalFlow is running at{' '}
              <code className="font-mono">{LEGALFLOW_URL}</code>
            </p>
          </div>
        ) : (
          <iframe
            key={section}
            src={iframeSrc}
            title={`LegalFlow — ${SECTION_LABELS[section] ?? section}`}
            className="w-full h-full border-0"
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </div>
    </div>
  );
}
