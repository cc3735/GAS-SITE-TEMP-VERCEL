import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { useAuth } from '../contexts/AuthContext';
import { emailService } from '../lib/emailService';

export interface Campaign {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  campaign_type: 'email' | 'sms' | 'workflow' | 'landing_page';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  target_audience: any;
  content: any;
  settings: any;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  metrics: {
    sent?: number;
    opened?: number;
    clicked?: number;
    converted?: number;
  };
  created_at: string;
  updated_at: string;
}

export function useCampaigns() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    if (!currentOrganization) {
      setCampaigns([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const createCampaign = async (campaignData: {
    name: string;
    description?: string;
    campaign_type: 'email' | 'sms' | 'workflow' | 'landing_page';
    content?: any;
    settings?: any;
    scheduled_at?: string;
  }) => {
    if (!currentOrganization || !user) {
      throw new Error('No organization or user selected');
    }

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          organization_id: currentOrganization.id,
          name: campaignData.name,
          description: campaignData.description || null,
          campaign_type: campaignData.campaign_type,
          status: 'draft',
          content: campaignData.content || {},
          settings: campaignData.settings || {},
          scheduled_at: campaignData.scheduled_at || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchCampaigns();
      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  };

  const sendCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) throw new Error('Campaign not found');

    // In a real app, fetch recipients from 'target_audience' logic
    const recipients = ['test@example.com']; // Mock recipients

    const result = await emailService.send({
      to: recipients,
      subject: campaign.settings?.subject || campaign.name,
      html: campaign.content?.body || `<p>Campaign Content for ${campaign.name}</p>`
    });

    if (result.success) {
      // Update status to 'active' (sent)
      await supabase
        .from('campaigns')
        .update({ status: 'active', started_at: new Date().toISOString() })
        .eq('id', campaignId);
      await fetchCampaigns();
    }
    
    return result;
  };

  return { campaigns, loading, createCampaign, sendCampaign, refetch: fetchCampaigns };
}
