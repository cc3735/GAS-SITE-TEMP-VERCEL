import { Mail, MessageCircle, Share2, Voicemail, Plus, Search } from 'lucide-react';
import type { Conversation } from '../../hooks/useConversations';

const CHANNEL_ICONS: Record<string, { icon: typeof Mail; color: string; darkColor: string }> = {
  email: { icon: Mail, color: 'text-blue-600', darkColor: 'text-blue-400' },
  sms: { icon: MessageCircle, color: 'text-green-600', darkColor: 'text-green-400' },
  social: { icon: Share2, color: 'text-purple-600', darkColor: 'text-purple-400' },
  voicemail: { icon: Voicemail, color: 'text-orange-600', darkColor: 'text-orange-400' },
};

const CHANNEL_LABELS: Record<string, string> = {
  all: 'All',
  email: 'Email',
  sms: 'SMS',
  social: 'Social',
  voicemail: 'Voicemail',
};

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewMessage: () => void;
  channelFilter: string;
  onChannelChange: (channel: string) => void;
  theme: 'dark' | 'light';
  isClientView?: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export default function ConversationList({
  conversations,
  loading,
  selectedId,
  onSelect,
  onNewMessage,
  channelFilter,
  onChannelChange,
  theme,
  isClientView,
  searchQuery,
  onSearchChange,
}: ConversationListProps) {
  const dark = theme === 'dark';

  const getDisplayName = (conv: Conversation) => {
    if (conv.contact_name) return conv.contact_name;
    if (conv.client_name) return conv.client_name;
    if (conv.contact_email) return conv.contact_email;
    if (conv.client_email) return conv.client_email;
    return conv.subject || 'Unknown';
  };

  const getUnreadCount = (conv: Conversation) =>
    isClientView ? conv.unread_count_client : conv.unread_count_staff;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filtered = conversations.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = getDisplayName(c).toLowerCase();
    const preview = (c.last_message_preview || '').toLowerCase();
    const subject = (c.subject || '').toLowerCase();
    return name.includes(q) || preview.includes(q) || subject.includes(q);
  });

  return (
    <div className={`flex flex-col h-full rounded-lg ${dark ? 'bg-gray-800' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${dark ? 'border-gray-700' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>
            Conversations
          </h3>
          <button
            onClick={onNewMessage}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-gray-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border ${
              dark
                ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Channel filter tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => onChannelChange(key)}
              className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition ${
                channelFilter === key
                  ? 'bg-primary-600 text-white'
                  : dark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className={`p-8 text-center ${dark ? 'text-gray-500' : 'text-slate-400'}`}>
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className={`p-8 text-center ${dark ? 'text-gray-500' : 'text-slate-400'}`}>
            <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          filtered.map(conv => {
            const channelInfo = CHANNEL_ICONS[conv.channel] || CHANNEL_ICONS.email;
            const ChannelIcon = channelInfo.icon;
            const unread = getUnreadCount(conv);
            const isSelected = selectedId === conv.id;

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full text-left p-4 border-b transition ${
                  isSelected
                    ? dark
                      ? 'bg-primary-600/20 border-gray-700'
                      : 'bg-primary-50 border-slate-200'
                    : dark
                      ? 'border-gray-700 hover:bg-gray-700/50'
                      : 'border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    dark ? 'bg-gray-700' : 'bg-slate-200'
                  }`}>
                    <ChannelIcon className={`w-4 h-4 ${dark ? channelInfo.darkColor : channelInfo.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-sm font-medium truncate ${
                        unread > 0
                          ? dark ? 'text-white' : 'text-slate-900'
                          : dark ? 'text-gray-300' : 'text-slate-700'
                      }`}>
                        {getDisplayName(conv)}
                      </span>
                      <span className={`text-xs flex-shrink-0 ml-2 ${dark ? 'text-gray-500' : 'text-slate-400'}`}>
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                    {conv.subject && (
                      <p className={`text-xs truncate mb-0.5 ${dark ? 'text-gray-400' : 'text-slate-600'}`}>
                        {conv.subject}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate ${dark ? 'text-gray-500' : 'text-slate-500'}`}>
                        {conv.last_message_preview || 'No messages yet'}
                      </p>
                      {unread > 0 && (
                        <span className="ml-2 flex-shrink-0 w-5 h-5 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
