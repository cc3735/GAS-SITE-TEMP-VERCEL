import { useState, useEffect } from 'react';
import { AgentPerformance } from '../types/missionControl';
import { supabase } from '../lib/supabase';

export function useAgentPerformance(organizationId: string) {
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // In a real implementation, this would subscribe to Supabase
    // For now, we'll return mock data to visualize the UI
    const fetchAgents = async () => {
      try {
        setLoading(true);
        // Mock data
        const mockAgents: AgentPerformance[] = [
          {
            agentId: '1',
            agentName: 'Voice Agent - Alpha',
            status: 'active',
            statusContext: 'Talking - 2:34',
            activeConversations: 1,
            successRate: 98.5,
            avgResponseTime: 1.2,
            costPerInteraction: 0.15,
            customerSatisfaction: 9.2,
            lastActivity: new Date().toISOString()
          },
          {
            agentId: '2',
            agentName: 'Chatbot - Beta',
            status: 'processing',
            statusContext: 'Handling 3 conversations',
            activeConversations: 3,
            successRate: 95.0,
            avgResponseTime: 0.8,
            costPerInteraction: 0.05,
            customerSatisfaction: 8.8,
            lastActivity: new Date().toISOString()
          },
          {
            agentId: '3',
            agentName: 'Support Bot',
            status: 'idle',
            statusContext: 'Waiting for tickets',
            activeConversations: 0,
            successRate: 99.0,
            avgResponseTime: 0.5,
            costPerInteraction: 0.02,
            customerSatisfaction: 9.5,
            lastActivity: new Date().toISOString()
          }
        ];
        setAgents(mockAgents);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [organizationId]);

  return { agents, loading, error };
}
