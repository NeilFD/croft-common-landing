import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
// @ts-ignore - exif-js doesn't have TypeScript definitions
import EXIF from 'exif-js';

export interface MemberMoment {
  id: string;
  user_id: string;
  image_url: string;
  media_type?: 'image' | 'video';
  poster_url?: string | null;
  duration_seconds?: number | null;
  tagline: string;
  date_taken: string;
  uploaded_at: string;
  latitude?: number | null;
  longitude?: number | null;
  location_confirmed: boolean;
  moderation_status: string;
  moderation_reason?: string | null;
  is_featured: boolean;
  is_visible: boolean;
  ai_confidence_score?: number | null;
  ai_flags?: any;
  moderated_at?: string | null;
  moderated_by?: string | null;
  updated_at: string;
  tags?: string[] | null;
  profiles?: {
    first_name?: string | null;
    last_name?: string | null;
  } | null;
  like_count?: number;
  user_has_liked?: boolean;
  comment_count?: number;
  likers?: {
    first_name?: string | null;
    last_name?: string | null;
  }[];
}

interface LocationData {
  lat: number;
  lng: number;
}

const VENUE_COORDINATES = {
  lat: 51.4583,
  lng: -2.6014
};

export const useMemberMoments = () => {
  const [moments, setMoments] = useState<MemberMoment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchMoments = useCallback(async () => {
    setLoading(true);
    
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // First get moments
      const { data: momentsData, error: momentsError } = await (supabase as any)
        .from('member_moments')
        .select('*')
        .eq('moderation_status', 'approved')
        .eq('is_visible', true)
        .order('uploaded_at', { ascending: false });

      if (momentsError) {
        toast({
          title: "Error",
          description: "Failed to load moments. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Get unique user IDs from moments
      const userIds = [...new Set(momentsData?.map(moment => moment.user_id) || [])];
      
      // Get profiles for those users
      const { data: profilesData, error: profilesError } = await (supabase as any)
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      if (profilesError) {
        console.warn('Failed to load profiles:', profilesError);
      }

      // Get like counts and user likes for each moment
      const momentIds = momentsData?.map(moment => moment.id) || [];
      
      // Get like counts
      const { data: likeCounts, error: likeCountError } = await (supabase as any)
        .from('moment_likes')
        .select('moment_id')
        .in('moment_id', momentIds);
        
      // Get user's likes if authenticated
      let userLikes: any[] = [];
      if (currentUser) {
        const { data: userLikesData, error: userLikesError } = await (supabase as any)
          .from('moment_likes')
          .select('moment_id')
          .eq('user_id', currentUser.id)
          .in('moment_id', momentIds);
        
        userLikes = userLikesData || [];
      }

      // Get likers with profiles for tooltips
      const { data: likersData, error: likersError } = await (supabase as any)
        .from('moment_likes')
        .select(`
          moment_id,
          user_id,
          profiles!inner(first_name, last_name)
        `)
        .in('moment_id', momentIds);

      // Get comment counts (excluding deleted)
      const { data: commentRows } = await (supabase as any)
        .from('moment_comments')
        .select('moment_id, is_deleted')
        .in('moment_id', momentIds);

      // Create maps
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.user_id, profile);
      });

      const likeCountMap = new Map();
      const userLikeMap = new Set();
      const likersMap = new Map();
      const commentCountMap = new Map<string, number>();

      // Process like counts
      likeCounts?.forEach(like => {
        likeCountMap.set(like.moment_id, (likeCountMap.get(like.moment_id) || 0) + 1);
      });

      // Process user likes
      userLikes.forEach(like => {
        userLikeMap.add(like.moment_id);
      });

      // Process likers
      likersData?.forEach(like => {
        if (!likersMap.has(like.moment_id)) {
          likersMap.set(like.moment_id, []);
        }
        likersMap.get(like.moment_id).push(like.profiles);
      });

      // Process comment counts
      (commentRows || []).forEach((c: any) => {
        if (c.is_deleted) return;
        commentCountMap.set(c.moment_id, (commentCountMap.get(c.moment_id) || 0) + 1);
      });

      // Combine moments with all data
      const momentsWithData = momentsData?.map(moment => ({
        ...moment,
        profiles: profilesMap.get(moment.user_id) || null,
        like_count: likeCountMap.get(moment.id) || 0,
        user_has_liked: userLikeMap.has(moment.id),
        likers: likersMap.get(moment.id) || [],
        comment_count: commentCountMap.get(moment.id) || 0,
      })) || [];

      setMoments(momentsWithData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load moments. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const refetchMoments = useCallback(() => {
    console.log('🔄 Refetching moments...');
    fetchMoments();
  }, [fetchMoments]);

  // Helper function to convert DMS (degrees, minutes, seconds) to decimal degrees
  const convertDMSToDD = (dms: number[], ref: string): number => {
    let dd = dms[0] + dms[1]/60 + dms[2]/3600;
    if (ref === "S" || ref === "W") dd = dd * -1;
    return dd;
  };

  // Helper function to get GPS data from image using EXIF
  const getGPSFromImage = (file: File): Promise<LocationData | null> => {
    return new Promise((resolve) => {
      try {
        console.log('📷 EXIF: Starting GPS extraction from image...');
        
        // Wrap EXIF processing in a timeout to prevent hanging
        const timeoutId = setTimeout(() => {
          console.warn('📷 EXIF: GPS extraction timed out after 5 seconds');
          resolve(null);
        }, 5000);
        
        EXIF.getData(file as any, function() {
          try {
            clearTimeout(timeoutId);
            
            const lat = EXIF.getTag(this, "GPSLatitude");
            const lon = EXIF.getTag(this, "GPSLongitude");
            const latRef = EXIF.getTag(this, "GPSLatitudeRef");
            const lonRef = EXIF.getTag(this, "GPSLongitudeRef");
            
            console.log('📷 EXIF: GPS data extracted:', { lat, lon, latRef, lonRef });
            
            if (lat && lon && latRef && lonRef) {
              // Convert DMS (degrees, minutes, seconds) to decimal degrees
              const latCoord = convertDMSToDD(lat, latRef);
              const lngCoord = convertDMSToDD(lon, lonRef);
              
              console.log('📷 EXIF: Converted GPS coordinates:', { lat: latCoord, lng: lngCoord });
              resolve({ lat: latCoord, lng: lngCoord });
            } else {
              console.log('📷 EXIF: No GPS data found in image EXIF');
              resolve(null);
            }
          } catch (exifError) {
            console.error('📷 EXIF: Error processing GPS data:', exifError);
            resolve(null);
          }
        });
      } catch (error) {
        console.error('📷 EXIF: Error extracting GPS from image:', error);
        resolve(null);
      }
    });
  };

  // Helper function to detect mobile device
  const checkMobileDevice = (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Helper function to get current location with mobile optimizations
  const getCurrentLocation = (): Promise<LocationData | null> => {
    return new Promise((resolve) => {
      try {
        console.log('📍 GEOLOCATION: Starting location detection...');
        
        if (!navigator.geolocation) {
          console.log('📍 GEOLOCATION: Not supported by this browser');
          resolve(null);
          return;
        }

        const mobile = checkMobileDevice();
        const options = {
          enableHighAccuracy: true,
          timeout: mobile ? 8000 : 5000, // Shorter timeout to prevent hanging
          maximumAge: mobile ? 60000 : 300000
        };

        console.log('📍 GEOLOCATION: Requesting location...', { mobile, options });

        // Single attempt with timeout protection
        const timeoutId = setTimeout(() => {
          console.warn('📍 GEOLOCATION: Location request timed out');
          resolve(null);
        }, options.timeout + 1000);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId);
            console.log('📍 GEOLOCATION: Success:', {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            clearTimeout(timeoutId);
            console.error('📍 GEOLOCATION: Error:', {
              code: error.code,
              message: error.message,
              PERMISSION_DENIED: error.code === 1,
              POSITION_UNAVAILABLE: error.code === 2, 
              TIMEOUT: error.code === 3
            });
            resolve(null);
          },
          options
        );
      } catch (error) {
        console.error('📍 GEOLOCATION: Unexpected error:', error);
        resolve(null);
      }
    });
  };

  const checkLocationWithinVenue = (coords: LocationData): boolean => {
    const distance = Math.sqrt(
      Math.pow(69.1 * (coords.lat - VENUE_COORDINATES.lat), 2) +
      Math.pow(69.1 * (VENUE_COORDINATES.lng - coords.lng) * Math.cos(VENUE_COORDINATES.lat / 57.3), 2)
    ) * 1.609344; // Convert to km
    
    return distance <= 0.2; // 200 meter radius
  };

  const uploadMoment = async (
    file: File,
    tagline: string,
    dateTaken: string,
    tags: string[] = [],
    extras: { mediaType?: 'image' | 'video'; posterBlob?: Blob | null; durationSeconds?: number | null } = {},
  ) => {
    if (uploading) {
      console.warn('Upload already in progress');
      return;
    }

    setUploading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('You need to be signed in to post a moment.');
      }

      const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('moments')
        .upload(fileName, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('moments')
        .getPublicUrl(fileName);

      // Optional video poster
      let posterUrl: string | null = null;
      if (extras.mediaType === 'video' && extras.posterBlob) {
        const posterName = `${user.id}/${Date.now()}-poster.jpg`;
        const { error: posterErr } = await supabase.storage
          .from('moments')
          .upload(posterName, extras.posterBlob, { contentType: 'image/jpeg', upsert: false });
        if (!posterErr) {
          posterUrl = supabase.storage.from('moments').getPublicUrl(posterName).data.publicUrl;
        }
      }

      const momentData: any = {
        user_id: user.id,
        image_url: publicUrl,
        media_type: extras.mediaType || 'image',
        poster_url: posterUrl,
        duration_seconds: extras.durationSeconds ?? null,
        tagline,
        date_taken: dateTaken,
        latitude: null,
        longitude: null,
        location_confirmed: false,
        moderation_status: 'approved',
        is_visible: true,
        tags: tags.filter((t) => t.trim().length > 0),
      };

      const { data: insertedMoment, error: insertError } = await (supabase as any)
        .from('member_moments')
        .insert([momentData])
        .select('*')
        .single();

      if (insertError || !insertedMoment) {
        await supabase.storage.from('moments').remove([fileName]).catch(() => {});
        const msg = insertError?.message?.includes('row-level security')
          ? 'Sign-in expired. Refresh and try again.'
          : insertError?.message || 'Could not save your moment.';
        throw new Error(msg);
      }

      setMoments((prev) => {
        if (prev.some((m) => m.id === insertedMoment.id)) return prev;
        return [insertedMoment as MemberMoment, ...prev];
      });

      fetchMoments().catch(() => {});

      return insertedMoment;
    } catch (error: any) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const deleteMoment = async (momentId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('member_moments')
        .delete()
        .eq('id', momentId);

      if (error) throw error;

      toast({
        title: "Moment deleted",
        description: "Your moment has been removed."
      });

      await fetchMoments();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete moment",
        variant: "destructive"
      });
    }
  };

  const updateMoment = async (
    momentId: string,
    tagline: string,
    dateTaken: string,
    tags: string[] = []
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const authError = new TypeError('User not authenticated');
        throw authError;
      }

      const updateData = {
        tagline,
        date_taken: dateTaken,
        tags: tags.filter(tag => tag.trim().length > 0)
      };

      const { error } = await (supabase as any)
        .from('member_moments')
        .update(updateData)
        .eq('id', momentId)
        .eq('user_id', user.id); // Ensure user can only update their own moments

      if (error) throw error;

      toast({
        title: "Moment updated",
        description: "Your moment has been updated successfully."
      });

      await fetchMoments();
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: "Failed to update moment",
        variant: "destructive"
      });
    }
  };

  const likeMoment = async (momentId: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "Error",
          description: "You must be logged in to like moments.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await (supabase as any)
        .from('moment_likes')
        .insert([{ moment_id: momentId, user_id: user.id }]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already liked",
            description: "You have already liked this moment.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to like moment. Please try again.",
            variant: "destructive"
          });
        }
        return;
      }

      // Optimistic update
      setMoments(prev => prev.map(moment => {
        if (moment.id === momentId) {
          return {
            ...moment,
            like_count: (moment.like_count || 0) + 1,
            user_has_liked: true
          };
        }
        return moment;
      }));

      console.log('✅ LIKE: Moment liked successfully - real-time will update for other users');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to like moment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const unlikeMoment = async (momentId: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "Error",
          description: "You must be logged in to unlike moments.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await (supabase as any)
        .from('moment_likes')
        .delete()
        .eq('moment_id', momentId)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to unlike moment. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Optimistic update
      setMoments(prev => prev.map(moment => {
        if (moment.id === momentId) {
          return {
            ...moment,
            like_count: Math.max((moment.like_count || 0) - 1, 0),
            user_has_liked: false
          };
        }
        return moment;
      }));

      console.log('✅ UNLIKE: Moment unliked successfully - real-time will update for other users');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unlike moment. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchMoments();

    // Set up real-time subscriptions for instant updates
    console.log('🔔 REALTIME: Setting up subscriptions...');
    
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const likesChannel = supabase
      .channel(`moment_likes_changes_${suffix}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'moment_likes'
        },
        (payload) => {
          console.log('🔔 REALTIME: Moment likes change:', payload);
          fetchMoments();
        }
      )
      .subscribe();

    const momentsChannel = supabase
      .channel(`member_moments_changes_${suffix}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'member_moments'
        },
        (payload) => {
          console.log('🔔 REALTIME: Member moment update:', payload);
          fetchMoments();
        }
      )
      .subscribe();

    return () => {
      console.log('🔔 REALTIME: Cleaning up subscriptions...');
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(momentsChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    moments,
    loading,
    uploading,
    uploadMoment,
    deleteMoment,
    updateMoment,
    refetchMoments,
    likeMoment,
    unlikeMoment
  };
};