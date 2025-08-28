import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
// @ts-ignore - exif-js doesn't have TypeScript definitions
import EXIF from 'exif-js';

export interface MemberMoment {
  id: string;
  user_id: string;
  image_url: string;
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
      const { data: momentsData, error: momentsError } = await supabase
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
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      if (profilesError) {
        console.warn('Failed to load profiles:', profilesError);
      }

      // Get like counts and user likes for each moment
      const momentIds = momentsData?.map(moment => moment.id) || [];
      
      // Get like counts
      const { data: likeCounts, error: likeCountError } = await supabase
        .from('moment_likes')
        .select('moment_id')
        .in('moment_id', momentIds);
        
      // Get user's likes if authenticated
      let userLikes: any[] = [];
      if (currentUser) {
        const { data: userLikesData, error: userLikesError } = await supabase
          .from('moment_likes')
          .select('moment_id')
          .eq('user_id', currentUser.id)
          .in('moment_id', momentIds);
        
        userLikes = userLikesData || [];
      }

      // Get likers with profiles for tooltips
      const { data: likersData, error: likersError } = await supabase
        .from('moment_likes')
        .select(`
          moment_id,
          user_id,
          profiles!inner(first_name, last_name)
        `)
        .in('moment_id', momentIds);

      // Create maps
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.user_id, profile);
      });

      const likeCountMap = new Map();
      const userLikeMap = new Set();
      const likersMap = new Map();

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

      // Combine moments with all data
      const momentsWithData = momentsData?.map(moment => ({
        ...moment,
        profiles: profilesMap.get(moment.user_id) || null,
        like_count: likeCountMap.get(moment.id) || 0,
        user_has_liked: userLikeMap.has(moment.id),
        likers: likersMap.get(moment.id) || []
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
    tags: string[] = []
  ) => {
    // Prevent multiple simultaneous uploads
    if (uploading) {
      console.warn('⚠️ UPLOAD: Upload already in progress, ignoring new request');
      return;
    }
    
    console.log('🔄 UPLOAD: Setting uploading state to true');
    setUploading(true);
    try {
      console.log('🚀 UPLOAD START: Starting upload process...', { file: file.name, size: file.size, tagline, dateTaken });
      
      console.log('🔐 AUTH: Getting initial user...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('🔐 AUTH: Initial user result:', { user: user?.id, error: userError });
      
      if (userError) {
        console.error('❌ AUTH: User error:', userError);
        const authError = new TypeError(`Authentication error: ${userError.message}`);
        throw authError;
      }
      
      if (!user) {
        console.error('❌ AUTH: User not authenticated - no user object');
        const userAuthError = new TypeError('User not authenticated');
        throw userAuthError;
      }
      
      // Get initial session
      const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔐 AUTH: Initial session check:', { 
        hasSession: !!initialSession, 
        sessionUserId: initialSession?.user?.id,
        userIdMatch: initialSession?.user?.id === user.id,
        error: sessionError 
      });
      
      if (sessionError || !initialSession) {
        console.error('❌ AUTH: No valid session:', sessionError);
        const authError = new TypeError('Authentication session required');
        throw authError;
      }
      
      console.log('✅ AUTH: User authenticated:', user.id);

      // Upload image to storage with auth verification
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      console.log('📤 STORAGE: Pre-upload auth check...');
      const { data: { session: preUploadSession } } = await supabase.auth.getSession();
      console.log('📤 STORAGE: Pre-upload session:', { 
        hasSession: !!preUploadSession,
        userId: preUploadSession?.user?.id,
        fileName,
        extractedFolderName: fileName.split('/')[0],
        userIdMatch: preUploadSession?.user?.id === fileName.split('/')[0]
      });
      
      // Double check auth just before upload
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('📤 STORAGE: Current user before upload:', { 
        hasUser: !!currentUser,
        userId: currentUser?.id,
        sessionUserMatch: currentUser?.id === preUploadSession?.user?.id
      });

      console.log('📤 STORAGE: Uploading to storage:', fileName);
      console.time('storage-upload');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('moments')
        .upload(fileName, file);
      console.timeEnd('storage-upload');

      if (uploadError) {
        console.error('❌ STORAGE: Upload error:', uploadError);
        const storageError = new TypeError(`Storage upload failed: ${uploadError.message}`);
        throw storageError;
      }
      console.log('✅ STORAGE: Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('moments')
        .getPublicUrl(fileName);
      console.log('🔗 STORAGE: Public URL:', publicUrl);

      // Insert moment record with comprehensive auth verification
      console.log('💾 DATABASE: Starting database insert...');
      console.time('database-insert');
      
      // Fresh session check right before database operation
      const { data: { session: dbSession }, error: dbSessionError } = await supabase.auth.getSession();
      console.log('💾 DATABASE: Final session check:', { 
        hasSession: !!dbSession, 
        sessionUserId: dbSession?.user?.id,
        originalUserId: user.id,
        userIdMatch: dbSession?.user?.id === user.id,
        sessionError: dbSessionError,
        accessToken: dbSession?.access_token ? 'present' : 'missing',
        expiresAt: dbSession?.expires_at
      });
      
      if (dbSessionError || !dbSession || !dbSession.user) {
        console.error('❌ DATABASE: Invalid session for database operation:', dbSessionError);
        const dbError = new TypeError('Authentication session invalid for database operation. Please refresh and try again.');
        throw dbError;
      }
      
      if (dbSession.user.id !== user.id) {
        console.error('❌ DATABASE: User ID mismatch:', { 
          sessionUserId: dbSession.user.id, 
          originalUserId: user.id 
        });
        const authMismatchError = new TypeError('User authentication mismatch. Please log out and log back in.');
        throw authMismatchError;
      }

      const momentData = {
        user_id: dbSession.user.id, // Use fresh session user ID
        image_url: publicUrl,
        tagline,
        date_taken: dateTaken,
        latitude: null, // Remove location tracking
        longitude: null, // Remove location tracking
        location_confirmed: false, // Always false since no location tracking
        moderation_status: 'pending', // Set to pending for automatic moderation
        is_visible: true,
        tags: tags.filter(tag => tag.trim().length > 0)
      };
      
      console.log('💾 DATABASE: About to insert with data:', { 
        ...momentData, 
        sessionValid: !!dbSession,
        sessionUserId: dbSession.user.id 
      });
      
      // Perform the insert with a small delay to ensure session consistency
      console.log('💾 DATABASE: Waiting 100ms for session consistency...');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // One final session check right before insert
      const { data: { session: finalSession }, error: finalSessionError } = await supabase.auth.getSession();
      console.log('💾 DATABASE: Final session before insert:', { 
        hasSession: !!finalSession,
        userId: finalSession?.user?.id,
        error: finalSessionError
      });
      
      if (finalSessionError || !finalSession?.user) {
        const sessionError = new TypeError('Session lost before database insert');
        throw sessionError;
      }
      
      const { data: insertedMoment, error: insertError } = await supabase
        .from('member_moments')
        .insert([momentData])
        .select('*')
        .single();
      
      console.timeEnd('database-insert');

      if (insertError) {
        console.error('❌ DATABASE: Insert error details:', {
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          momentData,
          currentAuth: await supabase.auth.getUser(),
          finalSession: !!finalSession
        });
        
        // Provide more specific error messages
        if (insertError.message?.includes('row-level security policy')) {
          const authError = new TypeError('Authentication error: Please refresh the page and try again.');
          throw authError;
        }
        
        const dbError = new TypeError(`Database error: ${insertError.message}`);
        throw dbError;
      }
      
      console.log('✅ DATABASE: Moment inserted successfully:', insertedMoment);

      // Show immediate success 
      console.log('🎉 SUCCESS: Upload complete, showing success message');
      toast({
        title: "Moment uploaded!",
        description: "Your moment has been sent for AI moderation review and will appear once approved.",
      });

      // Automatic moderation will be triggered by database trigger
      console.log('📝 MODERATION: Database trigger will handle automatic moderation');
      
      // Refresh moments list
      console.log('🔄 REFRESH: Refreshing moments list...');
      try {
        await fetchMoments();
        console.log('✅ REFRESH: Moments list refreshed successfully');
      } catch (refreshError) {
        console.warn('⚠️ REFRESH: Failed to refresh moments list:', refreshError);
        // Don't throw - upload was successful
      }
      
      console.log('✅ UPLOAD COMPLETE: All steps finished successfully');

    } catch (error: any) {
      console.error('❌ UPLOAD ERROR:', error);
      
      if (error.message === 'LOCATION_CONFIRMATION_NEEDED') {
        throw error; // Re-throw to handle in component
      }
      
      let errorMessage = "An unexpected error occurred";
      if (error instanceof TypeError) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      console.log('🧹 CLEANUP: Starting final cleanup...');
      setUploading(false);
      
      // Clear any potential memory leaks
      if (typeof window !== 'undefined') {
        // Force garbage collection if available (dev tools)
        if ((window as any).gc) {
          setTimeout(() => (window as any).gc(), 100);
        }
      }
      
      console.log('🏁 UPLOAD END: Upload process completed');
    }
  };

  const deleteMoment = async (momentId: string) => {
    try {
      const { error } = await supabase
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

      const { error } = await supabase
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

      const { error } = await supabase
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

      // Refresh to get accurate data
      refetchMoments();
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

      const { error } = await supabase
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

      // Refresh to get accurate data
      refetchMoments();
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
  }, [fetchMoments]);

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