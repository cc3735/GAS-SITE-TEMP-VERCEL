import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function OSLogin() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAccessDenied(false);
    setIsSubmitting(true);

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError);
      setIsSubmitting(false);
      return;
    }

    // Check staff access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Authentication failed. Please try again.');
      setIsSubmitting(false);
      return;
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_gas_staff')
      .eq('id', user.id)
      .single();

    if (profile?.is_gas_staff) {
      navigate('/os');
    } else {
      setAccessDenied(true);
      setIsSubmitting(false);
    }
  };

  const INPUT_CLASS =
    'w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src="/logo.png" alt="GAS-OS" className="h-20 w-auto brightness-0 invert" />
          <p className="text-base font-semibold text-white leading-none">GAS-OS</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h1 className="text-lg font-semibold text-white mb-1">Staff Sign In</h1>
          <p className="text-sm text-gray-400 mb-5">Sign in to access the operating system.</p>

          {/* Access denied state */}
          {accessDenied && (
            <div className="mb-5 p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
              <p className="text-sm text-red-400 font-medium mb-1">Access Denied</p>
              <p className="text-xs text-red-400/70 mb-3">
                You don't have access to GAS-OS. Contact an administrator if you believe this is an error.
              </p>
              <Link
                to="/portal/apps"
                className="inline-flex text-xs font-medium text-primary-400 hover:text-primary-300"
              >
                Go to GAS Client Portal &rarr;
              </Link>
            </div>
          )}

          {/* Generic error */}
          {error && !accessDenied && (
            <div className="mb-5 p-3 bg-red-900/20 border border-red-800/50 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLASS}
                placeholder="you@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={INPUT_CLASS}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-xs text-gray-500">or</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          {/* Google Sign In */}
          <button
            onClick={signInWithGoogle}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-gray-600">
          Not a staff member?{' '}
          <Link to="/login" className="text-gray-400 hover:text-white">
            Client login
          </Link>
        </p>
      </div>
    </div>
  );
}
