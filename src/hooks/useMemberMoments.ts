import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
        throw error;
      }
      
      console.log('Fetched moments:', data);
      setMoments(data as MemberMoment[] || []);
    } catch (error) {
      console.error('Error fetching moments:', error);
      toast({
        title: "Error",
        description: "Failed to load moments. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const extractGPSFromImage = (file: File): Promise<LocationData | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          // This is a simplified GPS extraction
          // In reality, you'd use a library like exif-js or piexifjs
          // For now, we'll just return null and rely on browser geolocation
          resolve(null);
        } catch (error) {
          console.log('No GPS data found in image');
          resolve(null);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const getCurrentLocation = (): Promise<LocationData | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
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
      console.log('Starting upload process...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        throw new Error('User not authenticated');
      }
      console.log('User authenticated:', user.id);

      // Try to get location data (optional)
      const imageGPS = await extractGPSFromImage(file);
      const currentLocation = imageGPS || await getCurrentLocation();

      // Location checking is now advisory only
      let locationWarning = '';
      if (currentLocation) {
        const withinBounds = isLocationWithinVenue(currentLocation);
        if (!withinBounds && !locationConfirmed) {
          // Ask for confirmation but don't block upload
          throw new Error('LOCATION_CONFIRMATION_NEEDED');
        }
        if (!withinBounds) {
          locationWarning = 'Location appears to be outside venue bounds';
        }
      }

      // Upload image to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      console.log('Uploading to storage:', fileName);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('moments')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }
      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('moments')
        .getPublicUrl(fileName);
      console.log('Public URL:', publicUrl);

      // Insert moment record
      console.log('Inserting moment record...');
      const momentData = {
        user_id: user.id,
        image_url: publicUrl,
        tagline,
        date_taken: dateTaken,
        latitude: currentLocation?.latitude || null,
        longitude: currentLocation?.longitude || null,
        location_confirmed: locationConfirmed,
        moderation_status: 'pending'
      };
      console.log('Moment data:', momentData);
      
      const { data: insertedMoment, error: insertError } = await supabase
        .from('member_moments')
        .insert([momentData])
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw insertError;
      }
      console.log('Moment inserted:', insertedMoment);

      // Trigger AI moderation
      try {
        console.log('Triggering AI moderation...');
        const { error: moderationError } = await supabase.functions.invoke(
          'moderate-moment-image',
          {
            body: {
              imageUrl: publicUrl,
              momentId: insertedMoment.id
            }
          }
        );

        if (moderationError) {
          console.error('Moderation error:', moderationError);
          // Don't fail the upload if moderation fails
        }
      } catch (moderationError) {
        console.error('Moderation failed:', moderationError);
        // Continue anyway - moderation failure shouldn't block upload
      }

      toast({
        title: "Moment uploaded!",
        description: locationWarning || "Your photo is being reviewed and will appear soon.",
      });

      // Refresh moments
      await fetchMoments();

    } catch (error: any) {
      console.error('Upload error:', error);
      
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