import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2, Loader2, Sparkles } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useContacts } from '../hooks/useContacts';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

/**
 * SmartChatBot Component
 * 
 * Enhancements:
 * - "Context-Aware": It fetches live data (Projects, Contacts) from the hooks.
 * - "Client-Side RAG": It performs simple keyword matching on the fetched data to answer questions dynamically.
 *   (e.g. "How many projects?" -> counts projects array).
 * - "Vector Ready": The UI and structure are ready to swap the simple logic with a real vector DB call.
 */
const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hi! I\'m your AI assistant. I have access to your live project and contact data. Ask me "How many projects do I have?" or "Find contact John".',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hook into live data for "Client-Side RAG"
  const { projects } = useProjects();
  const { contacts } = useContacts();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Simulated RAG Logic: Search local state instead of Vector DB for now
  const generateSmartResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    // 1. Project Queries
    if (lowerQuery.includes('project') || lowerQuery.includes('projects')) {
      if (lowerQuery.includes('how many') || lowerQuery.includes('count')) {
        return `You currently have ${projects.length} projects.`;
      }
      if (lowerQuery.includes('list') || lowerQuery.includes('show')) {
        const projectNames = projects.map(p => p.name).join(', ');
        return `Here are your projects: ${projectNames || 'No projects found.'}`;
      }
      // Search specific project
      const foundProject = projects.find(p => lowerQuery.includes(p.name.toLowerCase()));
      if (foundProject) {
        return `Found project "${foundProject.name}": Status is ${foundProject.status}, Budget is $${foundProject.budget || 0}. Description: ${foundProject.description}`;
      }
    }

    // 2. Contact Queries
    if (lowerQuery.includes('contact') || lowerQuery.includes('contacts') || lowerQuery.includes('who is')) {
       if (lowerQuery.includes('how many') || lowerQuery.includes('count')) {
        return `You have ${contacts.length} contacts in your CRM.`;
      }
      // Search specific contact
      const foundContact = contacts.find(c => 
        lowerQuery.includes(c.first_name.toLowerCase()) || 
        (c.last_name && lowerQuery.includes(c.last_name.toLowerCase()))
      );
      if (foundContact) {
        return `Found contact: ${foundContact.first_name} ${foundContact.last_name || ''}. Email: ${foundContact.email || 'N/A'}. Title: ${foundContact.title || 'N/A'}.`;
      }
    }

    // 3. Fallback / General Help
    return "I can help you manage your data. Try asking about your 'projects' or 'contacts'. For example: 'How many projects do I have?'";
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsThinking(true);

    // Simulate network/processing delay
    setTimeout(() => {
      const responseText = generateSmartResponse(userMessage.content);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: responseText,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsThinking(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
        >
          <MessageCircle size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-200 ${isMinimized ? 'w-80 h-14' : 'w-96 h-[500px]'}`}>
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between cursor-pointer" onClick={() => !isMinimized && setIsMinimized(true)}>
          <div className="flex items-center gap-2">
            <Sparkles size={18} />
            <span className="font-semibold">AI Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
              className="hover:bg-blue-700 p-1 rounded transition-colors"
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              className="hover:bg-blue-700 p-1 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${ 
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-[10px] mt-1 ${message.sender === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-xs text-gray-500">Analyzing data...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-3 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your projects..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatBot;