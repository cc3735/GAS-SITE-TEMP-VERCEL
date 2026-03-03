import { Navigate } from 'react-router-dom';

export default function OSMCP() {
  return <Navigate to="/os/agents?tab=mcp" replace />;
}
