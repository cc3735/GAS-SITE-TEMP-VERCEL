import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Briefcase,
  MapPin,
  UserCheck,
  FileText,
  Award,
  Flag,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useClientIntake } from '../../../hooks/useClientIntake';
import { useComplianceChecklist, type NewComplianceItem } from '../../../hooks/useComplianceChecklist';
import { supabase } from '../../../lib/supabase';

// ── US States ──────────────────────────────────────────────────
const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','District of Columbia','Florida','Georgia','Hawaii','Idaho','Illinois',
  'Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts',
  'Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
  'New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota',
  'Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina',
  'South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington',
  'West Virginia','Wisconsin','Wyoming',
];

const DOMAIN_HOSTS = [
  { value: 'hostinger', label: 'Hostinger' },
  { value: 'godaddy', label: 'GoDaddy' },
  { value: 'namecheap', label: 'Namecheap' },
  { value: 'cloudflare', label: 'Cloudflare' },
  { value: 'google', label: 'Google Domains' },
  { value: 'other', label: 'Other' },
];

const ENTITY_TYPES = [
  { value: 'llc', label: 'LLC' },
  { value: 's_corp', label: 'S-Corp' },
  { value: 'c_corp', label: 'C-Corp' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'sole_prop', label: 'Sole Proprietorship' },
];

const TRADEMARK_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'registered', label: 'Registered' },
  { value: 'abandoned', label: 'Abandoned' },
  { value: 'opposed', label: 'Opposed' },
];

// ── Form data type ─────────────────────────────────────────────
interface FormData {
  has_domain: boolean | null;
  domain_name: string;
  domain_host: string;
  domain_host_other: string;
  is_registered: boolean | null;
  registration_state: string;
  entity_type: string;
  business_address_line1: string;
  business_address_line2: string;
  business_city: string;
  business_state: string;
  business_zip: string;
  has_registered_agent: boolean | null;
  agent_name: string;
  agent_address_line1: string;
  agent_address_city: string;
  agent_address_state: string;
  agent_address_zip: string;
  has_operating_agreement: boolean | null;
  operating_agreement_url: string;
  has_filed_trademark: boolean | null;
  trademark_status: string;
  trademark_name: string;
  preferred_state_of_origination: string;
}

const INITIAL_FORM: FormData = {
  has_domain: null,
  domain_name: '',
  domain_host: '',
  domain_host_other: '',
  is_registered: null,
  registration_state: '',
  entity_type: '',
  business_address_line1: '',
  business_address_line2: '',
  business_city: '',
  business_state: '',
  business_zip: '',
  has_registered_agent: null,
  agent_name: '',
  agent_address_line1: '',
  agent_address_city: '',
  agent_address_state: '',
  agent_address_zip: '',
  has_operating_agreement: null,
  operating_agreement_url: '',
  has_filed_trademark: null,
  trademark_status: '',
  trademark_name: '',
  preferred_state_of_origination: '',
};

// ── Steps ──────────────────────────────────────────────────────
type Step = 'domain' | 'registration' | 'address' | 'agent' | 'agreement' | 'trademark' | 'state' | 'review';

const STEPS: { key: Step; label: string; icon: typeof Globe }[] = [
  { key: 'domain', label: 'Domain', icon: Globe },
  { key: 'registration', label: 'Registration', icon: Briefcase },
  { key: 'address', label: 'Address', icon: MapPin },
  { key: 'agent', label: 'Agent', icon: UserCheck },
  { key: 'agreement', label: 'Agreement', icon: FileText },
  { key: 'trademark', label: 'Trademark', icon: Award },
  { key: 'state', label: 'State', icon: Flag },
  { key: 'review', label: 'Review', icon: CheckCircle2 },
];

