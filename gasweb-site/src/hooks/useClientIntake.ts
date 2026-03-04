import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface ClientIntakeData {
  id: string;
  user_id: string;
  has_domain: boolean | null;
  domain_name: string | null;
  domain_host: string | null;
  domain_host_other: string | null;
  is_registered: boolean | null;
  registration_state: string | null;
  entity_type: string | null;
  business_address_line1: string | null;
  business_address_line2: string | null;
  business_city: string | null;
  business_state: string | null;
  business_zip: string | null;
  has_registered_agent: boolean | null;
  agent_name: string | null;
  agent_address_line1: string | null;
  agent_address_city: string | null;
  agent_address_state: string | null;
  agent_address_zip: string | null;
  has_operating_agreement: boolean | null;
  operating_agreement_url: string | null;
  has_filed_trademark: boolean | null;
  trademark_status: string | null;
  trademark_name: string | null;
  preferred_state_of_origination: string | null;
  created_at: string;
  updated_at: string;
}

export type IntakeFormData = Omit<ClientIntakeData, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export function useClientIntake() {
  const { user } = useAuth();
  const [intake, setIntake] = useState<ClientIntakeData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchIntake = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('client_intake')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    setIntake(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchIntake();
  }, [fetchIntake]);

  const upsertIntake = async (formData: Partial<IntakeFormData>) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('client_intake')
      .upsert(
        { user_id: user.id, ...formData },
        { onConflict: 'user_id' }
      )
      .select()
      .single();
    if (error) throw error;
    setIntake(data);
    return data;
  };

  const markIntakeCompleted = async () => {
    if (!user) return;
    await supabase
      .from('user_profiles')
      .update({ intake_completed: true })
      .eq('id', user.id);
  };

  return { intake, loading, fetchIntake, upsertIntake, markIntakeCompleted };
}
