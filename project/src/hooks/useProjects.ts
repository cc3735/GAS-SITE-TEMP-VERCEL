import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export function useProjects() {
  const { currentOrganization } = useOrganization();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrganization) return;

    fetchProjects();

    const subscription = supabase
      .channel('projects_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `organization_id=eq.${currentOrganization.id}`,
        },
        () => {
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentOrganization]);

  const fetchProjects = async () => {
    if (!currentOrganization) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
  }) => {
    if (!currentOrganization) return null;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          organization_id: currentOrganization.id,
          name: projectData.name,
          description: projectData.description || null,
          color: projectData.color || '#3B82F6',
          icon: projectData.icon || 'FolderOpen',
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  return { projects, loading, createProject, refetch: fetchProjects };
}
