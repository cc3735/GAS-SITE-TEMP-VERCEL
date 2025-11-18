import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { useAuth } from '../contexts/AuthContext';

interface Company {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  size: string | null;
  address: string | null;
  phone: string | null;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  created_at: string;
}

export function useCompanies() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrganization) return;

    fetchCompanies();

    const subscription = supabase
      .channel('companies_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'companies',
          filter: `organization_id=eq.${currentOrganization.id}`,
        },
        () => {
          fetchCompanies();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentOrganization]);

  const fetchCompanies = async () => {
    if (!currentOrganization) return;

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCompany = async (companyData: {
    name: string;
    domain?: string;
    industry?: string;
    website?: string;
    phone?: string;
    description?: string;
  }) => {
    if (!currentOrganization || !user) return null;

    try {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          organization_id: currentOrganization.id,
          name: companyData.name,
          domain: companyData.domain || null,
          industry: companyData.industry || null,
          website: companyData.website || null,
          phone: companyData.phone || null,
          description: companyData.description || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  };

  return { companies, loading, createCompany, refetch: fetchCompanies };
}
