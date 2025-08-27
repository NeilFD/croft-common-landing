import { useState, useEffect } from 'react';
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
  profiles?: {
    first_name?: string | null;
    last_name?: string | null;
  } | null;
}

interface LocationData {
  latitude: number;
  longitude: number;
}

const VENUE_COORDS = {
  latitude: 51.4583,
  longitude: -2.6014
};

export const useMemberMoments = () => {
  const [moments, setMoments] = useState<MemberMoment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchMoments = async () => {
    setLoading(true);
    try {
      console.log('Fetching moments...');
      const { data, error } = await supabase
        .from('member_moments')
        .select(`
          *,
          profiles (
            first_name,
            last_name
          )
        `)
        .eq('moderation_status', 'approved')
        .eq('is_visible', true)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        // Only show error toast for actual errors, not empty results
        if (error.code !== 'PGRST116') {
          toast({
            title: "Error",
            description: "Failed to load moments. Please try again.",
            variant: "destructive"
          });
        }
        return;
      }
      
      console.log('Fetched moments:', data);
      setMoments(data as MemberMoment[] || []);
    } catch (error) {
      console.error('Error fetching moments:', error);
      // Only show error for actual failures, not empty results
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (!errorMessage.includes('No rows found')) {
        toast({
          title: "Error", 
          description: "Failed to load moments. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert DMS (degrees, minutes, seconds) to decimal degrees
  const convertDMSToDD = (dms: number[], ref: string): number => {
    let dd = dms[0] + dms[1]/60 + dms[2]/3600;
    if (ref === "S" || ref === "W") dd = dd * -1;
    return dd;
  };

  // Helper function to extract GPS data from image using EXIF
  const extractGPSFromImage = (file: File): Promise<LocationData | null> => {
    return new Promise((resolve) => {
      try {
        EXIF.getData(file as any, function() {
          const lat = EXIF.getTag(this, "GPSLatitude");
          const lon = EXIF.getTag(this, "GPSLongitude");
          const latRef = EXIF.getTag(this, "GPSLatitudeRef");
          const lonRef = EXIF.getTag(this, "GPSLongitudeRef");
          
          console.log('EXIF GPS data:', { lat, lon, latRef, lonRef });
          
          if (lat && lon && latRef && lonRef) {
            // Convert DMS (degrees, minutes, seconds) to decimal degrees
            const latitude = convertDMSToDD(lat, latRef);
            const longitude = convertDMSToDD(lon, lonRef);
            
            console.log('Converted GPS coordinates:', { latitude, longitude });
            resolve({ latitude, longitude });
          } else {
            console.log('No GPS data found in image EXIF');
            resolve(null);
          }
        });
      } catch (error) {
        console.error('Error extracting GPS from image:', error);
        resolve(null);
      }
    });
  };

  // Helper function to detect mobile device
  const isMobileDevice = (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Helper function to get current location with mobile optimizations
  const getCurrentLocation = (): Promise<LocationData | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log('Geolocation not supported by this browser');
        resolve(null);
        return;
      }

      const mobile = isMobileDevice();
      const options = {
        enableHighAccuracy: true,
        timeout: mobile ? 15000 : 10000, // Longer timeout for mobile
        maximumAge: mobile ? 60000 : 300000 // Shorter cache for mobile
      };

      console.log('Requesting geolocation...', { mobile, options });

      let attempts = 0;
      const maxAttempts = 2;

      const tryGetLocation = () => {
        attempts++;
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('Geolocation success:', {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              attempt: attempts
            });
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
            console.error(`Geolocation error (attempt ${attempts}):`, {
              code: error.code,
              message: error.message,
              PERMISSION_DENIED: error.code === 1,
              POSITION_UNAVAILABLE: error.code === 2, 
              TIMEOUT: error.code === 3
            });
            
            // Retry once if timeout or position unavailable on mobile
            if (attempts < maxAttempts && mobile && (error.code === 2 || error.code === 3)) {
              console.log('Retrying geolocation...');
              setTimeout(tryGetLocation, 1000);
            } else {
              resolve(null);
            }
          },
          options
        );
      };

      tryGetLocation();
    });
  };

  const isLocationWithinVenue = (location: LocationData): boolean => {
    const distance = Math.sqrt(
      Math.pow(69.1 * (location.latitude - VENUE_COORDS.latitude), 2) +
      Math.pow(69.1 * (VENUE_COORDS.longitude - location.longitude) * Math.cos(VENUE_COORDS.latitude / 57.3), 2)
    ) * 1.609344; // Convert to km
    
    return distance <= 0.2; // 200 meter radius
  };

  const uploadMoment = async (
    file: File,
    tagline: string,
    dateTaken: string,
    locationConfirmed: boolean = false
  ) => {
    setUploading(true);
    try {
      console.log('🚀 UPLOAD START: Starting upload process...', { file: file.name, size: file.size, tagline, dateTaken });
      
      console.log('🔐 AUTH: Getting user...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('🔐 AUTH: User result:', { user: user?.id, error: userError });
      
      if (userError) {
        console.error('❌ AUTH: User error:', userError);
        throw new Error(`Authentication error: ${userError.message}`);
      }
      
      if (!user) {
        console.error('❌ AUTH: User not authenticated - no user object');
        throw new Error('User not authenticated');
      }
      console.log('✅ AUTH: User authenticated:', user.id);

      // Try to get location data (completely optional now)
      console.log('📍 LOCATION: Starting location detection...');
      
      const imageGPS = await extractGPSFromImage(file);
      console.log('📍 LOCATION: Image GPS result:', imageGPS);
      
      let currentLocation = imageGPS;
      if (!currentLocation) {
        console.log('No GPS in image, trying browser geolocation...');
        currentLocation = await getCurrentLocation();
        console.log('Browser geolocation result:', currentLocation);
      }

      // Location checking is now completely advisory - never blocks upload
      let locationWarning = '';
      let needsLocationConfirmation = false;
      
      if (currentLocation) {
        const withinBounds = isLocationWithinVenue(currentLocation);
        console.log('Location check:', { currentLocation, withinBounds, locationConfirmed });
        
        if (!withinBounds && !locationConfirmed) {
          needsLocationConfirmation = true;
          locationWarning = `Location detected outside venue bounds (${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)})`;
        }
      } else {
        console.log('No location detected from any source');
        // Only ask for confirmation on first attempt if no location found
        if (!locationConfirmed) {
          needsLocationConfirmation = true;
          locationWarning = 'No location data found - upload will proceed without location';
        }
      }
      
      console.log('Location decision:', { needsLocationConfirmation, locationWarning });
      
      // Only ask for confirmation if we haven't already confirmed and there's a specific location issue
      if (needsLocationConfirmation) {
        throw new Error('LOCATION_CONFIRMATION_NEEDED');
      }

      // Upload image to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      console.log('📤 STORAGE: Uploading to storage:', fileName);
      console.time('storage-upload');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('moments')
        .upload(fileName, file);
      console.timeEnd('storage-upload');

      if (uploadError) {
        console.error('❌ STORAGE: Upload error:', uploadError);
        throw uploadError;
      }
      console.log('✅ STORAGE: Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('moments')
        .getPublicUrl(fileName);
      console.log('🔗 STORAGE: Public URL:', publicUrl);

      // Insert moment record
      console.log('💾 DATABASE: Inserting moment record...');
      console.time('database-insert');
      
      // Ensure user is authenticated before inserting
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ DATABASE: No session found');
        throw new Error('User must be authenticated to upload moments');
      }
      
      const momentData = {
        user_id: user.id,
        image_url: publicUrl,
        tagline,
        date_taken: dateTaken,
        latitude: currentLocation?.latitude || null,
        longitude: currentLocation?.longitude || null,
        location_confirmed: locationConfirmed || false,
        moderation_status: 'pending'
      };
      console.log('Moment data:', momentData);
      console.log('User session:', session.user.id);
      
      const { data: insertedMoment, error: insertError } = await supabase
        .from('member_moments')
        .insert([momentData])
        .select()
        .single();
      console.timeEnd('database-insert');

      if (insertError) {
        console.error('❌ DATABASE: Insert error:', insertError);
        throw insertError;
      }
      console.log('✅ DATABASE: Moment inserted:', insertedMoment);

      // Show immediate success - moderation runs in background
      console.log('🎉 SUCCESS: Upload complete, showing success message');
      toast({
        title: "Moment uploaded!",
        description: "Your moment is being reviewed and will appear once approved.",
      });

      // Trigger AI moderation in background (non-blocking)
      console.log('🤖 MODERATION: Triggering background AI moderation...');
      supabase.functions.invoke('moderate-moment-image', {
        body: {
          imageUrl: publicUrl,
          momentId: insertedMoment.id
        }
      }).then(({ error: moderationError }) => {
        if (moderationError) {
          console.error('❌ MODERATION: Background moderation error:', moderationError);
        } else {
          console.log('✅ MODERATION: Background AI moderation completed');
          // Refresh moments after moderation
          fetchMoments();
        }
      }).catch(error => {
        console.error('❌ MODERATION: Background moderation failed:', error);
      });

      // Refresh moments list immediately
      console.log('🔄 REFRESH: Refreshing moments list...');
      await fetchMoments();
      console.log('✅ UPLOAD COMPLETE: All steps finished successfully');

    } catch (error: any) {
      console.error('❌ UPLOAD ERROR:', error);
      
      if (error.message === 'LOCATION_CONFIRMATION_NEEDED') {
        throw error; // Re-throw to handle in component
      }
      
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
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

  useEffect(() => {
    fetchMoments();
  }, []);

  return {
    moments,
    loading,
    uploading,
    uploadMoment,
    deleteMoment,
    refetchMoments: fetchMoments
  };
};