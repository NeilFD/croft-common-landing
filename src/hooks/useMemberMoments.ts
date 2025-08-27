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
              const latitude = convertDMSToDD(lat, latRef);
              const longitude = convertDMSToDD(lon, lonRef);
              
              console.log('📷 EXIF: Converted GPS coordinates:', { latitude, longitude });
              resolve({ latitude, longitude });
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
  const isMobileDevice = (): boolean => {
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

        const mobile = isMobileDevice();
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
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
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
    // Prevent multiple simultaneous uploads
    if (uploading) {
      console.warn('⚠️ UPLOAD: Upload already in progress, ignoring new request');
      return;
    }
    
    console.log('🔄 UPLOAD: Setting uploading state to true');
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

      // Simplified location detection - make it completely non-blocking
      console.log('📍 LOCATION: Starting simplified location detection...');
      
      let finalLocationData: any = null;
      
      try {
        // Try EXIF first with timeout protection
        console.log('📍 LOCATION: Attempting EXIF GPS extraction...');
        const imageGPS = await Promise.race([
          extractGPSFromImage(file),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
        ]);
        
        if (imageGPS) {
          console.log('📍 LOCATION: Found GPS in image:', imageGPS);
          finalLocationData = {
            ...imageGPS,
            location_name: 'From image EXIF',
            location_confirmed: false
          };
        } else {
          console.log('📍 LOCATION: No GPS in image, trying browser geolocation...');
          
          // Try browser geolocation with timeout protection
          const browserLocation = await Promise.race([
            getCurrentLocation(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))
          ]);
          
          if (browserLocation) {
            console.log('📍 LOCATION: Found browser location:', browserLocation);
            finalLocationData = {
              ...browserLocation,
              location_name: 'From browser',
              location_confirmed: false
            };
          } else {
            console.log('📍 LOCATION: No location found from any source');
          }
        }
      } catch (locationError) {
        console.error('📍 LOCATION: Error during location detection (non-blocking):', locationError);
        // Continue with upload regardless of location errors
      }

      // Location checking is now completely advisory and never blocks upload
      if (finalLocationData && !locationConfirmed) {
        const withinBounds = isLocationWithinVenue(finalLocationData);
        console.log('📍 LOCATION: Venue check:', { withinBounds, locationConfirmed });
        
        if (!withinBounds) {
          console.log('📍 LOCATION: Outside venue bounds but continuing upload');
          // Don't throw error, just log and continue
        }
      }

      console.log('📍 LOCATION: Final location data:', finalLocationData);

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
        latitude: finalLocationData?.latitude || null,
        longitude: finalLocationData?.longitude || null,
        location_confirmed: finalLocationData?.location_confirmed || false,
        moderation_status: 'approved', // Temporarily auto-approve for debugging
        is_visible: true
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

      // Show immediate success 
      console.log('🎉 SUCCESS: Upload complete, showing success message');
      toast({
        title: "Moment uploaded!",
        description: "Your moment has been uploaded successfully.",
      });

      // TODO: Re-enable background moderation after fixing core upload
      console.log('📝 TEMP: Skipping background moderation for debugging');
      
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
      if (error instanceof Error) {
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