import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function OSAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('OSAuthCallback effect running');
    const handleCallback = async () => {
      try {
        console.log('Getting session...');
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          navigate('/os/login');
          return;
        }

        if (data.session) {
          const user = data.session.user;
          console.log('Session found', { user: user.id });

          // Check if user is GAS staff
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('is_gas_staff')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('Error fetching user profile:', profileError);
            navigate('/os/login');
            return;
          }

          if (profile?.is_gas_staff) {
            console.log('User is GAS staff, redirecting to /os');
            navigate('/os');
          } else {
            console.log('User is not GAS staff, redirecting to /portal/apps');
            navigate('/portal/apps');
          }
        } else {
          console.log('No session found, redirecting to login');
          navigate('/os/login');
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        navigate('/os/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
        <p className="text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}
