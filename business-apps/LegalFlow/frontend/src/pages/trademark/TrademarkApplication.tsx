import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Download,
  AlertTriangle,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { trademarkApi, type TrademarkInterviewState, type FeeBreakdownItem } from '@/lib/api';

const STEP_NAMES = [
  'Jurisdiction',
  'Mark Information',
  'Owner Information',
  'Goods & Services',
  'Filing Basis',
  'Specimens',
  'Declarations',
  'Review & Submit',
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-all ${
              i < current
                ? 'bg-primary text-primary-foreground'
                : i === current
                ? 'border-2 border-primary bg-primary/10 text-primary'
                : 'border border-muted-foreground/30 bg-muted text-muted-foreground'
            }`}
          >
            {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div
              className={`mx-1 h-0.5 w-6 ${i < current ? 'bg-primary' : 'bg-muted-foreground/20'}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: { id: string; questionText: string; helpText?: string; inputType: string; options?: { value: string; label: string }[] };
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const strVal = typeof value === 'string' ? value : '';
  const boolVal = typeof value === 'boolean' ? value : false;

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">
        {question.questionText}
      </label>
      {question.helpText && (
        <p className="text-xs text-muted-foreground">{question.helpText}</p>
      )}

      {question.inputType === 'text' && (
        <input
          type="text"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      )}

      {question.inputType === 'textarea' && (
        <textarea
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      )}

      {question.inputType === 'date' && (
        <input
          type="date"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      )}

      {question.inputType === 'select' && question.options && (
        <select
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select an option…</option>
          {question.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {question.inputType === 'radio' && question.options && (
        <div className="space-y-2">
          {question.options.map((opt) => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value={opt.value}
                checked={strVal === opt.value}
                onChange={() => onChange(opt.value)}
                className="text-primary"
              />
              <span className="text-sm text-foreground">{opt.label}</span>
            </label>
          ))}
        </div>
      )}

      {question.inputType === 'boolean' && (
        <div className="flex gap-4">
          {[
            { label: 'Yes', val: true },
            { label: 'No', val: false },
          ].map(({ label, val }) => (
            <label key={label} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                checked={boolVal === val}
                onChange={() => onChange(val)}
                className="text-primary"
              />
              <span className="text-sm text-foreground">{label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TrademarkApplication() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [generatedDocs, setGeneratedDocs] = useState<{
    pdfBase64: string;
    totalFee: number;
    feeBreakdown: FeeBreakdownItem[];
    warnings: string[];
    readyToFile: boolean;
  } | null>(null);
  const [generating, setGenerating] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['trademark-interview', id],
    queryFn: () => trademarkApi.getInterview(id!),
    enabled: !!id,
  });

  const interview: TrademarkInterviewState | null = data?.data ?? null;

  // Pre-fill answers from saved state
  useEffect(() => {
    if (interview?.answers) {
      setAnswers(interview.answers as Record<string, unknown>);
    }
  }, [interview?.answers]);

  const answerMutation = useMutation({
    mutationFn: (stepAnswers: Record<string, unknown>) =>
      trademarkApi.answerInterview(id!, {
        stepId: interview!.currentStepData.stepId,
        answers: stepAnswers,
      }),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['trademark-applications'] });
    },
  });

  const nextMutation = useMutation({
    mutationFn: () => trademarkApi.nextStep(id!),
    onSuccess: () => refetch(),
  });

  const prevMutation = useMutation({
  mutationFn: () => trademarkApi.previousStep(id!),
    onSuccess: () => refetch(),
  });

  const completeMutation = useMutation({
    mutationFn: () => trademarkApi.completeInterview(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trademark-applications'] });
      navigate('/trademark');
    },
  });

  const handleNext = async () => {
    await answerMutation.mutateAsync(answers);
    if (interview && interview.currentStep < interview.totalSteps - 1) {
      await nextMutation.mutateAsync();
    }
  };

  const handleBack = () => prevMutation.mutate();

  const handleGenerateDocs = async () => {
    setGenerating(true);
    const res = await trademarkApi.generateDocuments(id!, { documentType: 'teas_plus' });
    setGenerating(false);
    if (res.success && res.data) {
      setGeneratedDocs(res.data);
    }
  };

  const handleDownload = () => {
    if (!generatedDocs) return;
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${generatedDocs.pdfBase64}`;
    link.download = `trademark-application-${id}.pdf`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Application not found.</p>
        <Link to="/trademark" className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to Trademark
        </Link>
      </div>
    );
  }

  const currentStep = interview.currentStep;
  const totalSteps = interview.totalSteps || STEP_NAMES.length;
  const stepName = interview.currentStepData?.title ?? STEP_NAMES[currentStep] ?? `Step ${currentStep + 1}`;
  const isLastStep = currentStep === totalSteps - 1;
  const questions = interview.currentStepData?.questions ?? [];
  const isBusy =
    answerMutation.isPending || nextMutation.isPending || prevMutation.isPending || completeMutation.isPending;

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/trademark"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Trademark
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium text-foreground">Application</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Trademark Application</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete all 8 steps to generate your TEAS filing documents.
        </p>
      </div>

      {/* Progress */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Step {currentStep + 1} of {totalSteps}
            </p>
            <p className="mt-0.5 text-lg font-semibold text-foreground">{stepName}</p>
          </div>
          <StepIndicator current={currentStep} total={totalSteps} />
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${interview.progress}%` }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STEP_NAMES.map((name, i) => (
            <span
              key={i}
              className={`text-xs px-2 py-0.5 rounded-full ${
                i < currentStep
                  ? 'bg-primary/10 text-primary'
                  : i === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* Step description */}
      {interview.currentStepData?.description && (
        <div className="flex items-start gap-3 rounded-lg border bg-blue-50/50 p-4 text-sm text-foreground">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p>{interview.currentStepData.description}</p>
        </div>
      )}

      {/* Questions */}
      <div className="rounded-xl border bg-card p-6 space-y-6">
        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No questions for this step. Continue to the next step.
          </p>
        ) : (
          questions.map((q) => (
            <QuestionField
              key={q.id}
              question={q}
              value={answers[q.id] ?? ''}
              onChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
            />
          ))
        )}
      </div>

      {/* Review & Generate — shown on last step */}
      {isLastStep && !generatedDocs && (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Generate Filing Documents</h3>
          <p className="text-sm text-muted-foreground">
            Your application is complete. Generate your TEAS Plus filing documents and fee breakdown.
          </p>
          <button
            onClick={handleGenerateDocs}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generating ? 'Generating...' : 'Generate TEAS Documents'}
          </button>
        </div>
      )}

      {/* Generated docs result */}
      {generatedDocs && (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Filing Documents Ready</h3>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                generatedDocs.readyToFile
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {generatedDocs.readyToFile ? 'Ready to File' : 'Review Required'}
            </span>
          </div>

          {/* Fee breakdown */}
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground">USPTO Filing Fees</p>
            {generatedDocs.feeBreakdown.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.description}</span>
                <span className="font-medium">${item.amount.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t pt-2 text-sm font-bold">
              <span>Total</span>
              <span>${generatedDocs.totalFee.toLocaleString()}</span>
            </div>
          </div>

          {/* Warnings */}
          {generatedDocs.warnings.length > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-sm font-medium">Review Required</p>
              </div>
              <ul className="space-y-1">
                {generatedDocs.warnings.map((w, i) => (
                  <li key={i} className="text-sm text-yellow-700">• {w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-input px-5 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              {completeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Mark as Filed
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      {!generatedDocs && (
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0 || isBusy}
            className="inline-flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isLastStep ? (
              <>
                Complete <Check className="h-4 w-4" />
              </>
            ) : (
              <>
                Next <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground">
        LegalFlow helps you prepare your trademark application. Submission to the USPTO must be
        done through the{' '}
        <a
          href="https://www.uspto.gov/trademarks/apply"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          USPTO TEAS system
        </a>
        . Filing fees are paid directly to the USPTO.
      </p>
    </div>
  );
}
