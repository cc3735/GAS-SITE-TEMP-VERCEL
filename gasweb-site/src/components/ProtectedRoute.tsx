import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, intakeCompleted, isGasStaff } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to intake if not completed (staff skip)
  if (!intakeCompleted && !isGasStaff && !location.pathname.startsWith('/portal/intake')) {
    return <Navigate to="/portal/intake" replace />;
  }

  return <>{children}</>;
}
