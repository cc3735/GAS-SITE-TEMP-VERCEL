import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { LeadIntakeEvent, LeadState, NudgeCampaign, NudgeExecution } from '../types/intakeNudge';

export function useIntakeDashboard() {
  const { currentOrganization } = useOrganization();
  const [events, setEvents] = useState<LeadIntakeEvent[]>([]);
  const [stats, setStats] = useState({
    totalLeads: 0,
    highIntent: 0,
    ghosting: 0,
    converted: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrganization) {
        setLoading(false);
        return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Mock data for now, replacing with real fetch later
        const mockEvents: LeadIntakeEvent[] = [
            { id: '1', eventType: 'form_submit', source: 'landing_page', intentCategory: 'high_value', intentScore: 90, eventData: {}, createdAt: new Date().toISOString() },
            { id: '2', eventType: 'page_view', source: 'website', intentCategory: 'browsing', intentScore: 30, eventData: {}, createdAt: new Date(Date.now() - 3600000).toISOString() },
            { id: '3', eventType: 'cart_abandon', source: 'shopify', intentCategory: 'engaged', intentScore: 75, eventData: {}, createdAt: new Date(Date.now() - 7200000).toISOString() },
        ];
        setEvents(mockEvents);

        setStats({
            totalLeads: 142,
            highIntent: 24,
            ghosting: 18,
            converted: 56
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentOrganization]);

  return { events, stats, loading };
}

export function useNudgeCampaigns() {
  const { currentOrganization } = useOrganization();
  const [campaigns, setCampaigns] = useState<NudgeCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrganization) {
        setLoading(false);
        return;
    }

    const fetchCampaigns = async () => {
        try {
            // Mock data
            const mockCampaigns: NudgeCampaign[] = [
                { 
                    id: '1', 
                    name: 'Cart Abandonment Rescue', 
                    triggerState: 'ghosting', 
                    delayHours: 2, 
                    channel: 'email', 
                    contentTemplate: { body: 'Hey, you left something behind!' }, 
                    isActive: true,
                    totalSent: 124,
                    totalConverted: 15
                },
                { 
                    id: '2', 
                    name: 'SMS Re-engagement', 
                    triggerState: 'ghosting', 
                    delayHours: 24, 
                    channel: 'sms', 
                    contentTemplate: { body: 'Still interested? 10% off expires soon.' }, 
                    isActive: true,
                    totalSent: 50,
                    totalConverted: 8
                }
            ];
            setCampaigns(mockCampaigns);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    fetchCampaigns();
  }, [currentOrganization]);

  return { campaigns, loading };
}
