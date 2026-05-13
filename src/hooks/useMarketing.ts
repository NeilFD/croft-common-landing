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
