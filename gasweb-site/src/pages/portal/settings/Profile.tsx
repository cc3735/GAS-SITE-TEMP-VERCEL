import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, PenLine } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { useClientIntake } from '../../../hooks/useClientIntake';

const ENTITY_LABELS: Record<string, string> = {
  llc: 'LLC',
  s_corp: 'S-Corp',
  c_corp: 'C-Corp',
  partnership: 'Partnership',
  sole_prop: 'Sole Proprietorship',
};

export default function Profile() {
  const { user } = useAuth();
  const { intake } = useClientIntake();
  const [fullName, setFullName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFullName((user?.user_metadata?.full_name as string) || '');
  }, [user]);

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user?.email?.[0].toUpperCase() || '?';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });

    if (error) {
      setError(error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-8">
      {/* Avatar */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Avatar</h2>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{fullName || 'No name set'}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <p className="text-xs text-slate-400 mt-1">Avatar is generated from your initials.</p>
          </div>
        </div>
      </section>

      {/* Personal info */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-5">Personal Information</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-slate-400">Email cannot be changed here.</p>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" /> Saved
              </>
            ) : isSaving ? (
              'Saving…'
            ) : (
              'Save changes'
            )}
          </button>
        </form>
      </section>
      {/* Business Information */}
      {intake && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Business Information</h2>
            <Link
              to="/portal/intake"
              className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <PenLine className="w-3.5 h-3.5" /> Edit
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Domain</p>
              <p className="font-medium text-slate-900">
                {intake.has_domain ? intake.domain_name || 'Yes' : 'Not registered'}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Business Registration</p>
              <p className="font-medium text-slate-900">
                {intake.is_registered
                  ? `${ENTITY_LABELS[intake.entity_type || ''] || intake.entity_type} in ${intake.registration_state}`
                  : 'Not registered'}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Registered Agent</p>
              <p className="font-medium text-slate-900">
                {intake.has_registered_agent ? intake.agent_name || 'Yes' : 'Not appointed'}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Operating Agreement</p>
              <p className="font-medium text-slate-900">
                {intake.has_operating_agreement ? 'On file' : 'Not drafted'}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Trademark</p>
              <p className="font-medium text-slate-900">
                {intake.has_filed_trademark ? `${intake.trademark_name} (${intake.trademark_status})` : 'Not filed'}
              </p>
            </div>
            <div>
              <p className="text-slate-500">State of Origination</p>
              <p className="font-medium text-slate-900">
                {intake.preferred_state_of_origination || 'Not selected'}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
