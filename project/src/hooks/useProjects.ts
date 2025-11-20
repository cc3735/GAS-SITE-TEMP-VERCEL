import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';

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

  const fetchProjects = useCallback(async () => {
    if (!currentOrganization) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedProjects: Project[] = (data || []).map((p: any) => ({
        id: p.id,
        organization_id: p.organization_id,
        name: p.name,
        description: p.description,
        status: p.status,
        estimated_completion: p.custom_fields?.estimated_completion || null,
        tools_used: p.custom_fields?.tools_used || null,
        proposed_tech: p.custom_fields?.proposed_tech || null,
        project_details: p.custom_fields?.project_details || null,
        cost_to_operate: p.custom_fields?.cost_to_operate || null,
        gas_fee: p.custom_fields?.gas_fee || null,
        budget: p.budget,
        priority: p.priority || 'medium',
        assigned_to: p.owner_id, // Map owner to assigned_to
        created_by: p.created_by,
        created_at: p.created_at,
        updated_at: p.updated_at,
        start_date: p.start_date,
        end_date: p.end_date,
        color: p.color,
        icon: p.icon,
        owner_id: p.owner_id,
        workspace_id: p.workspace_id
      }));

      setProjects(mappedProjects);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.message);
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
    if (!currentOrganization) {
      throw new Error('No organization selected');
    }

    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      const customFields = {
        estimated_completion: projectData.estimated_completion,
        tools_used: projectData.tools_used,
        proposed_tech: projectData.proposed_tech,
        project_details: projectData.project_details,
        cost_to_operate: projectData.cost_to_operate,
        gas_fee: projectData.gas_fee
      };

      const { data, error } = await supabase
        .from('projects')
        .insert({
          organization_id: currentOrganization.id,
          name: projectData.name,
          description: projectData.description,
          status: 'planning',
          budget: projectData.budget,
          priority: projectData.priority || 'medium',
          start_date: projectData.start_date,
          end_date: projectData.end_date,
          owner_id: projectData.assigned_to || user?.id,
          created_by: user?.id,
          custom_fields: customFields
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh list
      await fetchProjects();
      return data;
    } catch (err: any) {
      console.error('Error creating project:', err);
      throw err;
    }
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      // Extract custom fields from updates if they exist
      const customFieldKeys = [
        'estimated_completion', 
        'tools_used', 
        'proposed_tech', 
        'project_details', 
        'cost_to_operate', 
        'gas_fee'
      ];
      
      const customFieldsUpdate: any = {};
      let hasCustomFields = false;

      // We need to fetch current custom_fields first to merge, or just patch carefully.
      // Ideally, we merge with existing custom_fields.
      
      // Separate top-level columns from custom fields
      const dbUpdates: any = {};
      
      Object.entries(updates).forEach(([key, value]) => {
        if (customFieldKeys.includes(key)) {
          customFieldsUpdate[key] = value;
          hasCustomFields = true;
        } else if (key === 'assigned_to') {
            dbUpdates.owner_id = value;
        } else if (key !== 'id' && key !== 'organization_id' && key !== 'created_at' && key !== 'created_by') {
           // Map allowed DB columns
           dbUpdates[key] = value;
        }
      });

      if (hasCustomFields) {
        // Fetch current project to merge custom fields
        const currentProject = projects.find(p => p.id === projectId);
        const existingCustomFields = {
            estimated_completion: currentProject?.estimated_completion,
            tools_used: currentProject?.tools_used,
            proposed_tech: currentProject?.proposed_tech,
            project_details: currentProject?.project_details,
            cost_to_operate: currentProject?.cost_to_operate,
            gas_fee: currentProject?.gas_fee,
        };
        dbUpdates.custom_fields = { ...existingCustomFields, ...customFieldsUpdate };
      }

      const { data, error } = await supabase
        .from('projects')
        .update(dbUpdates)
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;

      await fetchProjects();
      return data;
    } catch (err: any) {
      console.error('Error updating project:', err);
      throw err;
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      
      setProjects(prev => prev.filter(project => project.id !== projectId));
    } catch (err: any) {
      console.error('Error deleting project:', err);
      throw err;
    }
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
