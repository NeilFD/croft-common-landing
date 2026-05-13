import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MarketingChannel, MarketingPost, MarketingCampaign, MarketingStatus } from '@/lib/marketing/types';

export const useMarketingChannels = () =>
  useQuery({
    queryKey: ['marketing', 'channels'],
    queryFn: async (): Promise<MarketingChannel[]> => {
      const { data, error } = await (supabase as any)
        .from('marketing_channels')
        .select('*')
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data || [];
    },
  });

export const useMarketingPosts = (range: { from: string; to: string }) =>
  useQuery({
    queryKey: ['marketing', 'posts', range.from, range.to],
    queryFn: async (): Promise<MarketingPost[]> => {
      const { data, error } = await (supabase as any)
        .from('marketing_posts')
        .select('*, marketing_post_channels(channel_key), marketing_post_assets(marketing_assets(url))')
        .gte('scheduled_at', range.from)
        .lte('scheduled_at', range.to)
        .order('scheduled_at');
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        channels: (p.marketing_post_channels || []).map((c: any) => c.channel_key),
        asset_urls: (p.marketing_post_assets || []).map((a: any) => a.marketing_assets?.url).filter(Boolean),
      }));
    },
  });

export const useMarketingPost = (id: string | null) =>
  useQuery({
    queryKey: ['marketing', 'post', id],
    enabled: !!id,
    queryFn: async (): Promise<MarketingPost | null> => {
      if (!id) return null;
      const { data, error } = await (supabase as any)
        .from('marketing_posts')
        .select('*, marketing_post_channels(channel_key, body_override), marketing_post_assets(sort_order, marketing_assets(id, url, alt_text))')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        channels: (data.marketing_post_channels || []).map((c: any) => c.channel_key),
        asset_urls: (data.marketing_post_assets || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((a: any) => a.marketing_assets?.url)
          .filter(Boolean),
      };
    },
  });

export const useMarketingCampaigns = () =>
  useQuery({
    queryKey: ['marketing', 'campaigns'],
    queryFn: async (): Promise<MarketingCampaign[]> => {
      const { data, error } = await (supabase as any)
        .from('marketing_campaigns')
        .select('*')
        .order('start_date', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data || [];
    },
  });

export const useUpsertPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id?: string;
      title?: string | null;
      body?: string | null;
      scheduled_at?: string | null;
      status?: MarketingStatus;
      property_tag?: string | null;
      campaign_id?: string | null;
      hashtags?: string[];
      cta_text?: string | null;
      cta_url?: string | null;
      content_pillar?: string | null;
      channels?: string[];
    }) => {
      const { channels, id, ...rest } = payload;
      let postId = id;
      if (postId) {
        const { error } = await (supabase as any).from('marketing_posts').update(rest).eq('id', postId);
        if (error) throw error;
      } else {
        const { data, error } = await (supabase as any)
          .from('marketing_posts')
          .insert(rest)
          .select('id')
          .single();
        if (error) throw error;
        postId = data.id;
      }
      if (channels) {
        await (supabase as any).from('marketing_post_channels').delete().eq('post_id', postId);
        if (channels.length) {
          const rows = channels.map((c) => ({ post_id: postId, channel_key: c }));
          const { error } = await (supabase as any).from('marketing_post_channels').insert(rows);
          if (error) throw error;
        }
      }
      return postId;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing'] }),
  });
};

export const useDeletePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('marketing_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing'] }),
  });
};

export interface MarketingComment {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string;
  body: string;
  mentions: string[] | null;
  created_at: string;
  author?: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null;
}

export const useMarketingComments = (postId: string | null) =>
  useQuery({
    queryKey: ['marketing', 'comments', postId],
    enabled: !!postId,
    queryFn: async (): Promise<MarketingComment[]> => {
      if (!postId) return [];
      const { data, error } = await (supabase as any)
        .from('marketing_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const rows = data || [];
      const ids = Array.from(new Set(rows.map((r: any) => r.author_id))) as string[];
      let profiles: Record<string, any> = {};
      if (ids.length) {
        const { data: profs } = await (supabase as any).rpc('get_profiles_public', { uids: ids });
        (profs || []).forEach((p: any) => { profiles[p.user_id] = p; });
      }
      return rows.map((r: any) => ({ ...r, author: profiles[r.author_id] || null }));
    },
  });

export const useAddComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { post_id: string; body: string; parent_id?: string | null; mentions?: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await (supabase as any).from('marketing_comments').insert({
        post_id: payload.post_id,
        body: payload.body,
        parent_id: payload.parent_id || null,
        mentions: payload.mentions || [],
        author_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['marketing', 'comments', vars.post_id] }),
  });
};

export const useDeleteComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; post_id: string }) => {
      const { error } = await (supabase as any).from('marketing_comments').delete().eq('id', payload.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['marketing', 'comments', vars.post_id] }),
  });
};

export interface MarketingStatusLogEntry {
  id: string;
  post_id: string;
  from_status: string | null;
  to_status: string;
  author_id: string | null;
  note: string | null;
  created_at: string;
}

export const useMarketingStatusLog = (postId: string | null) =>
  useQuery({
    queryKey: ['marketing', 'statuslog', postId],
    enabled: !!postId,
    queryFn: async (): Promise<MarketingStatusLogEntry[]> => {
      if (!postId) return [];
      const { data, error } = await (supabase as any)
        .from('marketing_status_log')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

export const useUpsertCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<MarketingCampaign> & { id?: string }) => {
      const { id, ...rest } = payload;
      if (id) {
        const { error } = await (supabase as any).from('marketing_campaigns').update(rest).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await (supabase as any).from('marketing_campaigns').insert(rest).select('id').single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing', 'campaigns'] }),
  });
};

export const useDeleteCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('marketing_campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing', 'campaigns'] }),
  });
};

export interface MarketingAsset {
  id: string;
  url: string;
  kind: string | null;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  tags: string[] | null;
  created_by: string | null;
  created_at: string;
}

export const useMarketingAssets = () =>
  useQuery({
    queryKey: ['marketing', 'assets'],
    queryFn: async (): Promise<MarketingAsset[]> => {
      const { data, error } = await (supabase as any)
        .from('marketing_assets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

export const useUploadAsset = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<MarketingAsset> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('marketing-assets').upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('marketing-assets').getPublicUrl(path);
      const kind = file.type.startsWith('video') ? 'video' : 'image';
      const { data, error } = await (supabase as any).from('marketing_assets').insert({
        url: pub.publicUrl,
        kind,
        created_by: user.id,
      }).select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing', 'assets'] }),
  });
};

export const useDeleteAsset = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('marketing_assets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing', 'assets'] }),
  });
};
