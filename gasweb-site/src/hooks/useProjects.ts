import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { useAuth } from '../contexts/AuthContext';

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  status: string;
  estimated_completion: string | null;
  tools_used: string[] | null;
  proposed_tech: string[] | null;
  project_details: any | null;
  cost_to_operate: number | null;
  gas_fee: number | null;
  budget: number | null;
  priority: string;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  start_date: string | null;
  end_date: string | null;
  color: string | null;
  icon: string | null;
  owner_id: string | null;
  workspace_id: string | null;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  const fetchProjects = useCallback(async () => {
    if (!currentOrganization) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setProjects((data ?? []) as Project[]);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (projectData: {
    name: string;
    description?: string;
    estimated_completion?: string;
    tools_used?: string[];
    proposed_tech?: string[];
    project_details?: any;
    cost_to_operate?: number;
    gas_fee?: number;
    budget?: number;
    start_date?: string;
    end_date?: string;
    priority?: string;
    assigned_to?: string;
  }) => {
    if (!currentOrganization) throw new Error('No organization selected');
    if (!user) throw new Error('Not authenticated');

    const { data: row, error: insertError } = await supabase
      .from('projects')
      .insert({
        organization_id: currentOrganization.id,
        name: projectData.name,
        description: projectData.description || null,
        status: 'planning',
        estimated_completion: projectData.estimated_completion || null,
        tools_used: projectData.tools_used || null,
        proposed_tech: projectData.proposed_tech || null,
        project_details: projectData.project_details || null,
        cost_to_operate: projectData.cost_to_operate || null,
        gas_fee: projectData.gas_fee || null,
        budget: projectData.budget || null,
        priority: projectData.priority || 'medium',
        assigned_to: projectData.assigned_to || null,
        start_date: projectData.start_date || null,
        end_date: projectData.end_date || null,
        created_by: user.id,
        owner_id: user.id,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const newProject = row as Project;
    setProjects((prev) => [newProject, ...prev]);
    return newProject;
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    const payload = { ...updates, updated_at: new Date().toISOString() };

    const { error: updateError } = await supabase
      .from('projects')
      .update(payload)
      .eq('id', projectId);

    if (updateError) throw updateError;

    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, ...payload } as Project : p))
    );

    return { ...projects.find((p) => p.id === projectId), ...payload } as Project;
  };

  const deleteProject = async (projectId: string) => {
    // Soft delete — set deleted_at, item stays in DB for 60 days
    const { error: deleteError } = await supabase
      .from('projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', projectId);

    if (deleteError) throw deleteError;

    // Remove from local state immediately
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  };
}
