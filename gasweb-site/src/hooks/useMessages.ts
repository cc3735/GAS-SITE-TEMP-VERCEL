import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: string;
  sender_id: string | null;
  body: string;
  channel: string;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setMessages((data ?? []) as Message[]);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = async (data: {
    body: string;
    sender_type: 'staff' | 'client' | 'system';
    channel?: string;
    metadata?: Record<string, unknown>;
    organization_id?: string;
    recipient_email?: string;
    recipient_phone?: string;
    subject?: string;
  }) => {
    if (!conversationId) throw new Error('No conversation selected');
    if (!user) throw new Error('Not authenticated');

    const channel = data.channel || 'email';

    // Staff messages route through the Edge Function for external dispatch
    if (data.sender_type === 'staff' && data.organization_id) {
      const { data: result, error: fnError } = await supabase.functions.invoke('send-message', {
        body: {
          organization_id: data.organization_id,
          conversation_id: conversationId,
          channel,
          body: data.body,
          recipient_email: data.recipient_email,
          recipient_phone: data.recipient_phone,
          subject: data.subject,
        },
      });

      if (fnError) throw fnError;
      if (!result?.success) throw new Error(result?.error || 'Failed to send message');

      const newMsg = result.message as Message;
      setMessages(prev => [...prev, newMsg]);
      return newMsg;
    }

    // Client / system messages: direct insert (no external dispatch)
    const { data: row, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_type: data.sender_type,
        sender_id: user.id,
        body: data.body,
        channel,
        metadata: data.metadata || {},
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const newMsg = row as Message;
    setMessages(prev => [...prev, newMsg]);

    // Update conversation denormalized fields
    const preview = data.body.length > 100 ? data.body.substring(0, 100) + '...' : data.body;
    const unreadField = data.sender_type === 'client'
      ? 'unread_count_staff'
      : 'unread_count_client';

    await supabase
      .from('conversations')
      .update({
        last_message_at: newMsg.created_at,
        last_message_preview: preview,
        [unreadField]: 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    return newMsg;
  };

  const markAsRead = async (senderType: 'staff' | 'client') => {
    if (!conversationId) return;

    // Mark all unread messages in this conversation as read
    const { error: updateError } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .is('read_at', null)
      .neq('sender_type', senderType);

    if (updateError) {
      console.error('Error marking messages as read:', updateError);
      return;
    }

    // Reset unread count on the conversation
    const unreadField = senderType === 'staff'
      ? 'unread_count_staff'
      : 'unread_count_client';

    await supabase
      .from('conversations')
      .update({ [unreadField]: 0 })
      .eq('id', conversationId);

    // Update local state
    setMessages(prev =>
      prev.map(m =>
        m.read_at === null && m.sender_type !== senderType
          ? { ...m, read_at: new Date().toISOString() }
          : m
      )
    );
  };

  return { messages, loading, error, sendMessage, markAsRead, refetch: fetchMessages };
}
