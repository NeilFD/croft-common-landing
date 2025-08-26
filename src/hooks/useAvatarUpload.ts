import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const useAvatarUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload an avatar.",
        variant: "destructive",
      });
      return null;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB');
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      setUploadProgress(25);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      setUploadProgress(75);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadData.path);

      setUploadProgress(100);

      toast({
        title: "Avatar uploaded",
        description: "Your profile picture has been uploaded successfully.",
      });

      return urlData.publicUrl;

    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload avatar",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteAvatar = async (avatarUrl: string) => {
    if (!user || !avatarUrl) return false;

    try {
      // Extract path from URL
      const url = new URL(avatarUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts.slice(-2).join('/'); // user_id/filename

      const { error } = await supabase.storage
        .from('avatars')
        .remove([fileName]);

      if (error) throw error;

      toast({
        title: "Avatar deleted",
        description: "Your profile picture has been removed.",
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting avatar:', error);
      toast({
        title: "Deletion failed",
        description: error.message || "Failed to delete avatar",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    uploadAvatar,
    deleteAvatar,
    uploading,
    uploadProgress,
  };
};