import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { useAuth } from '../contexts/AuthContext';

export interface Contact {
  id: string;
  organization_id: string;
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
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    if (!currentOrganization) {
      setContacts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('id, organization_id, first_name, last_name, email, phone, title, company_id, company_name, date_of_birth, notes, lead_status, lead_score, tags, created_at, updated_at')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setContacts((data ?? []) as Contact[]);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

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
    if (!currentOrganization) throw new Error('No organization selected');
    if (!user) throw new Error('Not authenticated');

    const { data: row, error: insertError } = await supabase
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
      .select('id, organization_id, first_name, last_name, email, phone, title, company_id, company_name, date_of_birth, notes, lead_status, lead_score, tags, created_at, updated_at')
      .single();

    if (insertError) throw insertError;

    const newContact = row as Contact;
    setContacts((prev) => [newContact, ...prev]);
    return newContact;
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
    const payload = { ...contactData, updated_at: new Date().toISOString() };

    const { data, error: updateError } = await supabase
      .from('contacts')
      .update(payload)
      .eq('id', contactId)
      .select('id, organization_id, first_name, last_name, email, phone, title, company_id, company_name, date_of_birth, notes, lead_status, lead_score, tags, created_at, updated_at')
      .single();

    if (updateError) throw updateError;

    const updated = data as Contact;
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? updated : c))
    );
    return updated;
  };

  const deleteContact = async (contactId: string) => {
    // Soft delete — set deleted_at, item stays in DB for 60 days
    const { error: deleteError } = await supabase
      .from('contacts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', contactId);

    if (deleteError) throw deleteError;

    // Remove from local state immediately
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
  };

  return { contacts, loading, error, createContact, updateContact, deleteContact, refetch: fetchContacts };
}
