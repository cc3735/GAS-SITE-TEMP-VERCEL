import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';

export interface Deal {
  id: string;
  created_at: string;
  title: string;
  value: number;
  currency: string;
  status: 'open' | 'won' | 'lost';
  stage_id?: string;
  company_id?: string;
  contact_id?: string;
  organization_id: string;
}

export function useDeals() {
  const { effectiveOrganization } = useOrganization();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!effectiveOrganization) {
      setLoading(false);
      return;
    }

    const fetchDeals = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('deals')
          .select('*')
          .eq('organization_id', effectiveOrganization.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDeals(data || []);
      } catch (err) {
        console.error('Error fetching deals:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('deals_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'deals', 
          filter: `organization_id=eq.${effectiveOrganization.id}` 
        }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDeals(prev => [payload.new as Deal, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setDeals(prev => prev.map(d => d.id === payload.new.id ? payload.new as Deal : d));
          } else if (payload.eventType === 'DELETE') {
            setDeals(prev => prev.filter(d => d.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [effectiveOrganization]);

  return { deals, loading, error };
}
