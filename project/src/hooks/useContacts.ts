import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { useAuth } from '../contexts/AuthContext';

interface Contact {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  company_id: string | null;
  company_name: string | null;
  date_of_birth: string | null;
  notes: string | null;
  lead_status: string;
  lead_score: number;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export function useContacts() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrganization) return;

    fetchContacts();

    const subscription = supabase
      .channel('contacts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
          filter: `organization_id=eq.${currentOrganization.id}`,
        },
        () => {
          fetchContacts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentOrganization]);

  const fetchContacts = async () => {
    if (!currentOrganization) return;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createContact = async (contactData: {
    first_name: string;
    last_name?: string;
    email?: string;
    phone?: string;
    title?: string;
    company_name?: string;
    date_of_birth?: string;
    notes?: string;
  }) => {
    if (!currentOrganization || !user) return null;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          organization_id: currentOrganization.id,
          first_name: contactData.first_name,
          last_name: contactData.last_name || null,
          email: contactData.email || null,
          phone: contactData.phone || null,
          title: contactData.title || null,
          company_name: contactData.company_name || null,
          date_of_birth: contactData.date_of_birth || null,
          notes: contactData.notes || null,
          lead_status: 'new',
          lead_score: 0,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  };

  const updateContact = async (
    contactId: string,
    contactData: Partial<{
      first_name: string;
      last_name: string | null;
      email: string | null;
      phone: string | null;
      title: string | null;
      company_name: string | null;
      date_of_birth: string | null;
      notes: string | null;
      lead_status: string;
      tags: string[] | null;
    }>
  ) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(contactData)
        .eq('id', contactId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  };

  return { contacts, loading, createContact, updateContact, refetch: fetchContacts };
}