// ── Shared components ──────────────────────────────────────────
function YesNoRadio({
  value,
  onChange,
  label,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="mb-4">
      <span className="block text-sm font-medium text-slate-700 mb-2">{label}</span>
      <div className="flex gap-3">
        {[
          { v: true, l: 'Yes' },
          { v: false, l: 'No' },
        ].map(({ v, l }) => (
          <button
            key={l}
            type="button"
            onClick={() => onChange(v)}
            className={`px-5 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
              value === v
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block mb-3">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <label className="block mb-3">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function MissingNote({ text }: { text: string }) {
  return (
    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
      {text} This will be added to your compliance checklist.
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function ClientIntake() {
  const { user, intakeCompleted, refetchIntakeStatus } = useAuth();
  const { intake, loading: intakeLoading, upsertIntake, markIntakeCompleted } = useClientIntake();
  const { replaceAll } = useComplianceChecklist();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState<Step>('domain');
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = intakeCompleted;

  // Pre-populate if editing
  useEffect(() => {
    if (intake) {
      setForm({
        has_domain: intake.has_domain,
        domain_name: intake.domain_name || '',
        domain_host: intake.domain_host || '',
        domain_host_other: intake.domain_host_other || '',
        is_registered: intake.is_registered,
        registration_state: intake.registration_state || '',
        entity_type: intake.entity_type || '',
        business_address_line1: intake.business_address_line1 || '',
        business_address_line2: intake.business_address_line2 || '',
        business_city: intake.business_city || '',
        business_state: intake.business_state || '',
        business_zip: intake.business_zip || '',
        has_registered_agent: intake.has_registered_agent,
        agent_name: intake.agent_name || '',
        agent_address_line1: intake.agent_address_line1 || '',
        agent_address_city: intake.agent_address_city || '',
        agent_address_state: intake.agent_address_state || '',
        agent_address_zip: intake.agent_address_zip || '',
        has_operating_agreement: intake.has_operating_agreement,
        operating_agreement_url: intake.operating_agreement_url || '',
        has_filed_trademark: intake.has_filed_trademark,
        trademark_status: intake.trademark_status || '',
        trademark_name: intake.trademark_name || '',
        preferred_state_of_origination: intake.preferred_state_of_origination || '',
      });
    }
  }, [intake]);

  const update = (updates: Partial<FormData>) => setForm((prev) => ({ ...prev, ...updates }));

  const stepIdx = STEPS.findIndex((s) => s.key === activeStep);
  const goNext = () => stepIdx < STEPS.length - 1 && setActiveStep(STEPS[stepIdx + 1].key);
  const goBack = () => stepIdx > 0 && setActiveStep(STEPS[stepIdx - 1].key);

  // ── Generate compliance checklist ────────────────────────────
  const generateChecklist = (): NewComplianceItem[] => {
    const items: NewComplianceItem[] = [];
    if (form.has_domain === false) {
      items.push({
        category: 'domain',
        title: 'Register a business domain',
        description: 'Set up a professional domain name for your business website and email.',
        priority: 1,
        portal_link: '/portal/legalflow/digital-presence',
      });
    }
    if (form.is_registered === false) {
      items.push({
        category: 'registration',
        title: 'Register your business entity',
        description: 'File for LLC, S-Corp, or other entity type with your state.',
        priority: 2,
        portal_link: '/portal/legalflow/businesses',
      });
    }
    if (form.has_registered_agent === false) {
      items.push({
        category: 'registered_agent',
        title: 'Appoint a registered agent',
        description: 'Designate a registered agent for service of process in your state.',
        priority: 3,
        portal_link: '/portal/legalflow/legal',
      });
    }
    if (form.has_operating_agreement === false) {
      items.push({
        category: 'operating_agreement',
        title: 'Draft an operating agreement',
        description: 'Create an operating agreement to define your business structure and member responsibilities.',
        priority: 4,
        portal_link: '/portal/legalflow/legal',
      });
    }
    if (form.has_filed_trademark === false) {
      items.push({
        category: 'trademark',
        title: 'File a trademark',
        description: 'Protect your brand name by filing a trademark with the USPTO.',
        priority: 5,
        portal_link: '/portal/legalflow/trademark',
      });
    }
    return items;
  };

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      // Upload operating agreement if provided
      let opAgreeUrl = form.operating_agreement_url;
      if (file) {
        const path = `${user.id}/operating-agreement-${Date.now()}.pdf`;
        const { error: uploadErr } = await supabase.storage
          .from('intake-documents')
          .upload(path, file, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from('intake-documents')
            .getPublicUrl(path);
          opAgreeUrl = urlData.publicUrl;
        }
      }

      // Upsert intake
      await upsertIntake({ ...form, operating_agreement_url: opAgreeUrl || null });

      // Generate & replace compliance checklist
      const checklistItems = generateChecklist();
      await replaceAll(checklistItems);

      // Mark intake completed
      if (!isEditMode) {
        await markIntakeCompleted();
        refetchIntakeStatus();
      }

      navigate('/portal/apps');
    } catch (err) {
      console.error('Intake submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (intakeLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {isEditMode ? 'Update Business Information' : 'Welcome! Let\u2019s get you set up.'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isEditMode
            ? 'Update your business details below. Missing items will be refreshed on your compliance checklist.'
            : 'Tell us about your business so we can tailor our services and identify what you still need.'}
        </p>
      </div>

      {/* Stepper */}
      <div className="flex flex-wrap items-center gap-1 mb-8">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = step.key === activeStep;
          const isCompleted = i < stepIdx;
          return (
            <div key={step.key} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:block" />}
              <button
                onClick={() => setActiveStep(step.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200'
                    : isCompleted
                    ? 'bg-green-50 text-green-700'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Step content card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        {/* ── Step 1: Domain ──────────────────────────────── */}
        {activeStep === 'domain' && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Domain</h2>
            <p className="text-sm text-slate-500 mb-6">
              Do you already have a domain name for your business?
            </p>
            <YesNoRadio
              label="Do you have a domain?"
              value={form.has_domain}
              onChange={(v) => update({ has_domain: v })}
            />
            {form.has_domain === true && (
              <>
                <Input
                  label="Domain name"
                  value={form.domain_name}
                  onChange={(v) => update({ domain_name: v })}
                  placeholder="mybusiness.com"
                />
                <Select
                  label="Where is it hosted?"
                  value={form.domain_host}
                  onChange={(v) => update({ domain_host: v })}
                  options={DOMAIN_HOSTS}
                />
                {form.domain_host === 'other' && (
                  <Input
                    label="Hosting provider name"
                    value={form.domain_host_other}
                    onChange={(v) => update({ domain_host_other: v })}
                    placeholder="e.g. Bluehost, SquareSpace"
                  />
                )}
              </>
            )}
            {form.has_domain === false && (
              <MissingNote text="No worries! We'll help you register a domain." />
            )}
          </div>
        )}

        {/* ── Step 2: Registration ────────────────────────── */}
        {activeStep === 'registration' && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Business Registration</h2>
            <p className="text-sm text-slate-500 mb-6">
              Is your business entity officially registered with a state?
            </p>
            <YesNoRadio
              label="Is your business registered?"
              value={form.is_registered}
              onChange={(v) => update({ is_registered: v })}
            />
            {form.is_registered === true && (
              <>
                <Select
                  label="State of registration"
                  value={form.registration_state}
                  onChange={(v) => update({ registration_state: v })}
                  options={US_STATES.map((s) => ({ value: s, label: s }))}
                />
                <Select
                  label="Entity type"
                  value={form.entity_type}
                  onChange={(v) => update({ entity_type: v })}
                  options={ENTITY_TYPES}
                />
              </>
            )}
            {form.is_registered === false && (
              <MissingNote text="We'll guide you through the business registration process." />
            )}
          </div>
        )}

        {/* ── Step 3: Address ─────────────────────────────── */}
        {activeStep === 'address' && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Business Address</h2>
            <p className="text-sm text-slate-500 mb-6">
              Provide your business address, if applicable. This is optional.
            </p>
            <Input
              label="Address line 1"
              value={form.business_address_line1}
              onChange={(v) => update({ business_address_line1: v })}
              placeholder="123 Main St"
            />
            <Input
              label="Address line 2"
              value={form.business_address_line2}
              onChange={(v) => update({ business_address_line2: v })}
              placeholder="Suite 200"
            />
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="City"
                value={form.business_city}
                onChange={(v) => update({ business_city: v })}
              />
              <Select
                label="State"
                value={form.business_state}
                onChange={(v) => update({ business_state: v })}
                options={US_STATES.map((s) => ({ value: s, label: s }))}
              />
              <Input
                label="ZIP"
                value={form.business_zip}
                onChange={(v) => update({ business_zip: v })}
                placeholder="12345"
              />
            </div>
          </div>
        )}

        {/* ── Step 4: Registered Agent ────────────────────── */}
        {activeStep === 'agent' && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Registered Agent</h2>
            <p className="text-sm text-slate-500 mb-6">
              A registered agent receives legal documents on behalf of your business.
            </p>
            <YesNoRadio
              label="Do you have a registered agent?"
              value={form.has_registered_agent}
              onChange={(v) => update({ has_registered_agent: v })}
            />
            {form.has_registered_agent === true && (
              <>
                <Input
                  label="Agent name"
                  value={form.agent_name}
                  onChange={(v) => update({ agent_name: v })}
                  placeholder="John Smith or Registered Agent LLC"
                />
                <Input
                  label="Agent address"
                  value={form.agent_address_line1}
                  onChange={(v) => update({ agent_address_line1: v })}
                  placeholder="456 Oak Ave"
                />
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="City"
                    value={form.agent_address_city}
                    onChange={(v) => update({ agent_address_city: v })}
                  />
                  <Select
                    label="State"
                    value={form.agent_address_state}
                    onChange={(v) => update({ agent_address_state: v })}
                    options={US_STATES.map((s) => ({ value: s, label: s }))}
                  />
                  <Input
                    label="ZIP"
                    value={form.agent_address_zip}
                    onChange={(v) => update({ agent_address_zip: v })}
                    placeholder="12345"
                  />
                </div>
              </>
            )}
            {form.has_registered_agent === false && (
              <MissingNote text="We can help you appoint a registered agent." />
            )}
          </div>
        )}

        {/* ── Step 5: Operating Agreement ─────────────────── */}
        {activeStep === 'agreement' && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Operating Agreement</h2>
            <p className="text-sm text-slate-500 mb-6">
              An operating agreement defines your business structure, ownership, and responsibilities.
            </p>
            <YesNoRadio
              label="Do you have an operating agreement?"
              value={form.has_operating_agreement}
              onChange={(v) => update({ has_operating_agreement: v })}
            />
            {form.has_operating_agreement === true && (
              <div className="mt-4">
                <span className="text-sm font-medium text-slate-700">Upload a copy (PDF, optional)</span>
                <label className="mt-1 flex items-center gap-2 cursor-pointer">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors">
                    <Upload className="w-4 h-4" />
                    {file ? file.name : form.operating_agreement_url ? 'Replace file' : 'Choose file'}
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {form.operating_agreement_url && !file && (
                  <p className="mt-2 text-xs text-green-600">Previously uploaded file on record.</p>
                )}
              </div>
            )}
            {form.has_operating_agreement === false && (
              <MissingNote text="We can help you draft an operating agreement using AI." />
            )}
          </div>
        )}

        {/* ── Step 6: Trademark ───────────────────────────── */}
        {activeStep === 'trademark' && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Trademark</h2>
            <p className="text-sm text-slate-500 mb-6">
              A trademark protects your brand name, logo, or slogan.
            </p>
            <YesNoRadio
              label="Have you filed a trademark?"
              value={form.has_filed_trademark}
              onChange={(v) => update({ has_filed_trademark: v })}
            />
            {form.has_filed_trademark === true && (
              <>
                <Input
                  label="Trademark / mark name"
                  value={form.trademark_name}
                  onChange={(v) => update({ trademark_name: v })}
                  placeholder="My Brand Name"
                />
                <Select
                  label="Current status"
                  value={form.trademark_status}
                  onChange={(v) => update({ trademark_status: v })}
                  options={TRADEMARK_STATUSES}
                />
              </>
            )}
            {form.has_filed_trademark === false && (
              <MissingNote text="We can help you search for and file a trademark with the USPTO." />
            )}
          </div>
        )}

        {/* ── Step 7: State of Origination ────────────────── */}
        {activeStep === 'state' && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Preferred State of Origination</h2>
            <p className="text-sm text-slate-500 mb-6">
              Which state would you like to use as your primary state of business origination?
            </p>
            <Select
              label="State"
              value={form.preferred_state_of_origination}
              onChange={(v) => update({ preferred_state_of_origination: v })}
              options={US_STATES.map((s) => ({ value: s, label: s }))}
            />
          </div>
        )}

        {/* ── Step 8: Review ──────────────────────────────── */}
        {activeStep === 'review' && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Review Your Information</h2>
            <p className="text-sm text-slate-500 mb-6">
              Please review your answers. Click any section to go back and edit.
            </p>

            <div className="space-y-4">
              <ReviewSection
                title="Domain"
                status={form.has_domain}
                onClick={() => setActiveStep('domain')}
              >
                {form.has_domain
                  ? `${form.domain_name} (hosted at ${form.domain_host === 'other' ? form.domain_host_other : form.domain_host})`
                  : 'Not yet — will be added to checklist'}
              </ReviewSection>

              <ReviewSection
                title="Business Registration"
                status={form.is_registered}
                onClick={() => setActiveStep('registration')}
              >
                {form.is_registered
                  ? `${ENTITY_TYPES.find((e) => e.value === form.entity_type)?.label || form.entity_type} in ${form.registration_state}`
                  : 'Not yet — will be added to checklist'}
              </ReviewSection>

              <ReviewSection
                title="Business Address"
                status={form.business_address_line1 ? true : null}
                onClick={() => setActiveStep('address')}
              >
                {form.business_address_line1
                  ? `${form.business_address_line1}, ${form.business_city}, ${form.business_state} ${form.business_zip}`
                  : 'Not provided (optional)'}
              </ReviewSection>

              <ReviewSection
                title="Registered Agent"
                status={form.has_registered_agent}
                onClick={() => setActiveStep('agent')}
              >
                {form.has_registered_agent
                  ? form.agent_name
                  : 'Not yet — will be added to checklist'}
              </ReviewSection>

              <ReviewSection
                title="Operating Agreement"
                status={form.has_operating_agreement}
                onClick={() => setActiveStep('agreement')}
              >
                {form.has_operating_agreement
                  ? file ? `Uploading: ${file.name}` : form.operating_agreement_url ? 'On file' : 'Yes (no file uploaded)'
                  : 'Not yet — will be added to checklist'}
              </ReviewSection>

              <ReviewSection
                title="Trademark"
                status={form.has_filed_trademark}
                onClick={() => setActiveStep('trademark')}
              >
                {form.has_filed_trademark
                  ? `${form.trademark_name} — ${TRADEMARK_STATUSES.find((s) => s.value === form.trademark_status)?.label || form.trademark_status}`
                  : 'Not yet — will be added to checklist'}
              </ReviewSection>

              <ReviewSection
                title="State of Origination"
                status={form.preferred_state_of_origination ? true : null}
                onClick={() => setActiveStep('state')}
              >
                {form.preferred_state_of_origination || 'Not selected'}
              </ReviewSection>
            </div>

            {/* Compliance preview */}
            {generateChecklist().length > 0 && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm font-medium text-amber-800 mb-2">
                  The following items will be added to your compliance checklist:
                </p>
                <ul className="space-y-1">
                  {generateChecklist().map((item) => (
                    <li key={item.category} className="flex items-center gap-2 text-sm text-amber-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {item.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-6 w-full btn-primary justify-center flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : isEditMode ? (
                'Update Information'
              ) : (
                'Complete Setup'
              )}
            </button>
          </div>
        )}

        {/* Navigation */}
        {activeStep !== 'review' && (
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={goBack}
              disabled={stepIdx === 0}
              className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={goNext} className="btn-primary flex items-center gap-2 text-sm">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
        {activeStep === 'review' && (
          <div className="mt-4">
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Review section helper ──────────────────────────────────────
function ReviewSection({
  title,
  status,
  onClick,
  children,
}: {
  title: string;
  status: boolean | null;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-start gap-3"
    >
      <div className="mt-0.5">
        {status === true && <CheckCircle2 className="w-5 h-5 text-green-500" />}
        {status === false && <div className="w-5 h-5 rounded-full border-2 border-amber-400 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-amber-400" /></div>}
        {status === null && <div className="w-5 h-5 rounded-full border-2 border-slate-300" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-sm text-slate-500 mt-0.5">{children}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400 mt-0.5" />
    </button>
  );
}
