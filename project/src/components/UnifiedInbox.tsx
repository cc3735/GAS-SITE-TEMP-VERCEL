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

  const selectedThread = threads?.find(t => t.id === selectedThreadId);

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms': return <MessageSquare size={16} className="text-green-500" />;
      case 'email': return <Mail size={16} className="text-accent" />;
      case 'voice': return <Phone size={16} className="text-purple-500" />;
      case 'instagram': return <Instagram size={16} className="text-pink-500" />;
      case 'facebook': return <Facebook size={16} className="text-blue-600" />;
      default: return <MessageSquare size={16} />;
    }
  };

  return (
    <div className="flex h-[600px] bg-page border border-border rounded-lg overflow-hidden shadow-sm">
      {/* Left Sidebar - Channels */}
      <div className="w-16 md:w-64 bg-surface border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
           <h2 className="text-primary font-semibold hidden md:block">Inbox</h2>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
            {[
                { id: 'all', label: 'All Messages', icon: <User size={18} />, count: 12 },
                { id: 'sms', label: 'SMS', icon: <MessageSquare size={18} />, count: 5 },
                { id: 'email', label: 'Email', icon: <Mail size={18} />, count: 2 },
                { id: 'social', label: 'Social', icon: <Instagram size={18} />, count: 4 },
                { id: 'voice', label: 'Voice', icon: <Phone size={18} />, count: 1 },
            ].map(item => (
                <button key={item.id} className="w-full flex items-center p-3 text-secondary hover:bg-surface-hover hover:text-primary transition-colors">
                    <span className="mx-auto md:mx-0">{item.icon}</span>
                    <span className="ml-3 hidden md:block text-sm font-medium flex-1 text-left">{item.label}</span>
                    {item.count > 0 && (
                        <span className="hidden md:flex items-center justify-center w-5 h-5 text-xs font-bold bg-accent text-white rounded-full">
                            {item.count}
                        </span>
                    )}
                </button>
            ))}
        </nav>
      </div>

      {/* Middle Column - Thread List */}
      <div className="w-80 md:w-96 bg-surface/50 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-subtle" />
                <input 
                    type="text" 
                    placeholder="Search messages..." 
                    className="w-full bg-surface text-sm text-primary pl-9 pr-3 py-2 rounded border border-border focus:outline-none focus:border-accent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-secondary">
                <span>Sort by: {sortBy}</span>
                <button className="flex items-center hover:text-primary"><Filter size={12} className="mr-1" /> Filter</button>
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
            {loading ? (
                <div className="p-4 text-center text-subtle">Loading threads...</div>
            ) : (
                threads?.map(thread => (
                    <div 
                        key={thread.id}
                        onClick={() => setSelectedThreadId(thread.id)}
                        className={`p-4 border-b border-border cursor-pointer hover:bg-surface-hover transition-colors ${selectedThreadId === thread.id ? 'bg-surface-hover border-l-2 border-l-accent' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-primary truncate pr-2">{thread.customerName}</span>
                            <span className="text-xs text-subtle whitespace-nowrap">
                                {new Date(thread.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                        <div className="flex items-center text-xs text-secondary mb-1 space-x-2">
                             {getChannelIcon(thread.channel)}
                             {thread.priority === 'urgent' && <span className="text-red-500 flex items-center"><AlertCircle size={10} className="mr-1" /> Urgent</span>}
                             {thread.status === 'assigned' && <span className="text-accent">Assigned</span>}
                        </div>
                        <p className="text-sm text-secondary truncate">{thread.lastMessage}</p>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Right Column - Conversation View */}
      <div className="flex-1 bg-page flex flex-col">
         {selectedThread ? (
             <div className="flex-1 flex flex-col">
                 <div className="p-4 border-b border-border flex justify-between items-center bg-surface">
                     <div>
                         <h3 className="text-lg font-semibold text-primary">{selectedThread.customerName}</h3>
                         <div className="flex items-center gap-2 text-xs text-secondary">
                            {getChannelIcon(selectedThread.channel)}
                            <span className="capitalize">via {selectedThread.channel}</span>
                            {selectedThread.humanOnlineStatus && <span className="text-green-500">• Online</span>}
                         </div>
                     </div>
                     <button className="px-3 py-1 bg-accent hover:bg-accent-hover text-white text-sm rounded transition-colors">
                        Resolve Thread
                     </button>
                 </div>

                 {/* Message History */}
                 <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-page">
                     {/* Customer Message (Mocked from thread) */}
                     <div className="flex justify-start">
                         <div className="max-w-[70%] bg-surface border border-border rounded-2xl rounded-tl-none p-3 text-primary shadow-sm">
                             <p className="text-sm">{selectedThread.lastMessage}</p>
                             <span className="text-[10px] text-subtle block mt-1">
                                {new Date(selectedThread.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             </span>
                         </div>
                     </div>

                     {/* AI Response Mock */}
                     {selectedThread.assignedAgentId && (
                         <div className="flex justify-end">
                             <div className="max-w-[70%] bg-accent-subtle border border-accent/30 rounded-2xl rounded-tr-none p-3 text-primary">
                                 <div className="flex items-center text-xs text-accent mb-1 space-x-1">
                                     <span className="font-semibold">AI Agent</span>
                                 </div>
                                 <p className="text-sm">I've received your message about "{selectedThread.lastMessage}". How can I assist you further?</p>
                                 <span className="text-[10px] text-accent/70 block mt-1">Just now</span>
                             </div>
                         </div>
                     )}
                 </div>

                 {/* Input Area */}
                 <div className="p-4 border-t border-border bg-surface">
                     {/* Quick Actions */}
                     <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border">
                        <button className="whitespace-nowrap px-3 py-1 bg-surface-hover hover:bg-border rounded-full text-xs text-secondary hover:text-primary transition-colors border border-border">
                            📅 Schedule Call
                        </button>
                        <button className="whitespace-nowrap px-3 py-1 bg-surface-hover hover:bg-border rounded-full text-xs text-secondary hover:text-primary transition-colors border border-border">
                            💰 Send Pricing
                        </button>
                        <button className="whitespace-nowrap px-3 py-1 bg-surface-hover hover:bg-border rounded-full text-xs text-secondary hover:text-primary transition-colors border border-border">
                            👋 Introduction
                        </button>
                        <button className="whitespace-nowrap px-3 py-1 bg-surface-hover hover:bg-border rounded-full text-xs text-secondary hover:text-primary transition-colors border border-border">
                            ❓ Ask for Details
                        </button>
                     </div>

                     <div className="flex space-x-2">
                         <input 
                            type="text" 
                            placeholder="Type a reply or use quick actions..." 
                            className="flex-1 bg-surface border border-border rounded-lg p-3 text-primary text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                         />
                         <button className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-hover transition-colors font-medium text-sm">
                            Send
                         </button>
                     </div>
                 </div>
             </div>
         ) : (
             <div className="flex-1 flex items-center justify-center text-subtle flex-col bg-page">
                 <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4 border border-border">
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