import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

interface Business {
  id: string;
  name: string;
  industry: string | null;
  ein: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  state_of_registration: string | null;
  point_of_contact: string | null;
  registered_agent_name: string | null;
  registered_agent_address: string | null;
  created_at: string;
}

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'District of Columbia','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota',
  'Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey',
  'New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon',
  'Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah',
  'Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming',
];

const INPUT =
  'w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm';
const LABEL = 'block text-sm font-medium text-slate-700 mb-1';

const emptyForm = {
  name: '',
  industry: '',
  ein: '',
  address: '',
  phone: '',
  email: '',
  state_of_registration: '',
  point_of_contact: '',
  registered_agent_name: '',
  registered_agent_address: '',
};

type FormData = typeof emptyForm;

function BusinessForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Business;
  onSave: (data: FormData) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormData>(
    initial
      ? {
          name: initial.name,
          industry: initial.industry ?? '',
          ein: initial.ein ?? '',
          address: initial.address ?? '',
          phone: initial.phone ?? '',
          email: initial.email ?? '',
          state_of_registration: initial.state_of_registration ?? '',
          point_of_contact: initial.point_of_contact ?? '',
          registered_agent_name: initial.registered_agent_name ?? '',
          registered_agent_address: initial.registered_agent_address ?? '',
        }
      : { ...emptyForm },
  );

  const set =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5"
    >
      <h2 className="text-lg font-semibold text-slate-900">
        {initial ? 'Edit Business' : 'Add New Business'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>
            Business Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={set('name')}
            className={INPUT}
            placeholder="e.g. Acme Corp LLC"
            required
          />
        </div>
        <div>
          <label className={LABEL}>Industry</label>
          <input
            type="text"
            value={form.industry}
            onChange={set('industry')}
            className={INPUT}
            placeholder="e.g. Technology, Retail, Healthcare"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>EIN</label>
          <input
            type="text"
            value={form.ein}
            onChange={set('ein')}
            className={INPUT}
            placeholder="XX-XXXXXXX"
            maxLength={10}
          />
        </div>
        <div>
          <label className={LABEL}>State of Registration</label>
          <select
            value={form.state_of_registration}
            onChange={set('state_of_registration')}
            className={INPUT}
          >
            <option value="">Select state...</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={LABEL}>Business Address</label>
        <input
          type="text"
          value={form.address}
          onChange={set('address')}
          className={INPUT}
          placeholder="123 Main St, Suite 100, City, State, ZIP"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            className={INPUT}
            placeholder="(555) 555-5555"
          />
        </div>
        <div>
          <label className={LABEL}>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            className={INPUT}
            placeholder="info@company.com"
          />
        </div>
      </div>

      <div>
        <label className={LABEL}>Point of Contact</label>
        <input
          type="text"
          value={form.point_of_contact}
          onChange={set('point_of_contact')}
          className={INPUT}
          placeholder="Full name and title"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Registered Agent Name</label>
          <input
            type="text"
            value={form.registered_agent_name}
            onChange={set('registered_agent_name')}
            className={INPUT}
            placeholder="e.g. John Smith or CT Corporation"
          />
        </div>
        <div>
          <label className={LABEL}>Registered Agent Address</label>
          <input
            type="text"
            value={form.registered_agent_address}
            onChange={set('registered_agent_address')}
            className={INPUT}
            placeholder="123 Agent St, City, State, ZIP"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {initial ? 'Save Changes' : 'Add Business'}
        </button>
      </div>
    </form>
  );
}

function BusinessCard({
  business,
  onEdit,
  onDelete,
}: {
  business: Business;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const details = [
    { label: 'EIN', value: business.ein },
    { label: 'Address', value: business.address },
    { label: 'Phone', value: business.phone },
    { label: 'Email', value: business.email },
    { label: 'State of Registration', value: business.state_of_registration },
    { label: 'Point of Contact', value: business.point_of_contact },
    { label: 'Registered Agent', value: business.registered_agent_name },
    { label: 'Agent Address', value: business.registered_agent_address },
  ].filter((d) => d.value);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-slate-600" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">{business.name}</p>
            {business.industry && (
              <p className="text-sm text-slate-500">{business.industry}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {details.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && details.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 border-t border-slate-100 pt-4">
          {details.map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
              <p className="text-sm text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LegalFlowBusinesses() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editing, setEditing] = useState<Business | undefined>();
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setBusinesses(data ?? []);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleSave = async (form: FormData) => {
    if (!user) return;
    setSaving(true);
    if (editing) {
      await supabase.from('businesses').update(form).eq('id', editing.id);
    } else {
      await supabase.from('businesses').insert({ ...form, user_id: user.id });
    }
    setSaving(false);
    setIsCreating(false);
    setEditing(undefined);
    await fetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this business? This cannot be undone.')) return;
    await supabase.from('businesses').delete().eq('id', id);
    await fetch();
  };

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
        <span className="text-sm font-medium text-slate-900">Businesses</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Businesses</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your registered business entities and filings.
          </p>
        </div>
        {!isCreating && !editing && (
          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Business
          </button>
        )}
      </div>

      {/* Form */}
      {(isCreating || editing) && (
        <div className="mb-6">
          <BusinessForm
            initial={editing}
            onSave={handleSave}
            onCancel={() => {
              setIsCreating(false);
              setEditing(undefined);
            }}
            saving={saving}
          />
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      ) : businesses.length > 0 ? (
        <div className="space-y-3">
          {businesses.map((biz) => (
            <BusinessCard
              key={biz.id}
              business={biz}
              onEdit={() => {
                setIsCreating(false);
                setEditing(biz);
              }}
              onDelete={() => handleDelete(biz.id)}
            />
          ))}
        </div>
      ) : (
        !isCreating && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center bg-white">
            <Building2 className="mx-auto w-10 h-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">No businesses yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Add your first business entity to get started.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-5 btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Business
            </button>
          </div>
        )
      )}
    </div>
  );
}
