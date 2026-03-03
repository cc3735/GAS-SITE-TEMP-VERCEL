import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Info,
  Sparkles,
} from 'lucide-react';
import { trademarkApi, type TrademarkSearchResult, type TrademarkConflictAnalysis, type NiceClass } from '@/lib/api';

const RISK_CONFIG = {
  low: { label: 'Low Risk', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  medium: { label: 'Medium Risk', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  high: { label: 'High Risk', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
};

function RiskBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  const cfg = RISK_CONFIG[level];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

export default function TrademarkSearch() {
  const navigate = useNavigate();
  const [markName, setMarkName] = useState('');
  const [goodsServices, setGoodsServices] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [results, setResults] = useState<TrademarkSearchResult[]>([]);
  const [overallRisk, setOverallRisk] = useState<'low' | 'medium' | 'high' | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<TrademarkConflictAnalysis | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const { data: niceClassesData } = useQuery({
    queryKey: ['nice-classes'],
    queryFn: () => trademarkApi.getNiceClasses(),
  });
  const niceClasses: NiceClass[] = niceClassesData?.data?.classes ?? [];

  const searchMutation = useMutation({
    mutationFn: () =>
      trademarkApi.search({
        markName,
        goodsServices: goodsServices || undefined,
        niceClassIds: selectedClasses.length > 0 ? selectedClasses : undefined,
      }),
    onSuccess: (res) => {
      if (res.success && res.data) {
        setResults(res.data.results);
        setSearchId(res.data.searchId);
        setOverallRisk(res.data.report?.overallRisk ?? null);
        setAiAnalysis(null);
      }
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: () =>
      trademarkApi.analyzeConflicts(searchId!, { markName, goodsServices }),
    onSuccess: (res) => {
      if (res.success && res.data) {
        setAiAnalysis(res.data.analysis);
      }
    },
  });

  const handleStartApplication = async () => {
    const res = await trademarkApi.createApplication({ markName });
    if (res.success && res.data) {
      navigate(`/trademark/apply/${res.data.id}`);
    }
  };

  const toggleClass = (classNum: number) => {
    setSelectedClasses((prev) =>
      prev.includes(classNum) ? prev.filter((c) => c !== classNum) : [...prev, classNum]
    );
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Trademark Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search the USPTO database for existing marks before filing your application.
        </p>
      </div>

      {/* Search form */}
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Mark Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={markName}
              onChange={(e) => setMarkName(e.target.value)}
              placeholder="e.g. SWOOSH, APPLE, LEGALFLOW"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Goods / Services Description
            </label>
            <input
              type="text"
              value={goodsServices}
              onChange={(e) => setGoodsServices(e.target.value)}
              placeholder="e.g. legal document software, financial services"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* NICE Class picker */}
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => setShowClassPicker(!showClassPicker)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {showClassPicker ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Filter by NICE Class
            {selectedClasses.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {selectedClasses.length} selected
              </span>
            )}
          </button>

          {showClassPicker && (
            <div className="max-h-48 overflow-y-auto rounded-lg border bg-background p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {niceClasses.slice(0, 45).map((nc) => (
                  <label key={nc.classNumber} className="flex items-center gap-2 cursor-pointer rounded px-2 py-1.5 hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(nc.classNumber)}
                      onChange={() => toggleClass(nc.classNumber)}
                      className="rounded"
                    />
                    <span className="text-xs">
                      <span className="font-medium">Class {nc.classNumber}</span>
                      {' — '}
                      <span className="text-muted-foreground">{nc.title}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => searchMutation.mutate()}
            disabled={!markName.trim() || searchMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {searchMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {searchMutation.isPending ? 'Searching USPTO...' : 'Search Marks'}
          </button>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            Searches the USPTO TESS database with AI conflict analysis
          </div>
        </div>

        {searchMutation.isError && (
          <p className="text-sm text-destructive">Search failed. Please try again.</p>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-foreground">
                {results.length} Matching Mark{results.length !== 1 ? 's' : ''} Found
              </h2>
              {overallRisk && <RiskBadge level={overallRisk} />}
            </div>
            <div className="flex items-center gap-3">
              {searchId && !aiAnalysis && (
                <button
                  onClick={() => analyzeMutation.mutate()}
                  disabled={analyzeMutation.isPending || !goodsServices.trim()}
                  className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
                  title={!goodsServices.trim() ? 'Add goods/services description for AI analysis' : undefined}
                >
                  {analyzeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  AI Conflict Analysis
                </button>
              )}
              <button
                onClick={handleStartApplication}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Start Application
              </button>
            </div>
          </div>

          {/* AI Analysis panel */}
          {aiAnalysis && (
            <div className={`rounded-xl border p-5 space-y-3 ${
              aiAnalysis.overallRisk === 'high'
                ? 'border-red-200 bg-red-50'
                : aiAnalysis.overallRisk === 'medium'
                ? 'border-yellow-200 bg-yellow-50'
                : 'border-green-200 bg-green-50'
            }`}>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="font-semibold text-foreground">AI Conflict Analysis</p>
                <RiskBadge level={aiAnalysis.overallRisk} />
                <span className="text-sm text-muted-foreground">
                  Risk Score: {aiAnalysis.riskScore}/100
                </span>
              </div>
              <p className="text-sm text-foreground">{aiAnalysis.summary}</p>
              {aiAnalysis.recommendations.length > 0 && (
                <ul className="space-y-1">
                  {aiAnalysis.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="mt-0.5 text-primary">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Results table */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mark Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Owner</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Risk</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Similarity</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {results.map((result, i) => (
                  <>
                    <tr
                      key={i}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{result.markName}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[160px] truncate">{result.owner}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          result.status === 'Registered'
                            ? 'bg-green-100 text-green-700'
                            : result.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {result.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {result.riskLevel && <RiskBadge level={result.riskLevel} />}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {result.similarity != null ? `${Math.round(result.similarity * 100)}%` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {expandedRow === i ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </td>
                    </tr>
                    {expandedRow === i && (
                      <tr key={`${i}-detail`}>
                        <td colSpan={6} className="px-4 py-3 bg-muted/20">
                          <div className="space-y-1.5 text-sm">
                            {result.serialNumber && (
                              <p><span className="font-medium">Serial #:</span> {result.serialNumber}</p>
                            )}
                            {result.registrationNumber && (
                              <p><span className="font-medium">Reg #:</span> {result.registrationNumber}</p>
                            )}
                            {result.goodsServices && (
                              <p><span className="font-medium">Goods/Services:</span> {result.goodsServices}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Proceed CTA */}
          <div className="flex items-center justify-between rounded-xl border bg-card p-5">
            <div>
              <p className="font-semibold text-foreground">Ready to file your application?</p>
              <p className="text-sm text-muted-foreground">
                Our guided wizard walks you through all 8 steps of the TEAS application process.
              </p>
            </div>
            <button
              onClick={handleStartApplication}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Start Application for "{markName}"
            </button>
          </div>
        </div>
      )}

      {/* No results */}
      {!searchMutation.isPending && searchMutation.isSuccess && results.length === 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
          <p className="mt-3 font-semibold text-foreground">No Conflicting Marks Found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            "{markName}" doesn't appear to conflict with existing marks. You may be clear to file.
          </p>
          <button
            onClick={handleStartApplication}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            File Application
          </button>
        </div>
      )}
    </div>
  );
}
