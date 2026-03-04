import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { useAuth } from '../contexts/AuthContext';

export interface Conversation {
  id: string;
  organization_id: string;
  contact_id: string | null;
  client_user_id: string | null;
  channel: string;
  subject: string | null;
  status: string;
  last_message_at: string;
  last_message_preview: string | null;
  unread_count_staff: number;
  unread_count_client: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  contact_name?: string;
  contact_email?: string;
  client_name?: string;
  client_email?: string;
}

/**
 * Hook for staff/admin conversations (scoped to organization).
 */
export function useConversations(channelFilter?: string) {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!currentOrganization) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('conversations')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('last_message_at', { ascending: false });

      if (channelFilter && channelFilter !== 'all') {
        query = query.eq('channel', channelFilter);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      let rows = (data ?? []) as Conversation[];

      // Join contact names
      const contactIds = rows.filter(r => r.contact_id).map(r => r.contact_id!);
      if (contactIds.length > 0) {
        const { data: contacts } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, email')
          .in('id', contactIds);

        const contactMap = new Map(
          (contacts ?? []).map((c: { id: string; first_name: string; last_name: string | null; email: string | null }) => [c.id, c])
        );

        rows = rows.map(r => {
          if (r.contact_id && contactMap.has(r.contact_id)) {
            const c = contactMap.get(r.contact_id)!;
            return {
              ...r,
              contact_name: `${c.first_name} ${c.last_name || ''}`.trim(),
              contact_email: c.email || undefined,
            };
          }
          return r;
        });
      }

      // Join client user names
      const clientIds = rows.filter(r => r.client_user_id).map(r => r.client_user_id!);
      if (clientIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, full_name, email')
          .in('id', clientIds);

        const profileMap = new Map(
          (profiles ?? []).map((p: { id: string; full_name: string | null; email: string }) => [p.id, p])
        );

        rows = rows.map(r => {
          if (r.client_user_id && profileMap.has(r.client_user_id)) {
            const p = profileMap.get(r.client_user_id)!;
            return {
              ...r,
              client_name: p.full_name || p.email,
              client_email: p.email,
            };
          }
          return r;
        });
      }

      setConversations(rows);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization, channelFilter]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createConversation = async (data: {
    contact_id?: string;
    client_user_id?: string;
    channel: string;
    subject?: string;
  }) => {
    if (!currentOrganization) throw new Error('No organization selected');
    if (!user) throw new Error('Not authenticated');

    const { data: row, error: insertError } = await supabase
      .from('conversations')
      .insert({
        organization_id: currentOrganization.id,
        contact_id: data.contact_id || null,
        client_user_id: data.client_user_id || null,
        channel: data.channel,
        subject: data.subject || null,
        status: 'open',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const newConv = row as Conversation;
    setConversations(prev => [newConv, ...prev]);
    return newConv;
  };

  const updateConversation = async (
    id: string,
    updates: Partial<{
      status: string;
      unread_count_staff: number;
      unread_count_client: number;
      last_message_at: string;
      last_message_preview: string;
    }>
  ) => {
    const payload = { ...updates, updated_at: new Date().toISOString() };

    const { error: updateError } = await supabase
      .from('conversations')
      .update(payload)
      .eq('id', id);

    if (updateError) throw updateError;

    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, ...payload } as Conversation : c))
    );
  };

  return {
    conversations,
    loading,
    error,
    createConversation,
    updateConversation,
    refetch: fetchConversations,
  };
}

/**
 * Hook for client-side conversations (scoped to authenticated user).
 */
export function useClientConversations(channelFilter?: string) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('conversations')
        .select('*')
        .eq('client_user_id', user.id)
        .order('last_message_at', { ascending: false });

      if (channelFilter && channelFilter !== 'all') {
        query = query.eq('channel', channelFilter);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setConversations((data ?? []) as Conversation[]);
    } catch (err) {
      console.error('Error fetching client conversations:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user, channelFilter]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createConversation = async (data: {
    organization_id: string;
    channel: string;
    subject?: string;
  }) => {
    if (!user) throw new Error('Not authenticated');

    const { data: row, error: insertError } = await supabase
      .from('conversations')
      .insert({
        organization_id: data.organization_id,
        client_user_id: user.id,
        channel: data.channel,
        subject: data.subject || null,
        status: 'open',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const newConv = row as Conversation;
    setConversations(prev => [newConv, ...prev]);
    return newConv;
  };

  const updateConversation = async (
    id: string,
    updates: Partial<{
      unread_count_client: number;
    }>
  ) => {
    const payload = { ...updates, updated_at: new Date().toISOString() };

    const { error: updateError } = await supabase
      .from('conversations')
      .update(payload)
      .eq('id', id);

    if (updateError) throw updateError;

    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, ...payload } as Conversation : c))
    );
  };

  return {
    conversations,
    loading,
    error,
    createConversation,
    updateConversation,
    refetch: fetchConversations,
  };
}
