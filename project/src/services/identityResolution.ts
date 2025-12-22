import { supabase } from '../lib/supabase';
import { CustomerProfile, IdentityLink } from '../types/missionControl';

interface IdentityData {
  email?: string;
  phone?: string;
  name?: string;
  company?: string;
  platform: string;
  platformId: string;
  organizationId: string;
}

export const resolveIdentity = async (data: IdentityData): Promise<CustomerProfile | null> => {
  // 1. Exact Email Match
  if (data.email) {
    const { data: profile } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('organization_id', data.organizationId)
      .eq('primary_email', data.email)
      .single();
    
    if (profile) return profile;
  }

  // 2. Exact Phone Match
  if (data.phone) {
    const { data: profile } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('organization_id', data.organizationId)
      .eq('primary_phone', data.phone)
      .single();

    if (profile) return profile;
  }

  // 3. Check Identity Links
  const { data: link } = await supabase
    .from('identity_links')
    .select('customer_profile_id')
    .eq('organization_id', data.organizationId)
    .eq('platform', data.platform)
    .eq('platform_id', data.platformId)
    .single();

  if (link) {
    const { data: profile } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('id', link.customer_profile_id)
      .single();
    
    if (profile) return profile;
  }

  // 4. Create New Profile if no match (Simplified logic)
  const { data: newProfile, error } = await supabase
    .from('customer_profiles')
    .insert({
      organization_id: data.organizationId,
      primary_email: data.email,
      primary_phone: data.phone,
      primary_name: data.name,
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error);
    return null;
  }

  // Link identity
  await supabase
    .from('identity_links')
    .insert({
      organization_id: data.organizationId,
      customer_profile_id: newProfile.id,
      platform: data.platform,
      platform_id: data.platformId,
      verification_status: 'verified' // Assuming verified for now
    });

  return newProfile;
};

export const linkIdentity = async (
  profileId: string, 
  platform: string, 
  platformId: string, 
  organizationId: string
): Promise<void> => {
  await supabase.from('identity_links').insert({
    organization_id: organizationId,
    customer_profile_id: profileId,
    platform,
    platform_id: platformId
  });
};
