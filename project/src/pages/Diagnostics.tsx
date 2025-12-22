import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { useAgents } from '../hooks/useAgents';

export default function Diagnostics() {
  const { user, loading: authLoading } = useAuth();
  const { currentOrganization, loading: orgLoading, organizations } = useOrganization();
  const { agents, loading: agentsLoading } = useAgents();

  return (
    <div className="p-8 space-y-8 bg-white m-4 rounded shadow">
      <h1 className="text-2xl font-bold">Diagnostics</h1>
      
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">1. Auth State</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify({ 
            authLoading, 
            userEmail: user?.email, 
            userId: user?.id 
          }, null, 2)}
        </pre>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">2. Organization State</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify({ 
            orgLoading, 
            currentOrganizationId: currentOrganization?.id,
            currentOrganizationName: currentOrganization?.name,
            totalOrgs: organizations.length
          }, null, 2)}
        </pre>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">3. Agents Hook State</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify({ 
            agentsLoading, 
            totalAgents: agents.length 
          }, null, 2)}
        </pre>
      </section>
    </div>
  );
}
