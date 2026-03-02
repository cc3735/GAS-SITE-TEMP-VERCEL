import { useState } from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

export default function Security() {
  const { user, signOut } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');

    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }

    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwError(error.message);
    } else {
      setPwSaved(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwSaved(false), 3000);
    }
    setPwSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.email) return;
    await signOut();
  };

  const lastSignIn = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString()
    : 'Unknown';

  return (
    <div className="space-y-6">
      {/* Last sign-in info */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-3">Sign-in Activity</h2>
        <p className="text-sm text-slate-600">
          Last sign-in: <span className="font-medium text-slate-900">{lastSignIn}</span>
        </p>
        <p className="text-sm text-slate-600 mt-1">
          Signed in as: <span className="font-medium text-slate-900">{user?.email}</span>
        </p>
      </section>

      {/* Change password */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-5">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New password</label>
            <input
              type="password"
              value={newPassword}
              minLength={8}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="8+ characters"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {pwError && <p className="text-sm text-red-600">{pwError}</p>}

          <button
            type="submit"
            disabled={pwSaving || !newPassword}
            className="btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            {pwSaved ? (
              <><Check className="w-4 h-4" /> Password updated</>
            ) : pwSaving ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>

      {/* Delete account */}
      <section className="bg-white rounded-2xl border border-red-200 p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold text-slate-900">Delete Account</h2>
            <p className="text-sm text-slate-500 mt-1">
              Permanently delete your account and cancel all subscriptions. This cannot be undone.
            </p>
          </div>
        </div>

        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            className="text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 rounded-lg px-4 py-2 hover:bg-red-50 transition-colors"
          >
            Delete my account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Type your email <span className="font-mono font-medium">{user?.email}</span> to confirm:
            </p>
            <input
              type="email"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={user?.email}
              className="w-full px-4 py-2.5 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== user?.email}
                className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg px-4 py-2 transition-colors"
              >
                Confirm deletion
              </button>
              <button
                onClick={() => { setShowDelete(false); setDeleteConfirm(''); }}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-4 py-2 transition-colors"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Need help instead?{' '}
              <a href="mailto:contact@gasweb.info" className="text-primary-600 hover:underline">
                Contact support
              </a>
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
