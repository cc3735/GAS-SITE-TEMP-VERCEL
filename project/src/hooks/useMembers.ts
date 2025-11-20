import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';

export interface Member {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  profile: {
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function useMembers() {
  const { currentOrganization } = useOrganization();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    if (!currentOrganization) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch members and join with user_profiles
      // Note: This assumes a public view or RLS allows reading user_profiles of org members
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          user_profiles (
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('organization_id', currentOrganization.id);

      if (error) throw error;

      const formattedMembers = data.map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        joined_at: m.joined_at,
        profile: m.user_profiles // Supabase returns single object for 1:1 relation
      }));

      setMembers(formattedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [currentOrganization]);

  return { members, loading, refetch: fetchMembers };
}
