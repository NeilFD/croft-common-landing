import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface FullProfile {
  // From profiles table
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  birthday: string | null;
  interests: string[] | null;
  dietary_preferences: string[] | null;
  communication_preferences: {
    push: boolean;
    email: boolean;
  };
  
  // From member_profiles_extended table
  display_name: string | null;
  avatar_url: string | null;
  favorite_venue: string | null;
  favorite_drink: string | null;
  visit_time_preference: string | null;
  beer_style_preferences: string[] | null;
  dietary_notes: string | null;
  tier_badge: string | null;
  hide_from_leaderboards: boolean;
  preferences: any;
}

export const useFullProfile = () => {
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch basic profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Fetch extended profile data
      const { data: extendedData, error: extendedError } = await supabase
        .from('member_profiles_extended')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (extendedError && extendedError.code !== 'PGRST116') {
        throw extendedError;
      }

      // Combine data
      const combinedProfile: FullProfile = {
        id: profileData?.id || '',
        user_id: user.id,
        first_name: profileData?.first_name || null,
        last_name: profileData?.last_name || null,
        phone_number: profileData?.phone_number || null,
        birthday: profileData?.birthday || null,
        interests: profileData?.interests || null,
        dietary_preferences: profileData?.dietary_preferences || null,
        communication_preferences: (profileData?.communication_preferences as { push: boolean; email: boolean }) || { push: true, email: true },
        
        display_name: extendedData?.display_name || null,
        avatar_url: extendedData?.avatar_url || null,
        favorite_venue: extendedData?.favorite_venue || null,
        favorite_drink: extendedData?.favorite_drink || null,
        visit_time_preference: extendedData?.visit_time_preference || null,
        beer_style_preferences: extendedData?.beer_style_preferences || null,
        dietary_notes: extendedData?.dietary_notes || null,
        tier_badge: extendedData?.tier_badge || 'bronze',
        hide_from_leaderboards: extendedData?.hide_from_leaderboards || false,
        preferences: extendedData?.preferences || {},
      };

      setProfile(combinedProfile);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<FullProfile>) => {
    if (!user) return;

    try {
      setLoading(true);

      // Separate updates for different tables
      const profileUpdates: any = {};
      const extendedUpdates: any = {};

      // Map fields to appropriate tables
      const profileFields = ['first_name', 'last_name', 'phone_number', 'birthday', 'interests', 'dietary_preferences', 'communication_preferences'];
      const extendedFields = ['display_name', 'avatar_url', 'favorite_venue', 'favorite_drink', 'visit_time_preference', 'beer_style_preferences', 'dietary_notes', 'tier_badge', 'hide_from_leaderboards', 'preferences'];

      Object.entries(updates).forEach(([key, value]) => {
        if (profileFields.includes(key)) {
          profileUpdates[key] = value;
        } else if (extendedFields.includes(key)) {
          extendedUpdates[key] = value;
        }
      });

      // Update profiles table if needed
      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ user_id: user.id, ...profileUpdates }, { onConflict: 'user_id' });

        if (profileError) throw profileError;
      }

      // Update member_profiles_extended table if needed
      if (Object.keys(extendedUpdates).length > 0) {
        const { error: extendedError } = await supabase
          .from('member_profiles_extended')
          .upsert({ user_id: user.id, ...extendedUpdates }, { onConflict: 'user_id' });

        if (extendedError) throw extendedError;
      }

      // Refetch profile data
      await fetchProfile();

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });

    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message);
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: fetchProfile,
  };
};