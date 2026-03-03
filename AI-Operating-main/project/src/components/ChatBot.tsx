import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hi! I\'m your GAS Operating System assistant. I\'m here to help you navigate and make the most of all available features. What can I help you with today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();

    // Project Management
    if (message.includes('project') || message.includes('projects')) {
      if (message.includes('create') || message.includes('new')) {
        return 'To create a new project, go to the Projects page or use the "New Project" button on the Dashboard. You can set the project name, description, timeline, budget, and assign team members. Once created, you\'ll see comprehensive project details in the header area.';
      }
      if (message.includes('calendar') || message.includes('schedule')) {
        return 'The Projects Calendar view shows all your tasks organized by due dates. You can navigate between months, see task priorities with color coding (red=urgent, orange=high, blue=medium, gray=low), and get an overview of upcoming deadlines. Up to 3 tasks are shown per day.';
      }
      if (message.includes('delete') || message.includes('remove')) {
        return 'To delete a project, click the trash icon (🗑️) next to the project tab. You\'ll get a confirmation dialog. All associated tasks and data will be removed permanently.';
      }
      return 'GAS OS offers comprehensive project management: create projects with timelines and budgets, track tasks with priorities, view everything in a beautiful calendar format, and manage team access. Select a project to see details like budget, timeline, and task progress.';
    }

    // Marketing & Campaigns
    if (message.includes('marketing') || message.includes('campaign') || message.includes('email')) {
      if (message.includes('template') || message.includes('templates')) {
        return 'We offer 6 proven campaign templates: Welcome Series (5-email flow), Product Launch (build anticipation), Re-engagement (win back inactive users), Promotional Sale (drive conversions), Educational Content (share resources), and Seasonal Campaign (holiday messaging). Each shows estimated performance metrics!';
      }
      if (message.includes('create') || message.includes('new')) {
        return 'Click the "New Campaign" button or choose from our campaign templates. Templates automatically pre-fill forms with optimal settings and include performance estimates (open rates, click rates, send timing). You can target specific audiences and schedule delivery dates.';
      }
      return 'Our Marketing & Social platform includes email campaigns, automation sequences, and social media management. Use templates for proven campaign types or create custom campaigns. Each template includes estimated performance metrics to help you succeed.';
    }

    // CRM & Contacts
    if (message.includes('crm') || message.includes('contact') || message.includes('customer')) {
      if (message.includes('add') || message.includes('new')) {
        return 'Use the "Add Contact" quick action on the Dashboard or go to the CRM page. You can add details like name, email, phone, title, company, and notes. Your CRM helps track all customer interactions and relationships.';
      }
      return 'The CRM system manages all your contacts, companies, and customer relationships. Add new contacts via the Dashboard quick action, organize them by company, and track communication history. All your customer data is stored securely.';
    }

    // Dashboard & Navigation
    if (message.includes('dashboard') || message.includes('stats')) {
      return 'The Dashboard shows key statistics (active projects, total contacts, campaign performance) and Quick Actions for fast access to common tasks. Use it as your command center for everything in GAS OS.';
    }

    if (message.includes('navigation') || message.includes('menu') || message.includes('sidebar')) {
      return 'Use the sidebar to navigate between: Dashboard (home/stats), Projects (management/calendar), CRM (contacts/customers), Marketing & Social (campaigns/email), AI Agents (automation), MCP Servers, Analytics, and Settings.';
    }

    if (message.includes('quick action') || message.includes('quick')) {
      return 'Quick Actions on the Dashboard provide fast access to: New Project (create project), Add Contact (add customer), New Campaign (start marketing), Add Company (create business account). These are shortcuts to the most common tasks.';
    }

    // Help & General
    if (message.includes('help') || message.includes('tutorial') || message.includes('guide')) {
      return 'I\'m here to help! You can ask me about any feature: projects, marketing campaigns, CRM contacts, dashboard stats, or how to navigate. I know everything about GAS OS capabilities and can guide you through any task.';
    }

    if (message.includes('ai') || message.includes('agent') || message.includes('automation')) {
      return 'GAS OS includes AI Agents for automation tasks. They can handle content generation, data analysis, repetitive workflows, and intelligent automation. Check the AI Agents section for available models and capabilities.';
    }

    if (message.includes('analytics') || message.includes('reports')) {
      return 'The Analytics page provides detailed insights into your business performance, campaign effectiveness, project progress, and customer engagement metrics. Track everything in one comprehensive dashboard.';
    }

    // Default responses
    if (message.includes('what can you do') || message.includes('capabilities')) {
      return 'I can help you with: Project Management (creation, calendar views, task tracking), Marketing Campaigns (email templates, automation), CRM (contact management, customer relationships), Dashboard navigation, AI Agents, and any other GAS OS features. Just ask me about what you\'re trying to accomplish!';
    }

    if (message.includes('thank') || message.includes('thanks')) {
      return 'You\'re welcome! I\'m always here to help you make the most of GAS OS. Feel free to ask if you need assistance with any feature or task.';
    }

    // Generic response for unrecognized queries
    return 'I understand you\'re asking about ' + userMessage + '. Can you be more specific about what you\'d like to know? I can help with projects, marketing campaigns, CRM contacts, navigation, or any other GAS OS feature!';
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

    // Simulate bot response delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getBotResponse(currentMessage),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 500);
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
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-200 ${isMinimized ? 'w-80 h-14' : 'w-80 h-96'}`}>
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col h-full">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot size={20} />
            <span className="font-semibold">GAS OS Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="hover:bg-blue-700 p-1 rounded transition-colors"
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-700 p-1 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {message.sender === 'user' ? (
                        <User size={14} className="text-blue-100" />
                      ) : (
                        <Bot size={14} className="text-gray-400" />
                      )}
                      <span className="text-xs opacity-70">
                        {message.sender === 'bot' ? 'GAS Assistant' : 'You'}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about GAS OS..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Ask about projects, marketing, CRM, navigation, or any feature!
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatBot;
