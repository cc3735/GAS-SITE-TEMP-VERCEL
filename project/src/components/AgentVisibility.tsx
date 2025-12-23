import React from 'react';
import { useAgentPerformance } from '../hooks/useAgentPerformance';
import { Activity, Clock, DollarSign, Smile, MoreHorizontal, Pause, Play, Settings } from 'lucide-react';

interface AgentVisibilityProps {
  organizationId: string;
  showMetrics?: boolean;
  maxTranscripts?: number;
}

const AgentVisibility: React.FC<AgentVisibilityProps> = ({ organizationId, showMetrics = true, maxTranscripts = 3 }) => {
  const { agents, loading, error } = useAgentPerformance(organizationId);

  if (loading) return <div className="p-4 text-subtle">Loading agent status...</div>;
  if (error) return <div className="p-4 text-red-500">Error loading agents</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map(agent => (
          <div key={agent.agentId} className="bg-surface rounded-lg p-4 border border-border shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  agent.status === 'active' ? 'bg-green-500' :
                  agent.status === 'processing' ? 'bg-yellow-500' :
                  agent.status === 'error' ? 'bg-red-500' :
                  'bg-subtle'
                }`} />
                <div>
                  <h3 className="font-semibold text-primary">{agent.agentName}</h3>
                  <p className="text-xs text-secondary">{agent.statusContext}</p>
                </div>
              </div>
              <button className="text-secondary hover:text-primary transition-colors">
                <MoreHorizontal size={16} />
              </button>
            </div>

            {agent.status === 'active' && (
              <div className="mb-4">
                <div className="h-1 bg-surface-hover rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 animate-pulse w-2/3" />
                </div>
              </div>
            )}

            {showMetrics && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-surface-hover p-2 rounded">
                  <p className="text-subtle">Success Rate</p>
                  <p className="font-medium text-green-500">{agent.successRate}%</p>
                </div>
                <div className="bg-surface-hover p-2 rounded">
                  <p className="text-subtle">Avg Time</p>
                  <p className="font-medium text-primary">{agent.avgResponseTime}s</p>
                </div>
                <div className="bg-surface-hover p-2 rounded">
                  <p className="text-subtle">Cost/Msg</p>
                  <p className="font-medium text-primary">${agent.costPerInteraction}</p>
                </div>
                <div className="bg-surface-hover p-2 rounded">
                  <p className="text-subtle">CSAT</p>
                  <p className="font-medium text-purple-500">{agent.customerSatisfaction}</p>
                </div>
              </div>
            )}
            
            <div className="mt-4 flex space-x-2">
               <button className="flex-1 bg-surface-hover hover:bg-border text-xs py-1.5 rounded text-primary flex items-center justify-center space-x-1 transition-colors border border-border">
                 <Pause size={12} /> <span>Pause</span>
               </button>
               <button className="flex-1 bg-surface-hover hover:bg-border text-xs py-1.5 rounded text-primary flex items-center justify-center space-x-1 transition-colors border border-border">
                 <Settings size={12} /> <span>Config</span>
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Live Transcripts Section Placeholder */}
      <div className="bg-surface rounded-lg border border-border p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-primary mb-3 flex items-center">
            <Activity size={16} className="mr-2 text-accent" /> Live Interactions
        </h3>
        <div className="space-y-2">
            {[1, 2].map((i) => (
                <div key={i} className="bg-surface-hover p-3 rounded text-sm border-l-2 border-green-500">
                    <div className="flex justify-between text-xs text-subtle mb-1">
                        <span>Agent Alpha vs. Customer #{100+i}</span>
                        <span>Just now</span>
                    </div>
                    <p className="text-secondary">"I can definitely help you with that refund. Could you please confirm your order number?"</p>
                    <button className="mt-2 text-accent hover:text-accent-hover text-xs">Take Over Conversation</button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AgentVisibility;
