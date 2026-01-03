import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';

export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: string;
  token: string;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  organization?: {
    name: string;
    slug: string;
  };
  inviter?: {
    email: string;
  };
}

export function useInvitations(organizationId?: string) {
  const { currentOrganization, isMasterContext } = useOrganization();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveOrgId = organizationId || currentOrganization?.id;

  const fetchInvitations = useCallback(async () => {
    if (!effectiveOrgId && !isMasterContext) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      let query = supabase
        .from('organization_invitations')
        .select(`
          *,
          organizations!inner(name, slug)
        `)
        .order('created_at', { ascending: false });

      // If not master admin viewing all, filter by org
      if (effectiveOrgId && !isMasterContext) {
        query = query.eq('organization_id', effectiveOrgId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setInvitations(data?.map(inv => ({
        ...inv,
        organization: inv.organizations,
      })) || []);
    } catch (err: any) {
      console.error('Error fetching invitations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [effectiveOrgId, isMasterContext]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const sendInvitation = async (email: string, role: string, orgId?: string): Promise<{ success: boolean; error?: string }> => {
    const targetOrgId = orgId || effectiveOrgId;
    if (!targetOrgId) {
      return { success: false, error: 'No organization selected' };
    }

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated' };
      }

      // Call the edge function
      const response = await supabase.functions.invoke('send-invitation', {
        body: {
          organization_id: targetOrgId,
          email,
          role,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to send invitation');
      }

      // Refresh the list
      await fetchInvitations();

      return { success: true };
    } catch (err: any) {
      console.error('Error sending invitation:', err);
      return { success: false, error: err.message };
    }
  };

  const cancelInvitation = async (invitationId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error: deleteError } = await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', invitationId);

      if (deleteError) throw deleteError;

      // Refresh the list
      await fetchInvitations();

      return { success: true };
    } catch (err: any) {
      console.error('Error canceling invitation:', err);
      return { success: false, error: err.message };
    }
  };

  const resendInvitation = async (invitationId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get the invitation details
      const invitation = invitations.find(inv => inv.id === invitationId);
      if (!invitation) {
        return { success: false, error: 'Invitation not found' };
      }

      // Delete old invitation
      const { error: deleteError } = await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', invitationId);

      if (deleteError) throw deleteError;

      // Send new invitation
      return await sendInvitation(invitation.email, invitation.role, invitation.organization_id);
    } catch (err: any) {
      console.error('Error resending invitation:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    invitations,
    loading,
    error,
    sendInvitation,
    cancelInvitation,
    resendInvitation,
    refetch: fetchInvitations,
  };
}

