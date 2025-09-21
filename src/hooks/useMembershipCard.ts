import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface MembershipCardData {
  membership_number: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  wallet_pass_url: string | null;
  wallet_pass_last_issued_at: string | null;
  wallet_pass_revoked: boolean | null;
  member_since: string | null;
}

export const useMembershipCard = () => {
  const { user } = useAuth();
  const [cardData, setCardData] = useState<MembershipCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCardData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First, ensure the user has a membership number
      const { data: membershipNumber, error: ensureError } = await supabase
        .rpc('ensure_membership_number', { user_id_input: user.id });

      if (ensureError) {
        console.error('Error ensuring membership number:', ensureError);
        setError('Failed to generate membership number');
        return;
      }

      // Then fetch the full card details
      const { data, error: fetchError } = await supabase
        .rpc('get_membership_card_details', { user_id_input: user.id });

      if (fetchError) {
        console.error('Error fetching card details:', fetchError);
        setError('Failed to load membership card');
        return;
      }

      if (data && data.length > 0) {
        setCardData(data[0]);
      } else {
        setError('No membership data found');
      }
    } catch (err) {
      console.error('Error in fetchCardData:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCardData();
  }, [user?.id]);

  return {
    cardData,
    loading,
    error,
    refetch: fetchCardData,
  };
};