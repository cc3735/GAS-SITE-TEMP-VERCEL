import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { useAuth } from '../contexts/AuthContext';

export interface ChannelIntegration {
  id: string;
  organization_id: string;
  channel_type: 'email' | 'sms' | 'voicemail' | 'social';
  provider: string;
  config: Record<string, any>;
  is_active: boolean;
  last_verified_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useChannelIntegrations() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<ChannelIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    if (!currentOrganization) {
      setIntegrations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('channel_integrations')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('channel_type', { ascending: true });

      if (fetchError) throw fetchError;

      setIntegrations((data ?? []) as ChannelIntegration[]);
    } catch (err) {
      console.error('Error fetching channel integrations:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const saveIntegration = async (data: {
    channel_type: string;
    provider: string;
    config: Record<string, any>;
    is_active?: boolean;
  }) => {
    if (!currentOrganization) throw new Error('No organization selected');
    if (!user) throw new Error('Not authenticated');

    // Upsert by org + channel_type + provider
    const { data: row, error: upsertError } = await supabase
      .from('channel_integrations')
      .upsert(
        {
          organization_id: currentOrganization.id,
          channel_type: data.channel_type,
          provider: data.provider,
          config: data.config,
          is_active: data.is_active ?? false,
          created_by: user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id,channel_type,provider' }
      )
      .select()
      .single();

    if (upsertError) throw upsertError;

    const saved = row as ChannelIntegration;
    setIntegrations(prev => {
      const idx = prev.findIndex(
        i => i.channel_type === saved.channel_type && i.provider === saved.provider
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [...prev, saved];
    });

    return saved;
  };

  const deleteIntegration = async (id: string) => {
    const { error: deleteError } = await supabase
      .from('channel_integrations')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    setIntegrations(prev => prev.filter(i => i.id !== id));
  };

  const testIntegration = async (data: {
    channel_type: string;
    provider: string;
    config: Record<string, any>;
    test_recipient?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('test-integration', {
        body: {
          organization_id: currentOrganization?.id,
          channel_type: data.channel_type,
          provider: data.provider,
          config: data.config,
          test_recipient: data.test_recipient,
        },
      });

      if (fnError) return { success: false, error: fnError.message };
      return result as { success: boolean; error?: string };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  };

  const getIntegration = (channelType: string, provider?: string): ChannelIntegration | undefined => {
    return integrations.find(i =>
      i.channel_type === channelType && (provider ? i.provider === provider : true)
    );
  };

  return {
    integrations,
    loading,
    error,
    saveIntegration,
    deleteIntegration,
    testIntegration,
    getIntegration,
    refetch: fetchIntegrations,
  };
}
