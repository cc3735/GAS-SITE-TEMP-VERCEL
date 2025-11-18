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
  start_date: string | null;
  end_date: string | null;
  priority: string;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentOrganization } = useOrganization();

  const fetchProjects = useCallback(async () => {
    // Temporary mock data until database is properly set up
    if (!currentOrganization) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setProjects([
        {
          id: 'demo-1',
          organization_id: currentOrganization.id,
          name: 'Website Redesign',
          description: 'Complete overhaul of company website',
          status: 'planning',
          estimated_completion: '1-3-months',
          tools_used: ['React', 'Next.js'],
          proposed_tech: ['Tailwind CSS'],
          project_details: 'Modern, responsive website with improved UX',
          cost_to_operate: 2500.00,
          gas_fee: 150.00,
          budget: 10000.00,
          priority: 'high',
          created_by: 'demo-user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          start_date: null,
          end_date: null,
          assigned_to: null
        }
      ]);
      setLoading(false);
      setError(null);
    }, 500);
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
    // Mock successful creation
    if (!currentOrganization) {
      throw new Error('No organization selected');
    }

    const newProject = {
      id: `project-${Date.now()}`,
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
      assigned_to: null,
      created_by: 'demo-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      start_date: null,
      end_date: null
    };

    setProjects(prev => [newProject, ...prev]);

    return newProject;
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    // Mock update
    const updatedProject = { ...projects.find(p => p.id === projectId), ...updates } as Project;
    setProjects(prev => prev.map(project =>
      project.id === projectId ? updatedProject : project
    ));
    return updatedProject;
  };

  const deleteProject = async (projectId: string) => {
    // Mock delete
    setProjects(prev => prev.filter(project => project.id !== projectId));
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
