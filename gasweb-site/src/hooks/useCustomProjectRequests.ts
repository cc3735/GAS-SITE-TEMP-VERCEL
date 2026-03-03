import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface CustomProjectRequest {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  project_details: string | null;
  priority: string;
  estimated_completion: string | null;
  budget: number | null;
  status: string;
  admin_response: string | null;
  admin_responded_at: string | null;
  created_at: string;
  updated_at: string;
  // joined from user_profiles (OS admin view)
  email?: string;
  full_name?: string | null;
}

export interface CreateRequestData {
  name: string;
  description?: string;
  project_details?: string;
  priority?: string;
  estimated_completion?: string;
  budget?: number;
}

/**
 * Hook for managing custom project requests.
 * @param forCurrentUser - If true, only fetches requests for the logged-in user (GCP).
 *                         If false, fetches all requests with user profile joins (OS admin).
 */
export function useCustomProjectRequests(forCurrentUser = false) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CustomProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('custom_project_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (forCurrentUser) {
        query = query.eq('user_id', user.id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      let rows = (data ?? []) as CustomProjectRequest[];

      // For OS admin view, join user profiles
      if (!forCurrentUser && rows.length > 0) {
        const userIds = [...new Set(rows.map((r) => r.user_id))];
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, email, full_name')
          .in('id', userIds);

        const profileMap = new Map(
          (profiles ?? []).map((p: { id: string; email: string; full_name: string | null }) => [p.id, p])
        );

        rows = rows.map((r) => ({
          ...r,
          email: profileMap.get(r.user_id)?.email ?? 'Unknown',
          full_name: profileMap.get(r.user_id)?.full_name ?? null,
        }));
      }

      setRequests(rows);
    } catch (err) {
      console.error('Error fetching custom project requests:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user, forCurrentUser]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createRequest = async (data: CreateRequestData) => {
    if (!user) throw new Error('Not authenticated');

    const { data: row, error: insertError } = await supabase
      .from('custom_project_requests')
      .insert({
        user_id: user.id,
        name: data.name,
        description: data.description || null,
        project_details: data.project_details || null,
        priority: data.priority || 'medium',
        estimated_completion: data.estimated_completion || null,
        budget: data.budget || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    setRequests((prev) => [row as CustomProjectRequest, ...prev]);
    return row as CustomProjectRequest;
  };

  const updateRequest = async (
    id: string,
    updates: { status?: string; admin_response?: string }
  ) => {
    const payload: Record<string, unknown> = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (updates.admin_response !== undefined) {
      payload.admin_responded_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('custom_project_requests')
      .update(payload)
      .eq('id', id);

    if (updateError) throw updateError;

    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...payload } as CustomProjectRequest : r))
    );
  };

  return {
    requests,
    loading,
    error,
    createRequest,
    updateRequest,
    refetch: fetchRequests,
  };
}
