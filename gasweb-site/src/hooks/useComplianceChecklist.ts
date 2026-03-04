import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface ComplianceItem {
  id: string;
  user_id: string;
  category: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  completed_at: string | null;
  portal_link: string | null;
  created_at: string;
  updated_at: string;
}

export type NewComplianceItem = Pick<
  ComplianceItem,
  'category' | 'title' | 'description' | 'priority' | 'portal_link'
>;

export function useComplianceChecklist() {
  const { user } = useAuth();
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('compliance_checklist_items')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: true });
    setItems(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const updateStatus = async (id: string, status: string) => {
    if (!user) return;
    await supabase
      .from('compliance_checklist_items')
      .update({
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .eq('user_id', user.id);
    await fetchItems();
  };

  const replaceAll = async (newItems: NewComplianceItem[]) => {
    if (!user) return;
    // Delete existing items
    await supabase
      .from('compliance_checklist_items')
      .delete()
      .eq('user_id', user.id);
    // Insert new items
    if (newItems.length > 0) {
      await supabase
        .from('compliance_checklist_items')
        .insert(
          newItems.map((item) => ({
            user_id: user.id,
            ...item,
            status: 'pending',
          }))
        );
    }
    await fetchItems();
  };

  return { items, loading, fetchItems, updateStatus, replaceAll };
}
