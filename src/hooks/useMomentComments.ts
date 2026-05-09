import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const ALLOWED_EMOJI = ['❤️', '🔥', '😂', '👏', '🐻', '✨'] as const;
export type Emoji = typeof ALLOWED_EMOJI[number];

export interface CommentReactionAgg {
  emoji: Emoji;
  count: number;
  mine: boolean;
}

export interface MomentComment {
  id: string;
  moment_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author_name: string;
  reactions: CommentReactionAgg[];
  replies: MomentComment[];
}

interface RawComment {
  id: string;
  moment_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

interface RawReaction {
  comment_id: string;
  user_id: string;
  emoji: string;
}

interface RawProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
}

const buildName = (p?: RawProfile | null) => {
  if (!p) return 'Member';
  const n = `${p.first_name || ''} ${p.last_name || ''}`.trim();
  return n || 'Member';
};

const buildTree = (
  rows: RawComment[],
  reactions: RawReaction[],
  profiles: Map<string, RawProfile>,
  myId: string | null,
): MomentComment[] => {
  const reactionMap = new Map<string, Map<Emoji, { count: number; mine: boolean }>>();
  for (const r of reactions) {
    if (!ALLOWED_EMOJI.includes(r.emoji as Emoji)) continue;
    if (!reactionMap.has(r.comment_id)) reactionMap.set(r.comment_id, new Map());
    const m = reactionMap.get(r.comment_id)!;
    const prev = m.get(r.emoji as Emoji) || { count: 0, mine: false };
    m.set(r.emoji as Emoji, {
      count: prev.count + 1,
      mine: prev.mine || r.user_id === myId,
    });
  }

  const nodes = new Map<string, MomentComment>();
  rows.forEach((row) => {
    const aggMap = reactionMap.get(row.id);
    const reactions: CommentReactionAgg[] = aggMap
      ? Array.from(aggMap.entries())
          .map(([emoji, v]) => ({ emoji, count: v.count, mine: v.mine }))
          .sort((a, b) => ALLOWED_EMOJI.indexOf(a.emoji) - ALLOWED_EMOJI.indexOf(b.emoji))
      : [];
    nodes.set(row.id, {
      ...row,
      author_name: buildName(profiles.get(row.user_id)),
      reactions,
      replies: [],
    });
  });

  const roots: MomentComment[] = [];
  nodes.forEach((n) => {
    if (n.parent_id && nodes.has(n.parent_id)) {
      nodes.get(n.parent_id)!.replies.push(n);
    } else {
      roots.push(n);
    }
  });
  // Oldest first
  const sortByDate = (a: MomentComment, b: MomentComment) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  roots.sort(sortByDate);
  nodes.forEach((n) => n.replies.sort(sortByDate));
  return roots;
};

export const useMomentComments = (momentId: string | null) => {
  const [comments, setComments] = useState<MomentComment[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
  }, []);

  const fetchAll = useCallback(async () => {
    if (!momentId) return;
    setLoading(true);
    try {
      const { data: rows } = await (supabase as any)
        .from('moment_comments')
        .select('*')
        .eq('moment_id', momentId)
        .order('created_at', { ascending: true });
      const list: RawComment[] = rows || [];
      setCount(list.filter((r) => !r.is_deleted).length);

      if (!list.length) {
        setComments([]);
        return;
      }
      const ids = list.map((r) => r.id);
      const userIds = Array.from(new Set(list.map((r) => r.user_id)));

      const [{ data: rxns }, { data: profs }] = await Promise.all([
        (supabase as any)
          .from('moment_comment_reactions')
          .select('comment_id, user_id, emoji')
          .in('comment_id', ids),
        (supabase as any)
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds),
      ]);

      const profMap = new Map<string, RawProfile>();
      (profs || []).forEach((p: RawProfile) => profMap.set(p.user_id, p));
      setComments(buildTree(list, rxns || [], profMap, myId));
    } finally {
      setLoading(false);
    }
  }, [momentId, myId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Realtime
  useEffect(() => {
    if (!momentId) return;
    const ch = supabase
      .channel(`moment-comments-${momentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'moment_comments', filter: `moment_id=eq.${momentId}` },
        () => fetchAll(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'moment_comment_reactions' },
        () => fetchAll(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [momentId, fetchAll]);

  const addComment = useCallback(
    async (body: string, parentId?: string | null) => {
      if (!momentId) return;
      const trimmed = body.trim();
      if (!trimmed) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Sign in to comment', variant: 'destructive' });
        return;
      }
      const { error } = await (supabase as any).from('moment_comments').insert([
        { moment_id: momentId, user_id: user.id, parent_id: parentId || null, body: trimmed.slice(0, 500) },
      ]);
      if (error) {
        toast({ title: 'Could not post comment', description: error.message, variant: 'destructive' });
        return;
      }
      fetchAll();
    },
    [momentId, toast, fetchAll],
  );

  const editComment = useCallback(
    async (id: string, body: string) => {
      const trimmed = body.trim().slice(0, 500);
      if (!trimmed) return;
      const { error } = await (supabase as any)
        .from('moment_comments')
        .update({ body: trimmed })
        .eq('id', id);
      if (error) {
        toast({ title: 'Could not edit', description: error.message, variant: 'destructive' });
      }
    },
    [toast],
  );

  const deleteComment = useCallback(
    async (id: string) => {
      const { error } = await (supabase as any)
        .from('moment_comments')
        .update({ body: '[deleted]', is_deleted: true })
        .eq('id', id);
      if (error) {
        toast({ title: 'Could not delete', description: error.message, variant: 'destructive' });
      }
    },
    [toast],
  );

  const toggleReaction = useCallback(
    async (commentId: string, emoji: Emoji) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Find current state
      const findReaction = (list: MomentComment[]): CommentReactionAgg | undefined => {
        for (const c of list) {
          if (c.id === commentId) return c.reactions.find((r) => r.emoji === emoji);
          const nested = findReaction(c.replies);
          if (nested) return nested;
        }
      };
      const existing = findReaction(comments);
      if (existing?.mine) {
        await (supabase as any)
          .from('moment_comment_reactions')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id)
          .eq('emoji', emoji);
      } else {
        await (supabase as any)
          .from('moment_comment_reactions')
          .insert([{ comment_id: commentId, user_id: user.id, emoji }]);
      }
    },
    [comments],
  );

  const memoCount = useMemo(() => count, [count]);

  return {
    comments,
    count: memoCount,
    loading,
    myId,
    addComment,
    editComment,
    deleteComment,
    toggleReaction,
  };
};
