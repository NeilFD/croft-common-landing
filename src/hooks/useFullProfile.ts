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
  avatar_face_verified: boolean;
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

      // profiles table — actual columns: first_name, last_name, phone, birthday, interests, avatar_url
      const { data: profileData, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // member_profiles_extended — actual columns: display_name, bio, tier_badge, preferences (jsonb)
      const { data: extendedData, error: extendedError } = await (supabase as any)
        .from('member_profiles_extended')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (extendedError && extendedError.code !== 'PGRST116') {
        throw extendedError;
      }

      // cb_members — source of truth for membership card name/phone
      const { data: cbData } = await (supabase as any)
        .from('cb_members')
        .select('first_name, last_name, phone')
        .eq('user_id', user.id)
        .maybeSingle();

      const prefs = (extendedData?.preferences as any) || {};

      const combinedProfile: FullProfile = {
        id: profileData?.id || '',
        user_id: user.id,
        first_name: cbData?.first_name || profileData?.first_name || null,
        last_name: cbData?.last_name || profileData?.last_name || null,
        phone_number: cbData?.phone || profileData?.phone || null,
        birthday: profileData?.birthday || null,
        interests: profileData?.interests || null,
        dietary_preferences: prefs.dietary_preferences || null,
        communication_preferences: prefs.communication_preferences || { push: true, email: true },

        display_name: extendedData?.display_name || null,
        avatar_url: prefs.avatar_url || profileData?.avatar_url || null,
        favorite_venue: prefs.favorite_venue || null,
        favorite_drink: prefs.favorite_drink || null,
        visit_time_preference: prefs.visit_time_preference || null,
        beer_style_preferences: prefs.beer_style_preferences || null,
        dietary_notes: prefs.dietary_notes || null,
        tier_badge: extendedData?.tier_badge || 'bronze',
        hide_from_leaderboards: prefs.hide_from_leaderboards || false,
        avatar_face_verified: !!prefs.avatar_face_verified,
        preferences: prefs,
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

      // Real columns on profiles table
      const profileUpdates: any = {};
      if ('first_name' in updates) profileUpdates.first_name = (updates.first_name || '').toString().trim();
      if ('last_name' in updates) profileUpdates.last_name = (updates.last_name || '').toString().trim();
      if ('phone_number' in updates) profileUpdates.phone = updates.phone_number;
      if ('birthday' in updates) profileUpdates.birthday = updates.birthday;
      if ('interests' in updates) profileUpdates.interests = updates.interests;
      if ('avatar_url' in updates) profileUpdates.avatar_url = updates.avatar_url;

      // Real columns on member_profiles_extended
      const extendedUpdates: any = {};
      if ('display_name' in updates) extendedUpdates.display_name = updates.display_name;
      if ('tier_badge' in updates) extendedUpdates.tier_badge = updates.tier_badge;

      // Everything else lives in member_profiles_extended.preferences (jsonb)
      const prefsKeys = [
        'favorite_venue', 'favorite_drink', 'visit_time_preference',
        'beer_style_preferences', 'dietary_notes', 'dietary_preferences',
        'communication_preferences', 'hide_from_leaderboards', 'avatar_url',
        'avatar_face_verified',
      ];
      const prefsPatch: any = {};
      prefsKeys.forEach((k) => {
        if (k in updates) prefsPatch[k] = (updates as any)[k];
      });

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await (supabase as any)
          .from('profiles')
          .upsert({ user_id: user.id, ...profileUpdates }, { onConflict: 'user_id' });
        if (profileError) throw profileError;

        // Mirror name/phone into cb_members (membership card source of truth)
        const cbFields: any = {};
        if ('first_name' in profileUpdates) cbFields.first_name = profileUpdates.first_name;
        if ('last_name' in profileUpdates) cbFields.last_name = profileUpdates.last_name;
        if ('phone' in profileUpdates) cbFields.phone = profileUpdates.phone;
        if (Object.keys(cbFields).length > 0) {
          await (supabase as any)
            .from('cb_members')
            .update({ ...cbFields, updated_at: new Date().toISOString() })
            .eq('user_id', user.id);
        }
      }

      if (Object.keys(extendedUpdates).length > 0 || Object.keys(prefsPatch).length > 0) {
        // Merge into existing preferences jsonb
        const { data: existing } = await (supabase as any)
          .from('member_profiles_extended')
          .select('preferences')
          .eq('user_id', user.id)
          .maybeSingle();
        const mergedPrefs = { ...((existing?.preferences as any) || {}), ...prefsPatch };

        const { error: extendedError } = await (supabase as any)
          .from('member_profiles_extended')
          .upsert(
            { user_id: user.id, ...extendedUpdates, preferences: mergedPrefs },
            { onConflict: 'user_id' }
          );
        if (extendedError) throw extendedError;
      }

      await fetchProfile();

      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message);
      toast({
        title: 'Update failed',
        description: err.message,
        variant: 'destructive',
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