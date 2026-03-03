import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function GasStaffRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [isStaff, setIsStaff] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_profiles')
      .select('is_gas_staff')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setIsStaff(data?.is_gas_staff ?? false);
      });
  }, [user]);

  if (isLoading || (user && isStaff === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/os/login" replace />;
  if (!isStaff) return <Navigate to="/portal/apps" replace />;

  return <>{children}</>;
}
