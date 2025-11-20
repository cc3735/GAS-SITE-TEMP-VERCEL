import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { useAuth } from '../contexts/AuthContext';

export interface SocialPost {
  id: string;
  organization_id: string;
  account_ids: string[];
  content: string;
  media_urls: string[] | null;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_at: string | null;
  published_at: string | null;
  metrics: any;
  created_at: string;
  updated_at: string;
}

export function useSocial() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!currentOrganization) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching social posts:', error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createPost = async (postData: {
    content: string;
    scheduled_at?: string;
    media_urls?: string[];
  }) => {
    if (!currentOrganization || !user) {
      throw new Error('No organization or user selected');
    }

    try {
      const { data, error } = await supabase
        .from('social_media_posts')
        .insert({
          organization_id: currentOrganization.id,
          content: postData.content,
          scheduled_at: postData.scheduled_at || null,
          media_urls: postData.media_urls || [],
          status: postData.scheduled_at ? 'scheduled' : 'draft',
          created_by: user.id,
          account_ids: [] // Placeholder for future account selection
        })
        .select()
        .single();

      if (error) throw error;
      await fetchPosts();
      return data;
    } catch (error) {
      console.error('Error creating social post:', error);
      throw error;
    }
  };

  return { posts, loading, createPost, refetch: fetchPosts };
}
