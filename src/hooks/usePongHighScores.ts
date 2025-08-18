import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PongScore {
  id: string;
  user_id: string;
  player_name: string;
  score: number;
  game_duration: number;
  created_at: string;
}

export const usePongHighScores = () => {
  const [highScores, setHighScores] = useState<PongScore[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchHighScores = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pong_scores')
        .select('*')
        .order('score', { ascending: false })
        .limit(10);

      if (error) throw error;
      setHighScores(data || []);
    } catch (error) {
      console.error('Error fetching high scores:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitScore = useCallback(async (score: number, gameDuration?: number, anonymousName?: string) => {
    // Anonymous user ID constant
    const ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000000';

    try {
      let playerName = 'Anonymous';
      let userId = ANONYMOUS_USER_ID;

      if (user) {
        // Authenticated user - get profile name
        userId = user.id;
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .single();

        if (!profileError && profile) {
          const firstName = profile.first_name?.trim() || '';
          const lastName = profile.last_name?.trim() || '';
          
          // Ensure we always include surname when available
          if (firstName && lastName) {
            playerName = `${firstName} ${lastName}`;
          } else if (firstName) {
            playerName = firstName;
          } else if (lastName) {
            playerName = lastName;
          }
        }

        // Fallback to email if no profile name
        if (playerName === 'Anonymous' && user.email) {
          playerName = user.email.split('@')[0];
        }
      } else if (anonymousName) {
        // Anonymous user with provided name
        playerName = anonymousName;
      }

      // Check for recent duplicate scores to prevent resurrection
      if (user) {
        const { data: recentScores } = await supabase
          .from('pong_scores')
          .select('id, score, created_at')
          .eq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 5000).toISOString()) // Last 5 seconds
          .eq('score', score);

        if (recentScores && recentScores.length > 0) {
          console.log('Duplicate score detected, skipping submission');
          return;
        }
      }

      const { error } = await supabase
        .from('pong_scores')
        .insert({
          user_id: userId,
          player_name: playerName,
          score,
          game_duration: gameDuration || 0,
        });

      if (error) {
        console.error('Score submission error:', error);
        throw error;
      }
      
      console.log('Score submitted successfully:', { score, playerName });
      // Refresh high scores after submission
      await fetchHighScores();
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  }, [user, fetchHighScores]);

  const requestAnonymousScore = useCallback(async (score: number, playerName: string, gameDuration?: number) => {
    return submitScore(score, gameDuration, playerName);
  }, [submitScore]);

  // Fetch high scores on mount
  useEffect(() => {
    fetchHighScores();
  }, [fetchHighScores]);

  // Set up real-time subscription for high scores
  useEffect(() => {
    const channel = supabase
      .channel('pong_scores_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pong_scores'
        },
        () => {
          fetchHighScores();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchHighScores]);

  return {
    highScores,
    loading,
    submitScore,
    requestAnonymousScore,
    refetch: fetchHighScores,
    isAuthenticated: !!user,
  };
};