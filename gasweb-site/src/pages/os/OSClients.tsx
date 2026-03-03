import { Navigate, useSearchParams } from 'react-router-dom';

export default function OSClients() {
  const [sp] = useSearchParams();
  const app = sp.get('app');
  return <Navigate to={app ? `/os/crm?tab=clients&app=${app}` : '/os/crm?tab=clients'} replace />;
}
