import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { useAuth } from '../contexts/AuthContext';

interface Agent {
  id: string;
  name: string;
  description: string | null;
  agent_type: string;
  status: string | null;
  configuration: any;
  knowledge_base: any;
  performance_metrics: any;
  created_at: string | null;
}

export function useAgents() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrganization) return;

    fetchAgents();

    const subscription = supabase
      .channel('agents_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_agents',
          filter: `organization_id=eq.${currentOrganization.id}`,
        },
        () => {
          fetchAgents();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentOrganization]);

  const fetchAgents = async () => {
    if (!currentOrganization) return;

    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async (agentData: {
    name: string;
    description?: string;
    agent_type: string;
    configuration?: any;
  }) => {
    if (!currentOrganization || !user) return null;

    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .insert({
          organization_id: currentOrganization.id,
          name: agentData.name,
          description: agentData.description || null,
          agent_type: agentData.agent_type,
          status: 'active',
          configuration: agentData.configuration || {},
          knowledge_base: agentData.configuration ? {
            referenceLinks: agentData.configuration.referenceLinks || [],
            uploadedFiles: agentData.configuration.uploadedFiles || [],
            promptTemplate: agentData.configuration.promptTemplate || '',
            memorySize: agentData.configuration.memorySize || 1000
          } : null,
          performance_metrics: { tasks_completed: 0, tokens_used: 0, success_rate: 100 },
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  };

  const updateAgent = async (agentId: string, updates: Partial<Agent>) => {
    if (!currentOrganization) return null;

    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .update({
          name: updates.name,
          description: updates.description,
          agent_type: updates.agent_type,
          status: updates.status,
          configuration: updates.configuration,
          knowledge_base: updates.knowledge_base,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agentId)
        .eq('organization_id', currentOrganization.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating agent:', error);
      throw error;
    }
  };

  const deleteAgent = async (agentId: string) => {
    if (!currentOrganization) return null;

    try {
      const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', agentId)
        .eq('organization_id', currentOrganization.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting agent:', error);
      throw error;
    }
  };

  return { agents, loading, createAgent, updateAgent, deleteAgent, refetch: fetchAgents };
}
