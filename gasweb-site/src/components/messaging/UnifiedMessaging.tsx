import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useConversations, useClientConversations } from '../../hooks/useConversations';
import { useMessages } from '../../hooks/useMessages';
import { useContacts } from '../../hooks/useContacts';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';
import ComposeModal from './ComposeModal';

interface UnifiedMessagingProps {
  theme: 'dark' | 'light';
  isClientView?: boolean;
}

export default function UnifiedMessaging({ theme, isClientView = false }: UnifiedMessagingProps) {
  const { user } = useAuth();
  const [channelFilter, setChannelFilter] = useState('all');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Use the appropriate hook based on view
  const staffHook = useConversations(channelFilter !== 'all' ? channelFilter : undefined);
  const clientHook = useClientConversations(channelFilter !== 'all' ? channelFilter : undefined);

  const {
    conversations,
    loading: convsLoading,
    createConversation,
    refetch: refetchConversations,
  } = isClientView ? clientHook : staffHook;

  const {
    messages,
    loading: msgsLoading,
    sendMessage,
    markAsRead,
  } = useMessages(selectedConversationId);

  const { contacts } = useContacts();

  const selectedConversation = conversations.find(c => c.id === selectedConversationId) || null;

  // Mark messages as read when selecting a conversation
  useEffect(() => {
    if (selectedConversationId) {
      markAsRead(isClientView ? 'client' : 'staff');
    }
  }, [selectedConversationId]);

  const handleSendMessage = async (body: string) => {
    const channel = selectedConversation?.channel || 'email';
    await sendMessage({
      body,
      sender_type: isClientView ? 'client' : 'staff',
      channel,
      organization_id: selectedConversation?.organization_id,
      recipient_email: selectedConversation?.contact_email || undefined,
      subject: selectedConversation?.subject || undefined,
    });
    refetchConversations();
  };

  const handleComposeSend = async (data: {
    contact_id?: string;
    channel: string;
    subject?: string;
    body: string;
  }) => {
    // Create conversation
    const conv = await createConversation({
      contact_id: data.contact_id,
      channel: data.channel,
      subject: data.subject,
    } as any);

    // Insert the first message directly (hook isn't initialized for this conv yet)
    const senderType = isClientView ? 'client' : 'staff';
    await supabase.from('messages').insert({
      conversation_id: conv.id,
      sender_type: senderType,
      sender_id: user?.id || null,
      body: data.body,
      channel: data.channel,
      metadata: {},
    });

    // Update conversation with preview
    const preview = data.body.length > 100 ? data.body.substring(0, 100) + '...' : data.body;
    const unreadField = senderType === 'staff' ? 'unread_count_client' : 'unread_count_staff';
    await supabase.from('conversations').update({
      last_message_preview: preview,
      last_message_at: new Date().toISOString(),
      [unreadField]: 1,
    }).eq('id', conv.id);

    refetchConversations();
    setSelectedConversationId(conv.id);
  };

  const dark = theme === 'dark';

  return (
    <div className={`rounded-xl border ${dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200'}`}>
      <div className="p-4 lg:p-6">
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4`} style={{ height: '600px' }}>
          {/* Conversation list - hide on mobile when a conversation is selected */}
          <div className={`lg:col-span-1 h-full ${selectedConversationId ? 'hidden lg:block' : ''}`}>
            <ConversationList
              conversations={conversations}
              loading={convsLoading}
              selectedId={selectedConversationId}
              onSelect={setSelectedConversationId}
              onNewMessage={() => setShowCompose(true)}
              channelFilter={channelFilter}
              onChannelChange={setChannelFilter}
              theme={theme}
              isClientView={isClientView}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          {/* Message thread */}
          <div className={`lg:col-span-2 h-full ${!selectedConversationId ? 'hidden lg:block' : ''}`}>
            <MessageThread
              conversation={selectedConversation}
              messages={messages}
              loading={msgsLoading}
              onSend={handleSendMessage}
              onBack={() => setSelectedConversationId(null)}
              theme={theme}
              senderType={isClientView ? 'client' : 'staff'}
            />
          </div>
        </div>
      </div>

      {/* Compose modal */}
      {showCompose && (
        <ComposeModal
          contacts={contacts}
          onSend={handleComposeSend}
          onClose={() => setShowCompose(false)}
          theme={theme}
        />
      )}
    </div>
  );
}
