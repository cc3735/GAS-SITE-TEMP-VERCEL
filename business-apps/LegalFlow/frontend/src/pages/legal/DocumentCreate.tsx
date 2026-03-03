import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { legalApi, type LegalTemplateDetail, type TemplateSchemaField } from '@/lib/api';
import {
  Scale,
  FileText,
  Building,
  ScrollText,
  FileCheck,
  Award,
  ChevronRight,
  Loader2,
  Download,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  business: Building,
  estate: ScrollText,
  contract: FileCheck,
  trademark: Award,
};

const CATEGORY_LABELS: Record<string, string> = {
  business: 'Business & Corporate',
  estate: 'Estate Planning',
  contract: 'Contracts & Agreements',
  trademark: 'Trademarks & IP',
};

/** Convert both schema formats into a flat TemplateSchemaField array */
function normalizeFields(schema: LegalTemplateDetail['schema']): TemplateSchemaField[] {
  if (!schema) return [];

  // Rich format from our migration: { fields: [{id, label, type, ...}] }
  if (schema.fields && schema.fields.length > 0) {
    return schema.fields;
  }

  // Legacy section format: { sections: [{id, title, fields: ['field_name']}] }
  if (schema.sections && schema.sections.length > 0) {
    return schema.sections.flatMap((section) =>
      section.fields.map((fieldName) => ({
        id: fieldName,
        label:
          fieldName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase()),
        type: 'text' as const,
        required: false,
      }))
    );
  }

  return [];
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────────

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: TemplateSchemaField;
  value: string;
  onChange: (v: string) => void;
}) {
  const base =
    'w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

  if (field.type === 'textarea') {
    return (
      <textarea
        id={field.id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={3}
        required={field.required}
        className={base}
      />
    );
  }

  if (field.type === 'date') {
    return (
      <input
        id={field.id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        className={base}
      />
    );
  }

  if ((field.type === 'select' || field.type === 'multiselect') && field.options) {
    return (
      <select
        id={field.id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        className={base}
      >
        <option value="">Select…</option>
        {field.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          id={field.id}
          checked={value === 'true'}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
          className="h-4 w-4 rounded border-gray-300 text-primary"
        />
        <span className="text-sm">{field.placeholder || field.label}</span>
      </label>
    );
  }

  return (
    <input
      id={field.id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      required={field.required}
      className={base}
    />
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 1: Template Picker
// ──────────────────────────────────────────────────────────────────────────────

function TemplatePicker({ onSelect }: { onSelect: (t: LegalTemplateDetail) => void }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['legal-templates', selectedCategory],
    queryFn: () => legalApi.listTemplates(selectedCategory ? { category: selectedCategory } : undefined),
  });

  const templates = data?.data?.templates ?? [];
  const categories = data?.data?.categories ?? [];

  const getTemplateMutation = useMutation({
    mutationFn: (id: string) => legalApi.getTemplate(id),
  });

  const handleSelect = async (templateId: string) => {
    const res = await getTemplateMutation.mutateAsync(templateId);
    if (res.success && res.data) {
      onSelect(res.data);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Choose a Template</h2>
        <p className="text-sm text-muted-foreground">
          Select the type of legal document you need to create.
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            selectedCategory === ''
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          All
        </button>
        {categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id] || FileText;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.name}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border bg-muted" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <Scale className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-muted-foreground">No templates found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((t) => {
            const Icon = CATEGORY_ICONS[t.category] || FileText;
            return (
              <button
                key={t.id}
                onClick={() => handleSelect(t.id)}
                disabled={!t.accessible || getTemplateMutation.isPending}
                className={`group relative rounded-xl border p-4 text-left transition-all ${
                  t.accessible
                    ? 'hover:border-primary hover:shadow-md cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                {t.requiresUpgrade && (
                  <span className="absolute top-2 right-2 rounded-full bg-gradient-to-r from-primary to-teal-500 px-2 py-0.5 text-xs font-medium text-white">
                    Premium
                  </span>
                )}
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="font-medium text-sm text-foreground leading-tight">{t.name}</p>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                {t.basePrice > 0 && (
                  <p className="mt-2 text-xs font-semibold text-primary">
                    Starting at ${t.basePrice}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary group-hover:gap-2 transition-all">
                  {t.accessible ? (
                    <>
                      Select <ChevronRight className="h-3 w-3" />
                    </>
                  ) : (
                    <>Upgrade to access</>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {getTemplateMutation.isPending && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading template…
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 2: Fill Fields
// ──────────────────────────────────────────────────────────────────────────────

function FieldsForm({
  template,
  onBack,
  onSubmit,
}: {
  template: LegalTemplateDetail;
  onBack: () => void;
  onSubmit: (values: Record<string, string>) => void;
}) {
  const fields = normalizeFields(template.schema);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.id, '']))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  const Icon = CATEGORY_ICONS[template.category] || FileText;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{template.name}</h2>
          <p className="text-sm text-muted-foreground">{template.description}</p>
        </div>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">
            No additional fields required. Click Generate to proceed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.id}>
              <label
                htmlFor={field.id}
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                {field.label}
                {field.required && <span className="ml-1 text-destructive">*</span>}
              </label>
              <FieldInput
                field={field}
                value={values[field.id] ?? ''}
                onChange={(v) => setValues((prev) => ({ ...prev, [field.id]: v }))}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Generate Document
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 3: Generating
// ──────────────────────────────────────────────────────────────────────────────

function GeneratingStep() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      <div>
        <p className="text-lg font-semibold text-foreground">Generating your document…</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Our AI is drafting a professional document based on the information you provided.
          This usually takes 15–30 seconds.
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 4: View Result
// ──────────────────────────────────────────────────────────────────────────────

function ResultStep({
  documentId,
  content,
  title,
}: {
  documentId: string;
  content: string;
  title: string;
}) {
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await legalApi.generatePdf(documentId);
      if (res.success && res.data?.pdfBase64) {
        const bytes = atob(res.data.pdfBase64);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        const blob = new Blob([arr], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.data.filename || `${title.replace(/\s+/g, '_')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Document Generated!</h2>
          <p className="text-sm text-muted-foreground">
            Review your document below. You can download it as a PDF or edit it later.
          </p>
        </div>
      </div>

      {/* Document preview */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b bg-muted/50 px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{title}</span>
          <span className="text-xs text-muted-foreground">AI Draft — Review before use</span>
        </div>
        <div className="p-6 max-h-[500px] overflow-y-auto">
          <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
            {content}
          </pre>
        </div>
      </div>

      {/* Legal disclaimer */}
      <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>
          This AI-generated document is a starting point only. Please review it carefully and
          consult a licensed attorney before signing or filing. Laws vary by state.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download PDF
        </button>
        <Link
          to={`/legal/${documentId}`}
          className="inline-flex items-center gap-2 rounded-lg border border-input px-5 py-2.5 text-sm font-medium hover:bg-muted"
        >
          View & Edit Document
        </Link>
        <button
          onClick={() => navigate('/legal')}
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          Back to My Documents
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main wizard
// ──────────────────────────────────────────────────────────────────────────────

type WizardStep = 'pick' | 'fields' | 'generating' | 'result';

export default function DocumentCreate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const preloadTemplateName = searchParams.get('template'); // e.g. "revocable_living_trust"

  const [step, setStep] = useState<WizardStep>(preloadTemplateName ? 'loading' as WizardStep : 'pick');
  const [selectedTemplate, setSelectedTemplate] = useState<LegalTemplateDetail | null>(null);
  const [createdDocId, setCreatedDocId] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Preload template by name if ?template= param present
  const { isLoading: preloading } = useQuery({
    queryKey: ['template-by-name', preloadTemplateName],
    enabled: !!preloadTemplateName,
    queryFn: async () => {
      const res = await legalApi.listTemplates({ search: preloadTemplateName! });
      const templates = res.data?.templates ?? [];
      if (templates.length > 0) {
        const detail = await legalApi.getTemplate(templates[0].id);
        if (detail.success && detail.data) {
          setSelectedTemplate(detail.data);
          setStep('fields');
        }
      } else {
        setStep('pick');
      }
      return null;
    },
  });

  const handleTemplateSelected = (t: LegalTemplateDetail) => {
    setSelectedTemplate(t);
    setStep('fields');
  };

  const handleFieldsSubmit = async (values: Record<string, string>) => {
    if (!selectedTemplate) return;
    setError('');
    setStep('generating');

    try {
      // 1. Create the document record
      const createRes = await legalApi.createDocument({
        documentType: selectedTemplate.name.toLowerCase().replace(/\s+/g, '_'),
        documentCategory: selectedTemplate.category,
        title: selectedTemplate.name,
        templateId: selectedTemplate.id,
      });

      if (!createRes.success || !createRes.data) {
        throw new Error(createRes.error?.message || 'Failed to create document');
      }

      const docId = createRes.data.id;
      setCreatedDocId(docId);

      // 2. Save field values to document_data
      const nonEmptyValues = Object.fromEntries(
        Object.entries(values).filter(([, v]) => v.trim() !== '')
      );
      await legalApi.updateDocument(docId, { documentData: nonEmptyValues } as Parameters<typeof legalApi.updateDocument>[1]);

      // 3. AI-generate content
      const customizations = Object.entries(nonEmptyValues)
        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
        .join('\n');

      const aiRes = await legalApi.aiCustomize(docId, customizations);
      const content =
        aiRes.success && aiRes.data?.content
          ? aiRes.data.content
          : 'Document generated. Please review and customize as needed.';

      setGeneratedContent(content);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('fields');
    }
  };

  // ── Render ──

  const isPreloading = !!preloadTemplateName && preloading && step === ('loading' as WizardStep);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Header breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/legal" className="hover:text-foreground">
          Legal Documents
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Create Document</span>
      </div>

      {/* Progress indicator */}
      {step !== 'pick' && (
        <div className="flex items-center gap-2">
          {(['fields', 'generating', 'result'] as const).map((s, i) => {
            const done =
              (s === 'fields' && (step === 'generating' || step === 'result')) ||
              (s === 'generating' && step === 'result');
            const active = s === step;
            return (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <div className="h-px w-6 bg-border" />}
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    done
                      ? 'bg-green-500 text-white'
                      : active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    active ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {s === 'fields' ? 'Fill Details' : s === 'generating' ? 'Generating' : 'Review'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Content card */}
      <div className="rounded-xl border bg-card p-6">
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {isPreloading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading template…
          </div>
        ) : step === 'pick' ? (
          <TemplatePicker onSelect={handleTemplateSelected} />
        ) : step === 'fields' && selectedTemplate ? (
          <FieldsForm
            template={selectedTemplate}
            onBack={() => {
              setSelectedTemplate(null);
              setStep('pick');
            }}
            onSubmit={handleFieldsSubmit}
          />
        ) : step === 'generating' ? (
          <GeneratingStep />
        ) : step === 'result' ? (
          <ResultStep
            documentId={createdDocId}
            content={generatedContent}
            title={selectedTemplate?.name || 'Legal Document'}
          />
        ) : null}
      </div>

      {/* Disclaimer */}
      {step === 'pick' && (
        <p className="text-xs text-center text-muted-foreground">
          ⚠️ LegalFlow generates document templates. This is not legal advice. Always review with a
          licensed attorney.{' '}
          <Link to="/disclaimer" className="underline hover:text-foreground">
            Learn more
          </Link>
        </p>
      )}
    </div>
  );
}
