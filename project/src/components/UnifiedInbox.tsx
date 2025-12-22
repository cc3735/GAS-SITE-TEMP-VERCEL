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

  const { threads, loading, error } = useUnifiedInbox(organizationId, filters, searchQuery, sortBy);

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms': return <MessageSquare size={16} className="text-green-400" />;
      case 'email': return <Mail size={16} className="text-blue-400" />;
      case 'voice': return <Phone size={16} className="text-purple-400" />;
      case 'instagram': return <Instagram size={16} className="text-pink-500" />;
      case 'facebook': return <Facebook size={16} className="text-blue-600" />;
      default: return <MessageSquare size={16} />;
    }
  };

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

      {/* Right Column - Conversation View (Placeholder for now) */}
      <div className="flex-1 bg-gray-900 flex flex-col">
         {selectedThreadId ? (
             <div className="flex-1 flex flex-col">
                 <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                     <div>
                         <h3 className="text-lg font-semibold text-white">Alice Johnson</h3>
                         <p className="text-xs text-gray-400">via SMS • +1 (555) 123-4567</p>
                     </div>
                     <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">Resolve</button>
                 </div>
                 <div className="flex-1 p-4 overflow-y-auto space-y-4">
                     {/* Chat Bubbles Placeholder */}
                     <div className="flex justify-start">
                         <div className="max-w-[70%] bg-gray-800 rounded-lg p-3 text-gray-300">
                             <p className="text-sm">Hi, I need help with my order #12345.</p>
                             <span className="text-xs text-gray-500 block mt-1">10:42 AM</span>
                         </div>
                     </div>
                     <div className="flex justify-end">
                         <div className="max-w-[70%] bg-blue-900/30 border border-blue-800 rounded-lg p-3 text-white">
                             <div className="flex items-center text-xs text-blue-400 mb-1 space-x-1">
                                 <span>AI Agent</span>
                             </div>
                             <p className="text-sm">Hello Alice! I'd be happy to help you with order #12345. What seems to be the issue?</p>
                             <span className="text-xs text-blue-400/50 block mt-1">10:42 AM</span>
                         </div>
                     </div>
                 </div>
                 <div className="p-4 border-t border-gray-700 bg-gray-800">
                     <div className="flex space-x-2">
                         <input 
                            type="text" 
                            placeholder="Type a reply..." 
                            className="flex-1 bg-gray-900 border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                         />
                         <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500">Send</button>
                     </div>
                 </div>
             </div>
         ) : (
             <div className="flex-1 flex items-center justify-center text-gray-500 flex-col">
                 <MessageSquare size={48} className="mb-4 opacity-50" />
                 <p>Select a conversation to start messaging</p>
             </div>
         )}
      </div>
    </div>
  );
};

export default UnifiedInbox;
