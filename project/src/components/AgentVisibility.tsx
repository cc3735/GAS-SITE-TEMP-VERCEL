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

  if (loading) return <div className="p-4 text-gray-400">Loading agent status...</div>;
  if (error) return <div className="p-4 text-red-500">Error loading agents</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map(agent => (
          <div key={agent.agentId} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  agent.status === 'active' ? 'bg-green-500' :
                  agent.status === 'processing' ? 'bg-yellow-500' :
                  agent.status === 'error' ? 'bg-red-500' :
                  'bg-gray-500'
                }`} />
                <div>
                  <h3 className="font-semibold text-white">{agent.agentName}</h3>
                  <p className="text-xs text-gray-400">{agent.statusContext}</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-white">
                <MoreHorizontal size={16} />
              </button>
            </div>

            {agent.status === 'active' && (
              <div className="mb-4">
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 animate-pulse w-2/3" />
                </div>
              </div>
            )}

            {showMetrics && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-900/50 p-2 rounded">
                  <p className="text-gray-500">Success Rate</p>
                  <p className="font-medium text-green-400">{agent.successRate}%</p>
                </div>
                <div className="bg-gray-900/50 p-2 rounded">
                  <p className="text-gray-500">Avg Time</p>
                  <p className="font-medium text-white">{agent.avgResponseTime}s</p>
                </div>
                <div className="bg-gray-900/50 p-2 rounded">
                  <p className="text-gray-500">Cost/Msg</p>
                  <p className="font-medium text-white">${agent.costPerInteraction}</p>
                </div>
                <div className="bg-gray-900/50 p-2 rounded">
                  <p className="text-gray-500">CSAT</p>
                  <p className="font-medium text-purple-400">{agent.customerSatisfaction}</p>
                </div>
              </div>
            )}
            
            <div className="mt-4 flex space-x-2">
               <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-xs py-1.5 rounded text-white flex items-center justify-center space-x-1">
                 <Pause size={12} /> <span>Pause</span>
               </button>
               <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-xs py-1.5 rounded text-white flex items-center justify-center space-x-1">
                 <Settings size={12} /> <span>Config</span>
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Live Transcripts Section Placeholder */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
            <Activity size={16} className="mr-2 text-blue-400" /> Live Interactions
        </h3>
        <div className="space-y-2">
            {[1, 2].map((i) => (
                <div key={i} className="bg-gray-900/50 p-3 rounded text-sm border-l-2 border-green-500">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Agent Alpha vs. Customer #{100+i}</span>
                        <span>Just now</span>
                    </div>
                    <p className="text-gray-300">"I can definitely help you with that refund. Could you please confirm your order number?"</p>
                    <button className="mt-2 text-blue-400 hover:text-blue-300 text-xs">Take Over Conversation</button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AgentVisibility;
