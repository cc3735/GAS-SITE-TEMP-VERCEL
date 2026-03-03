import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

type TicketStep = 'idle' | 'subject' | 'description' | 'category' | 'confirming';

const CATEGORIES = [
  { id: 'app_setup', label: 'App Setup' },
  { id: 'billing', label: 'Billing' },
  { id: 'bug', label: 'Bug Report' },
  { id: 'feature_request', label: 'Feature Request' },
  { id: 'general', label: 'General' },
];

const PortalChatBot: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content:
        "Hi! I'm your GAS Client Portal assistant. I can help you with app setup, account questions, or submit a support ticket. What can I help you with?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ticket creation flow state
  const [ticketStep, setTicketStep] = useState<TicketStep>('idle');
  const [ticketDraft, setTicketDraft] = useState({ subject: '', description: '', category: '' });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addBotMessage = (content: string) => {
    const msg: Message = {
      id: (Date.now() + 1).toString(),
      content,
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
  };

  const handleTicketFlow = (userText: string) => {
    if (ticketStep === 'subject') {
      setTicketDraft((prev) => ({ ...prev, subject: userText }));
      setTicketStep('description');
      setTimeout(() => addBotMessage('Got it. Please describe the issue in detail so our team can help you.'), 400);
      return true;
    }

    if (ticketStep === 'description') {
      setTicketDraft((prev) => ({ ...prev, description: userText }));
      setTicketStep('category');
      setTimeout(
        () =>
          addBotMessage(
            'What category best fits your request?\n\n1. App Setup\n2. Billing\n3. Bug Report\n4. Feature Request\n5. General\n\nReply with the number or name.'
          ),
        400
      );
      return true;
    }

    if (ticketStep === 'category') {
      const input = userText.toLowerCase().trim();
      let category = 'general';
      if (input === '1' || input.includes('setup')) category = 'app_setup';
      else if (input === '2' || input.includes('bill')) category = 'billing';
      else if (input === '3' || input.includes('bug')) category = 'bug';
      else if (input === '4' || input.includes('feature')) category = 'feature_request';
      else if (input === '5' || input.includes('general')) category = 'general';

      setTicketDraft((prev) => ({ ...prev, category }));
      setTicketStep('confirming');

      // Submit the ticket
      submitTicket({ ...ticketDraft, category });
      return true;
    }

    return false;
  };

  const submitTicket = async (draft: { subject: string; description: string; category: string }) => {
    if (!user) {
      setTimeout(() => addBotMessage('Sorry, you need to be signed in to submit a ticket.'), 400);
      setTicketStep('idle');
      return;
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject: draft.subject,
        description: draft.description,
        category: draft.category,
        status: 'open',
        priority: 'normal',
      })
      .select('id')
      .single();

    if (error) {
      setTimeout(
        () =>
          addBotMessage(
            "Sorry, something went wrong creating your ticket. Please try again or email us at support@gasweb.info."
          ),
        400
      );
    } else {
      const label = CATEGORIES.find((c) => c.id === draft.category)?.label ?? draft.category;
      setTimeout(
        () =>
          addBotMessage(
            `Your support ticket has been created!\n\nTicket ID: ${data.id.slice(0, 8)}\nSubject: ${draft.subject}\nCategory: ${label}\n\nOur team will review it shortly. You can also reach us at support@gasweb.info.`
          ),
        400
      );
    }

    setTicketStep('idle');
    setTicketDraft({ subject: '', description: '', category: '' });
  };

  const getBotResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();

    // Ticket trigger words
    if (
      ticketStep === 'idle' &&
      (msg.includes('ticket') ||
        msg.includes('support') ||
        msg.includes('problem') ||
        msg.includes('issue') ||
        msg.includes('report') ||
        msg.includes('request'))
    ) {
      setTicketStep('subject');
      return "I'll help you create a support ticket. What's the subject or title for your issue?";
    }

    // App-specific help
    if (msg.includes('legalflow') || msg.includes('legal flow') || msg.includes('legal')) {
      return 'LegalFlow helps you manage legal documents, bookkeeping, trademarks, and tax filing. To get started, go to the LegalFlow section in the sidebar. If you need help setting it up, just type "support" to submit a ticket!';
    }
    if (msg.includes('courseflow') || msg.includes('course')) {
      return 'CourseFlow is our course management platform. Once subscribed, you can create and manage online courses. Need help getting started? Type "support" to open a ticket!';
    }
    if (msg.includes('foodtruck') || msg.includes('food truck') || msg.includes('food')) {
      return 'FoodTruck helps food truck operators manage menus, orders, and locations. After subscribing, you\'ll have access to the full management dashboard. Type "support" if you need setup help!';
    }
    if (msg.includes('buildflow') || msg.includes('build') || msg.includes('construction')) {
      return 'BuildFlow is our construction management tool for project tracking, budgets, and scheduling. Subscribe through My Apps to get started. Type "support" for setup assistance!';
    }
    if (msg.includes('keysflow') || msg.includes('keys') || msg.includes('real estate')) {
      return 'KeysFlow is designed for real estate professionals to manage properties, clients, and transactions. Subscribe via My Apps to access it. Type "support" if you need help!';
    }

    // General topics
    if (msg.includes('app') || msg.includes('subscribe') || msg.includes('subscription')) {
      return 'You can manage your app subscriptions from the "My Apps" page in the sidebar. From there you can subscribe to new apps or manage existing ones. Need help? Type "support" to create a ticket.';
    }
    if (msg.includes('billing') || msg.includes('payment') || msg.includes('invoice')) {
      return 'For billing questions, go to Settings > Billing in the sidebar. You can view your subscription details and payment history there. For billing issues, type "support" to open a ticket.';
    }
    if (msg.includes('profile') || msg.includes('account') || msg.includes('settings')) {
      return 'You can update your profile and account settings from Settings in the sidebar. This includes your name, email, notifications, and security preferences.';
    }
    if (msg.includes('email') || msg.includes('contact')) {
      return 'You can reach our support team at support@gasweb.info. Or type "support" right here to submit a ticket and our team will get back to you!';
    }
    if (msg.includes('help') || msg.includes('what can you do') || msg.includes('capabilities')) {
      return "I can help you with:\n\n• App setup (LegalFlow, CourseFlow, FoodTruck, BuildFlow, KeysFlow)\n• Subscription & billing questions\n• Account & profile settings\n• Submit a support ticket — just type \"support\"\n• Email support: support@gasweb.info\n\nWhat would you like help with?";
    }
    if (msg.includes('thank') || msg.includes('thanks')) {
      return "You're welcome! Let me know if there's anything else I can help with.";
    }
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      return 'Hello! How can I help you today? I can assist with app setup, account questions, or help you submit a support ticket.';
    }

    return 'I\'m not sure about that, but I can help with app setup, billing, account settings, or submitting a support ticket. Type "support" to create a ticket, or ask me about a specific app!';
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const text = currentMessage;
    setCurrentMessage('');

    // Check if we're in a ticket flow
    if (handleTicketFlow(text)) return;

    // Normal bot response
    const response = getBotResponse(text);
    setTimeout(() => addBotMessage(response), 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
          className="bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
        >
          <MessageCircle size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-200 ${isMinimized ? 'w-80 h-14' : 'w-80 h-[28rem]'}`}>
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col h-full">
        {/* Header */}
        <div className="bg-primary-600 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot size={18} />
            <span className="font-semibold text-sm">Support Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="hover:bg-primary-700 p-1 rounded transition-colors"
            >
              {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-primary-700 p-1 rounded transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.sender === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {message.sender === 'user' ? (
                        <User size={12} className="text-primary-200" />
                      ) : (
                        <Bot size={12} className="text-slate-400" />
                      )}
                      <span className="text-[10px] opacity-60">
                        {message.sender === 'bot' ? 'Support' : 'You'}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Ticket step indicator */}
            {ticketStep !== 'idle' && (
              <div className="px-4 py-1.5 bg-amber-50 border-t border-amber-100 flex items-center justify-between">
                <span className="text-xs text-amber-700 font-medium">
                  Creating ticket: {ticketStep === 'subject' ? 'enter subject' : ticketStep === 'description' ? 'describe issue' : ticketStep === 'category' ? 'pick category' : 'submitting...'}
                </span>
                <button
                  onClick={() => { setTicketStep('idle'); setTicketDraft({ subject: '', description: '', category: '' }); setTimeout(() => addBotMessage('Ticket creation cancelled. How else can I help?'), 200); }}
                  className="text-xs text-amber-600 hover:text-amber-800 underline"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-slate-200 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={ticketStep !== 'idle' ? 'Type your response...' : 'Ask a question or type "support"...'}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm text-slate-800 placeholder-slate-400"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim()}
                  className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PortalChatBot;
