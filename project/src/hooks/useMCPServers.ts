import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { useAuth } from '../contexts/AuthContext';

interface MCPServer {
  id: string;
  name: string;
  description: string | null;
  server_type: string;
  endpoint_url: string | null;
  status: string;
  health_status: string;
  version: string | null;
  capabilities: any;
  created_at: string;
}

export function useMCPServers() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrganization) {
        setLoading(false);
        return;
    }

    fetchServers();

    const subscription = supabase
      .channel('mcp_servers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mcp_servers',
          filter: `organization_id=eq.${currentOrganization.id}`,
        },
        () => {
          fetchServers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentOrganization]);

  const fetchServers = async () => {
    if (!currentOrganization) {
        setLoading(false);
        return;
    }

    try {
      const { data, error } = await supabase
        .from('mcp_servers')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServers(data || []);
    } catch (error) {
      console.error('Error fetching MCP servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const createServer = async (serverData: {
    name: string;
    description?: string;
    server_type: string;
    endpoint_url?: string;
  }) => {
    if (!currentOrganization || !user) return null;

    try {
      const { data, error } = await supabase
        .from('mcp_servers')
        .insert({
          organization_id: currentOrganization.id,
          name: serverData.name,
          description: serverData.description || null,
          server_type: serverData.server_type,
          endpoint_url: serverData.endpoint_url || null,
          status: 'active',
          health_status: 'healthy',
          capabilities: {},
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating MCP server:', error);
      throw error;
    }
  };

  return { servers, loading, createServer, refetch: fetchServers };
}
