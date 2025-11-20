import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FolderKanban, Users, Mail, Bot, Settings, Plus, Home, Activity, X } from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  icon: React.ElementType;
  action: () => void;
  group: 'Navigation' | 'Actions';
}

/**
 * CommandPalette Component
 * 
 * A global spotlight-style search menu triggered by `Cmd+K` (Mac) or `Ctrl+K` (Windows).
 * It allows users to navigate the app or trigger quick actions without leaving the keyboard.
 */
export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Command definitions: Can be expanded to include dynamic data (e.g., searching specific projects).
  const commands: CommandItem[] = [
    // Navigation Commands
    { id: 'nav-dashboard', title: 'Go to Dashboard', icon: Home, group: 'Navigation', action: () => navigate('/dashboard') },
    { id: 'nav-projects', title: 'Go to Projects', icon: FolderKanban, group: 'Navigation', action: () => navigate('/projects') },
    { id: 'nav-crm', title: 'Go to CRM', icon: Users, group: 'Navigation', action: () => navigate('/crm') },
    { id: 'nav-marketing', title: 'Go to Marketing', icon: Mail, group: 'Navigation', action: () => navigate('/marketing-social') },
    { id: 'nav-agents', title: 'Go to AI Agents', icon: Bot, group: 'Navigation', action: () => navigate('/agents') },
    { id: 'nav-analytics', title: 'Go to Analytics', icon: Activity, group: 'Navigation', action: () => navigate('/analytics') },
    { id: 'nav-settings', title: 'Go to Settings', icon: Settings, group: 'Navigation', action: () => navigate('/settings') },
    
    // Quick Actions
    { id: 'act-new-project', title: 'Create New Project', icon: Plus, group: 'Actions', action: () => { navigate('/projects'); } },
    { id: 'act-new-contact', title: 'Add New Contact', icon: Plus, group: 'Actions', action: () => { navigate('/crm'); } },
    { id: 'act-new-campaign', title: 'Create Campaign', icon: Plus, group: 'Actions', action: () => { navigate('/marketing-social'); } },
    { id: 'act-new-agent', title: 'Deploy AI Agent', icon: Plus, group: 'Actions', action: () => { navigate('/agents'); } },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.title.toLowerCase().includes(query.toLowerCase())
  );

  // Global Keyboard Listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setQuery('');
      setActiveIndex(0);
    }
  }, [isOpen]);

  // Reset selection on query change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleSelect = (command: CommandItem) => {
    command.action();
    setIsOpen(false);
  };

  // Navigation within the palette (Arrow keys)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[activeIndex]) {
        handleSelect(filteredCommands[activeIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-start justify-center pt-[20vh]">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center border-b border-gray-200 px-4">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-14 outline-none text-lg text-gray-900 placeholder-gray-400"
            placeholder="Type a command or search..."
          />
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No results found.
            </div>
          ) : (
            <>
              {['Navigation', 'Actions'].map(group => {
                const groupCommands = filteredCommands.filter(c => c.group === group);
                if (groupCommands.length === 0) return null;
                
                return (
                  <div key={group}>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {group}
                    </div>
                    {groupCommands.map((command) => {
                      const index = filteredCommands.indexOf(command);
                      const Icon = command.icon;
                      return (
                        <div
                          key={command.id}
                          onClick={() => handleSelect(command)}
                          className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
                            index === activeIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${index === activeIndex ? 'text-blue-600' : 'text-gray-400'}`} />
                          <span className="font-medium">{command.title}</span>
                          {index === activeIndex && (
                            <span className="ml-auto text-xs text-blue-500 font-medium">
                              ⏎
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>
        
        <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
          <div className="flex gap-3">
             <span><kbd className="font-sans bg-white border border-gray-300 rounded px-1">↑↓</kbd> Navigate</span>
             <span><kbd className="font-sans bg-white border border-gray-300 rounded px-1">↵</kbd> Select</span>
          </div>
          <span><kbd className="font-sans bg-white border border-gray-300 rounded px-1">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
