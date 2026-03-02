import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

interface NotificationPrefs {
  marketing: boolean;
  product_updates: boolean;
  billing_alerts: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  marketing: true,
  product_updates: true,
  billing_alerts: true,
};

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
        checked ? 'bg-primary-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function Notifications() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = user?.user_metadata?.notifications as NotificationPrefs | undefined;
    if (stored) setPrefs({ ...DEFAULT_PREFS, ...stored });
  }, [user]);

  const setField = (key: keyof NotificationPrefs, val: boolean) => {
    setPrefs((p) => ({ ...p, [key]: val }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await supabase.auth.updateUser({ data: { notifications: prefs } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setIsSaving(false);
  };

  const items: { key: keyof NotificationPrefs; label: string; description: string }[] = [
    {
      key: 'marketing',
      label: 'Marketing emails',
      description: 'News, promotions, and product announcements from GAS.',
    },
    {
      key: 'product_updates',
      label: 'Product updates',
      description: 'Release notes and new features for apps you use.',
    },
    {
      key: 'billing_alerts',
      label: 'Billing alerts',
      description: 'Invoices, payment confirmations, and subscription reminders.',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-5">Email Notifications</h2>
        <div className="space-y-5">
          {items.map(({ key, label, description }) => (
            <div key={key} className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-slate-900">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
              </div>
              <Toggle checked={prefs[key]} onChange={(val) => setField(key, val)} />
            </div>
          ))}
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            {saved ? (
              <><Check className="w-4 h-4" /> Saved</>
            ) : isSaving ? 'Saving…' : 'Save preferences'}
          </button>
        </div>
      </section>
    </div>
  );
}
