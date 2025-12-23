import { useEffect, useState, useCallback } from 'react';
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
  const { effectiveOrganization } = useOrganization();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    if (!effectiveOrganization) {
      setContacts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', effectiveOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedContacts: Contact[] = (data || []).map((c: any) => ({
        id: c.id,
        organization_id: c.organization_id,
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        phone: c.phone,
        title: c.title,
        company_id: c.company_id,
        // Ideally we would join with companies table, but for now we store the name in custom_fields
        // to support the simple text input in the UI.
        company_name: c.custom_fields?.company_name || null,
        date_of_birth: c.custom_fields?.date_of_birth || null,
        notes: c.custom_fields?.notes || null,
        lead_status: c.lead_status || 'new',
        lead_score: c.lead_score || 0,
        tags: c.tags,
        created_at: c.created_at,
        updated_at: c.updated_at,
      }));

      setContacts(mappedContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [effectiveOrganization]);

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
    if (!effectiveOrganization || !user) {
      throw new Error('No organization or user selected');
    }

    try {
      const customFields = {
        company_name: contactData.company_name,
        date_of_birth: contactData.date_of_birth,
        notes: contactData.notes
      };

      const { data, error } = await supabase
        .from('contacts')
        .insert({
          organization_id: effectiveOrganization.id,
          first_name: contactData.first_name,
          last_name: contactData.last_name || null,
          email: contactData.email || null,
          phone: contactData.phone || null,
          title: contactData.title || null,
          lead_status: 'new',
          lead_score: 0,
          custom_fields: customFields,
          created_by: user.id,
          // Note: We are not setting company_id here as we don't have a company selection UI yet.
        })
        .select()
        .single();

      if (error) throw error;

      await fetchContacts();
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
      // Fetch current contact to merge custom fields
      const currentContact = contacts.find(c => c.id === contactId);
      const existingCustomFields = {
        company_name: currentContact?.company_name,
        date_of_birth: currentContact?.date_of_birth,
        notes: currentContact?.notes,
      };

      const newCustomFields = {
        ...existingCustomFields,
        ...(contactData.company_name !== undefined && { company_name: contactData.company_name }),
        ...(contactData.date_of_birth !== undefined && { date_of_birth: contactData.date_of_birth }),
        ...(contactData.notes !== undefined && { notes: contactData.notes }),
      };

      const updatePayload: any = {
        updated_at: new Date().toISOString(),
        custom_fields: newCustomFields
      };

      if (contactData.first_name) updatePayload.first_name = contactData.first_name;
      if (contactData.last_name !== undefined) updatePayload.last_name = contactData.last_name;
      if (contactData.email !== undefined) updatePayload.email = contactData.email;
      if (contactData.phone !== undefined) updatePayload.phone = contactData.phone;
      if (contactData.title !== undefined) updatePayload.title = contactData.title;
      if (contactData.lead_status) updatePayload.lead_status = contactData.lead_status;
      if (contactData.tags) updatePayload.tags = contactData.tags;

      const { data, error } = await supabase
        .from('contacts')
        .update(updatePayload)
        .eq('id', contactId)
        .select()
        .single();

      if (error) throw error;
      await fetchContacts();
      return data;
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  };

  return { contacts, loading, createContact, updateContact, refetch: fetchContacts };
}
