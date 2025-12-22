import React, { useState } from 'react';
import { useUnifiedInbox } from '../hooks/useUnifiedInbox';
import { InboxFilters, SortOption, Thread } from '../types/missionControl';
import { Search, Filter, MessageSquare, Phone, Mail, Instagram, Facebook, User, AlertCircle } from 'lucide-react';

interface UnifiedInboxProps {
  organizationId: string;
  initialFilters?: Partial<InboxFilters>;
  defaultSort?: SortOption;
  onThreadSelect?: (threadId: string) => void;
}

const UnifiedInbox: React.FC<UnifiedInboxProps> = ({ 
  organizationId, 
  initialFilters = {}, 
  defaultSort = 'recent',
  onThreadSelect 
}) => {
  const [filters, setFilters] = useState<InboxFilters>(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>(defaultSort);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const selectedThread = threads.find(t => t.id === selectedThreadId);

  return (
    <div className="flex h-[600px] bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      {/* Left Sidebar - Channels */}
      <div className="w-16 md:w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
           <h2 className="text-white font-semibold hidden md:block">Inbox</h2>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
            {[
                { id: 'all', label: 'All Messages', icon: <User size={18} />, count: 12 },
                { id: 'sms', label: 'SMS', icon: <MessageSquare size={18} />, count: 5 },
                { id: 'email', label: 'Email', icon: <Mail size={18} />, count: 2 },
                { id: 'social', label: 'Social', icon: <Instagram size={18} />, count: 4 },
                { id: 'voice', label: 'Voice', icon: <Phone size={18} />, count: 1 },
            ].map(item => (
                <button key={item.id} className="w-full flex items-center p-3 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                    <span className="mx-auto md:mx-0">{item.icon}</span>
                    <span className="ml-3 hidden md:block text-sm font-medium flex-1 text-left">{item.label}</span>
                    {item.count > 0 && (
                        <span className="hidden md:flex items-center justify-center w-5 h-5 text-xs font-bold bg-blue-600 rounded-full text-white">
                            {item.count}
                        </span>
                    )}
                </button>
            ))}
        </nav>
      </div>

      {/* Middle Column - Thread List */}
      <div className="w-80 md:w-96 bg-gray-800/50 border-r border-gray-700 flex flex-col">
        <div className="p-3 border-b border-gray-700">
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Search messages..." 
                    className="w-full bg-gray-900 text-sm text-gray-300 pl-9 pr-3 py-2 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                <span>Sort by: {sortBy}</span>
                <button className="flex items-center hover:text-white"><Filter size={12} className="mr-1" /> Filter</button>
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
            {loading ? (
                <div className="p-4 text-center text-gray-500">Loading threads...</div>
            ) : (
                threads.map(thread => (
                    <div 
                        key={thread.id}
                        onClick={() => setSelectedThreadId(thread.id)}
                        className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors ${selectedThreadId === thread.id ? 'bg-gray-700/50 border-l-2 border-l-blue-500' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-white truncate pr-2">{thread.customerName}</span>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                {new Date(thread.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                        <div className="flex items-center text-xs text-gray-400 mb-1 space-x-2">
                             {getChannelIcon(thread.channel)}
                             {thread.priority === 'urgent' && <span className="text-red-400 flex items-center"><AlertCircle size={10} className="mr-1" /> Urgent</span>}
                             {thread.status === 'assigned' && <span className="text-blue-400">Assigned</span>}
                        </div>
                        <p className="text-sm text-gray-400 truncate">{thread.lastMessage}</p>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Right Column - Conversation View */}
      <div className="flex-1 bg-gray-900 flex flex-col">
         {selectedThread ? (
             <div className="flex-1 flex flex-col">
                 <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                     <div>
                         <h3 className="text-lg font-semibold text-white">{selectedThread.customerName}</h3>
                         <div className="flex items-center gap-2 text-xs text-gray-400">
                            {getChannelIcon(selectedThread.channel)}
                            <span className="capitalize">via {selectedThread.channel}</span>
                            {selectedThread.humanOnlineStatus && <span className="text-green-400">• Online</span>}
                         </div>
                     </div>
                     <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 transition-colors">
                        Resolve Thread
                     </button>
                 </div>

                 {/* Message History */}
                 <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-900">
                     {/* Customer Message (Mocked from thread) */}
                     <div className="flex justify-start">
                         <div className="max-w-[70%] bg-gray-800 rounded-2xl rounded-tl-none p-3 text-gray-300 shadow-sm">
                             <p className="text-sm">{selectedThread.lastMessage}</p>
                             <span className="text-[10px] text-gray-500 block mt-1">
                                {new Date(selectedThread.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             </span>
                         </div>
                     </div>

                     {/* AI Response Mock */}
                     {selectedThread.assignedAgentId && (
                         <div className="flex justify-end">
                             <div className="max-w-[70%] bg-blue-900/20 border border-blue-800/50 rounded-2xl rounded-tr-none p-3 text-white">
                                 <div className="flex items-center text-xs text-blue-400 mb-1 space-x-1">
                                     <span className="font-semibold">AI Agent</span>
                                 </div>
                                 <p className="text-sm">I've received your message about "{selectedThread.lastMessage}". How can I assist you further?</p>
                                 <span className="text-[10px] text-blue-400/50 block mt-1">Just now</span>
                             </div>
                         </div>
                     )}
                 </div>

                 {/* Input Area */}
                 <div className="p-4 border-t border-gray-700 bg-gray-800">
                     {/* Quick Actions */}
                     <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-600">
                        <button className="whitespace-nowrap px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-xs text-gray-300 transition-colors">
                            📅 Schedule Call
                        </button>
                        <button className="whitespace-nowrap px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-xs text-gray-300 transition-colors">
                            💰 Send Pricing
                        </button>
                        <button className="whitespace-nowrap px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-xs text-gray-300 transition-colors">
                            👋 Introduction
                        </button>
                        <button className="whitespace-nowrap px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-xs text-gray-300 transition-colors">
                            ❓ Ask for Details
                        </button>
                     </div>

                     <div className="flex space-x-2">
                         <input 
                            type="text" 
                            placeholder="Type a reply or use quick actions..." 
                            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                         />
                         <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors font-medium text-sm">
                            Send
                         </button>
                     </div>
                 </div>
             </div>
         ) : (
             <div className="flex-1 flex items-center justify-center text-gray-500 flex-col bg-gray-900/50">
                 <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare size={32} className="opacity-50" />
                 </div>
                 <p className="font-medium">Select a conversation to start messaging</p>
                 <p className="text-sm opacity-60 mt-1">Choose a thread from the list on the left</p>
             </div>
         )}
      </div>
    </div>
  );
};

export default UnifiedInbox;
