import { useState, useRef, useEffect } from 'react';
import { Send, Mail, MessageCircle, Share2, Voicemail, ArrowLeft } from 'lucide-react';
import type { Message } from '../../hooks/useMessages';
import type { Conversation } from '../../hooks/useConversations';

const CHANNEL_CONFIG: Record<string, { icon: typeof Mail; label: string; darkColor: string; lightColor: string }> = {
  email: { icon: Mail, label: 'Email', darkColor: 'text-blue-400', lightColor: 'text-blue-600' },
  sms: { icon: MessageCircle, label: 'SMS', darkColor: 'text-green-400', lightColor: 'text-green-600' },
  social: { icon: Share2, label: 'Social', darkColor: 'text-purple-400', lightColor: 'text-purple-600' },
  voicemail: { icon: Voicemail, label: 'Voicemail', darkColor: 'text-orange-400', lightColor: 'text-orange-600' },
};

interface MessageThreadProps {
  conversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  onSend: (body: string) => Promise<void>;
  onBack: () => void;
  theme: 'dark' | 'light';
  senderType: 'staff' | 'client';
}

export default function MessageThread({
  conversation,
  messages,
  loading,
  onSend,
  onBack,
  theme,
  senderType,
}: MessageThreadProps) {
  const dark = theme === 'dark';
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (conversation) {
      inputRef.current?.focus();
    }
  }, [conversation?.id]);

  const handleSend = async () => {
    const body = inputValue.trim();
    if (!body || sending) return;

    setSending(true);
    try {
      await onSend(body);
      setInputValue('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getDisplayName = (conv: Conversation) => {
    if (conv.contact_name) return conv.contact_name;
    if (conv.client_name) return conv.client_name;
    return conv.subject || 'Conversation';
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = '';
  for (const msg of messages) {
    const msgDate = new Date(msg.created_at).toDateString();
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msg.created_at, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  }

  if (!conversation) {
    return (
      <div className={`flex items-center justify-center h-full rounded-lg ${dark ? 'bg-gray-800' : 'bg-slate-50'}`}>
        <div className="text-center">
          <MessageCircle className={`w-12 h-12 mx-auto mb-3 ${dark ? 'text-gray-600' : 'text-slate-300'}`} />
          <p className={`text-sm ${dark ? 'text-gray-500' : 'text-slate-400'}`}>
            Select a conversation to view messages
          </p>
        </div>
      </div>
    );
  }

  const channelInfo = CHANNEL_CONFIG[conversation.channel] || CHANNEL_CONFIG.email;
  const ChannelIcon = channelInfo.icon;

  return (
    <div className={`flex flex-col h-full rounded-lg ${dark ? 'bg-gray-800' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className={`p-4 border-b flex items-center gap-3 ${dark ? 'border-gray-700' : 'border-slate-200'}`}>
        <button
          onClick={onBack}
          className={`lg:hidden p-1 rounded ${dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-slate-200 text-slate-500'}`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          dark ? 'bg-gray-700' : 'bg-slate-200'
        }`}>
          <ChannelIcon className={`w-4 h-4 ${dark ? channelInfo.darkColor : channelInfo.lightColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-sm truncate ${dark ? 'text-white' : 'text-slate-900'}`}>
            {getDisplayName(conversation)}
          </h3>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded ${
              dark ? 'bg-gray-700 text-gray-300' : 'bg-slate-200 text-slate-600'
            }`}>
              {channelInfo.label}
            </span>
            {conversation.subject && (
              <span className={`text-xs truncate ${dark ? 'text-gray-500' : 'text-slate-400'}`}>
                {conversation.subject}
              </span>
            )}
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${
          conversation.status === 'open'
            ? dark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700'
            : dark ? 'bg-gray-700 text-gray-400' : 'bg-slate-200 text-slate-500'
        }`}>
          {conversation.status}
        </span>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className={`text-center py-8 ${dark ? 'text-gray-500' : 'text-slate-400'}`}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className={`text-center py-8 ${dark ? 'text-gray-500' : 'text-slate-400'}`}>
            <p className="text-sm">No messages yet. Send the first message below.</p>
          </div>
        ) : (
          groupedMessages.map((group, gi) => (
            <div key={gi}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className={`flex-1 h-px ${dark ? 'bg-gray-700' : 'bg-slate-200'}`} />
                <span className={`text-xs ${dark ? 'text-gray-500' : 'text-slate-400'}`}>
                  {formatDate(group.date)}
                </span>
                <div className={`flex-1 h-px ${dark ? 'bg-gray-700' : 'bg-slate-200'}`} />
              </div>

              {group.messages.map(msg => {
                const isOwnMessage = msg.sender_type === senderType;
                const isSystem = msg.sender_type === 'system';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        dark ? 'bg-gray-700 text-gray-400' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {msg.body}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}>
                    <div className={`max-w-[75%] ${isOwnMessage ? 'order-2' : ''}`}>
                      <div className={`px-4 py-2.5 rounded-2xl ${
                        isOwnMessage
                          ? 'bg-primary-600 text-white rounded-br-md'
                          : dark
                            ? 'bg-gray-700 text-gray-100 rounded-bl-md'
                            : 'bg-white border border-slate-200 text-slate-900 rounded-bl-md'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'justify-end' : ''}`}>
                        <span className={`text-[10px] ${dark ? 'text-gray-600' : 'text-slate-400'}`}>
                          {formatTime(msg.created_at)}
                        </span>
                        {msg.read_at && isOwnMessage && (
                          <span className={`text-[10px] ${dark ? 'text-gray-600' : 'text-slate-400'}`}>
                            Read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className={`p-4 border-t ${dark ? 'border-gray-700' : 'border-slate-200'}`}>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className={`flex-1 px-4 py-2.5 text-sm rounded-xl border resize-none ${
              dark
                ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-primary-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-primary-500'
            } focus:outline-none focus:ring-1 focus:ring-primary-500`}
            style={{ maxHeight: '120px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            className={`p-2.5 rounded-xl transition ${
              inputValue.trim() && !sending
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : dark
                  ? 'bg-gray-700 text-gray-500'
                  : 'bg-slate-200 text-slate-400'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
