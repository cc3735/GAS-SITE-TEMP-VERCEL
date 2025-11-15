import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { useAuth } from '../contexts/AuthContext';

interface Task {
  id: string;
  project_id: string;
  list_id: string | null;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  position: number;
  assigned_to: string[] | null;
  tags: string[] | null;
  created_at: string;
}

export function useTasks(projectId: string | null) {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrganization || !projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    fetchTasks();

    const subscription = supabase
      .channel('tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentOrganization, projectId]);

  const fetchTasks = async () => {
    if (!currentOrganization || !projectId) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('project_id', projectId)
        .order('position', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: {
    name: string;
    description?: string;
    status?: string;
    priority?: string;
    list_id?: string;
  }) => {
    if (!currentOrganization || !projectId || !user) return null;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          organization_id: currentOrganization.id,
          project_id: projectId,
          name: taskData.name,
          description: taskData.description || null,
          status: taskData.status || 'todo',
          priority: taskData.priority || 'medium',
          list_id: taskData.list_id || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  return { tasks, loading, createTask, updateTask, deleteTask, refetch: fetchTasks };
}
