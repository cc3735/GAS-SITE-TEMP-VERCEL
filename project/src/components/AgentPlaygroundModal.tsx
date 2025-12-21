import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Terminal, Loader2, Bot, Send, RefreshCw } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface AgentPlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: any;
}

/**
 * LogEntry interface for the simulated terminal output.
 * type: determines the color of the log in the UI.
 */
interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'system';
}

/**
 * AgentPlaygroundModal Component
 * 
 * A simulation environment that mimics the execution of an AI agent.
 * It provides a "Terminal" view for logs and a "Result Output" area.
 * 
 * Key Features:
 * - Simulates network delays and processing steps (Intent Analysis -> Knowledge Retrieval -> Model Query).
 * - Auto-scrolling terminal logs.
 * - Generates mock output based on the agent's type (Content vs Operating).
 */
export default function AgentPlaygroundModal({ isOpen, onClose, agent }: AgentPlaygroundModalProps) {
  const [prompt, setPrompt] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  // Reset state when opening/closing or changing agents to ensure a fresh session.
  useEffect(() => {
    if (isOpen) {
      setLogs([{ 
        timestamp: new Date().toLocaleTimeString(),
        message: `System initialized. Ready to run agent: ${agent?.name || 'Unknown Agent'}`, 
        type: 'system'
      }]);
      setOutput('');
      setPrompt('');
      setIsRunning(false);
    }
  }, [isOpen, agent]);

  // Auto-scroll logs to the bottom whenever a new log entry is added.
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  /**
   * Helper function to add a log entry with a timestamp.
   */
  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'system' = 'info') => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  };

  /**
   * handleRun executes the simulation cycle.
   * It uses `setTimeout` to mimic the asynchronous nature of real AI processing.
   */
  const handleRun = async () => {
    if (!prompt.trim()) return;
    
    setIsRunning(true);
    setOutput('');
    setLogs([
      {
        timestamp: new Date().toLocaleTimeString(),
        message: `Starting execution cycle for: ${agent.name}`,
        type: 'system'
      }
    ]);

    addLog(`Input received: "${prompt}"`, 'info');

    // Simulation steps: These represent the actual backend steps of an AI Agent.
    const steps = [
      { msg: 'Analyzing intent and context...', delay: 800 },
      { msg: 'Retrieving relevant knowledge base documents...', delay: 1500 },
      { msg: `Querying ${agent.agent_type} model (Temperature: 0.7)...`, delay: 2200 },
      { msg: 'Processing response...', delay: 3000 },
      { msg: 'Formatting output...', delay: 3500 }
    ];

    // Execute simulation steps sequentially with randomized jitter for realism.
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 500)); // Random jitter
      addLog(step.msg, 'info');
    }

    // Final success state
    await new Promise(resolve => setTimeout(resolve, 800));
    addLog('Execution completed successfully.', 'success');
    
    // Generate mock output based on agent type to make the demo feel "smart".
    let mockOutput = '';
    if (agent.agent_type === 'content_generation') {
      mockOutput = `## Content Generated for: ${prompt}\n\nHere is a draft based on your request:\n\n**Headline:** Unlocking the Future of AI with ${agent.name}\n\n**Body:** In today's rapidly evolving digital landscape, leveraging advanced AI agents is no longer a luxury—it's a necessity. Our platform provides the tools you need to automate workflows, analyze data, and engage customers like never before.\n\n*Key Takeaways:*\n- Automation saves time\n- Data-driven decisions\n- Enhanced customer experience`;
    } else if (agent.agent_type === 'operating') {
      mockOutput = `**Analysis Report**\n\nBased on the operational data provided in "${prompt}", I have identified three key areas for optimization:\n\n1. **Workflow Redundancy:** Detected duplicate processes in the intake phase.\n2. **Resource Allocation:** Team B is currently over-utilized by 15%.\n3. **Cost Saving:** Switching provider X could save $200/mo.\n\n**Action Items:**\n- Review intake automation rules.\n- Rebalance Team B workload.`;
    } else {
      mockOutput = `I have processed your request: "${prompt}".\n\nTask status: COMPLETED\nConfidence Score: 98%\n\nActions taken:\n- Parsed input\n- Executed internal logic\n- Validated results`;
    }

    setOutput(mockOutput);
    setIsRunning(false);
    addToast('success', 'Agent finished execution');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{agent?.name} Playground</h2>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Online • {agent?.agent_type}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Input & Settings */}
          <div className="w-1/3 border-r border-gray-200 p-6 flex flex-col bg-white">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task / Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isRunning}
                className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none text-sm"
                placeholder="Describe the task you want the agent to perform..."
              />
              <p className="text-xs text-gray-500 mt-2">
                Be specific about the desired output format and constraints.
              </p>
            </div>
            
            <button
              onClick={handleRun}
              disabled={isRunning || !prompt.trim()}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Run Agent
                </>
              )}
            </button>
          </div>

          {/* Right Panel: Terminal & Output */}
          <div className="w-2/3 flex flex-col bg-gray-900">
            {/* Terminal Logs */}
            <div className="h-1/2 border-b border-gray-800 p-4 overflow-y-auto font-mono text-sm">
              <div className="flex items-center gap-2 text-gray-400 mb-4 sticky top-0 bg-gray-900 pb-2 border-b border-gray-800">
                <Terminal className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider font-semibold">Live Execution Logs</span>
              </div>
              <div className="space-y-1.5">
                {logs.map((log, idx) => (
                  <div key={idx} className={`flex gap-3 ${ 
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'success' ? 'text-green-400' : 
                    log.type === 'system' ? 'text-blue-400' : 'text-gray-300'
                  }`}> 
                    <span className="text-gray-600 shrink-0">[{log.timestamp}]</span>
                    <span>{log.type === 'system' ? '>' : ''} {log.message}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>

            {/* Output Preview */}
            <div className="h-1/2 p-6 overflow-y-auto bg-gray-50">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Result Output</h3>
                  {output && (
                    <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                       <RefreshCw className="w-3 h-3" /> Copy
                    </button>
                  )}
               </div>
               {output ? (
                 <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap font-sans bg-white p-4 rounded border border-gray-200 shadow-sm">
                   {output}
                 </div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400">
                   <Bot className="w-12 h-12 mb-2 opacity-20" />
                   <p className="text-sm">Run the agent to see output here</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
