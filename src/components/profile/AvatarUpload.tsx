import React, { useRef, useState } from 'react';
import { Camera, Upload, X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  displayName?: string | null;
  faceVerified?: boolean;
  onAvatarChange: (newAvatarUrl: string | null) => void;
  onVerifiedChange?: (verified: boolean) => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  displayName,
  faceVerified,
  onAvatarChange,
  onVerifiedChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const { uploadAvatar, deleteAvatar, uploading, uploadProgress } = useAvatarUpload();
  const { toast } = useToast();

  const verifyPhoto = async (url: string): Promise<{ valid: boolean; reason: string }> => {
    const { data, error } = await supabase.functions.invoke('verify-avatar-face', {
      body: { imageUrl: url },
    });
    if (error) throw new Error(error.message || 'Verification failed');
    return data as { valid: boolean; reason: string };
  };

  const handleFileSelect = async (file: File) => {
    setVerifyError(null);
    const uploadedUrl = await uploadAvatar(file);
    if (!uploadedUrl) return;

    setVerifying(true);
    try {
      const result = await verifyPhoto(uploadedUrl);
      if (!result.valid) {
        setVerifyError(result.reason || 'Photo did not pass verification.');
        await deleteAvatar(uploadedUrl);
        onAvatarChange(null);
        onVerifiedChange?.(false);
        toast({
          title: 'Photo rejected',
          description: result.reason || 'Please upload a clear face-on photo of yourself.',
          variant: 'destructive',
        });
      } else {
        onAvatarChange(uploadedUrl);
        onVerifiedChange?.(true);
        toast({
          title: 'Photo verified',
          description: 'Your profile picture is approved.',
        });
      }
    } catch (err: any) {
      setVerifyError(err.message || 'Verification failed.');
      await deleteAvatar(uploadedUrl);
      onAvatarChange(null);
      onVerifiedChange?.(false);
      toast({
        title: 'Verification error',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleFileSelect(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDeleteAvatar = async () => {
    if (currentAvatarUrl) {
      const success = await deleteAvatar(currentAvatarUrl);
      if (success) {
        onAvatarChange(null);
        onVerifiedChange?.(false);
        setVerifyError(null);
      }
    }
  };

  const getInitials = () => {
    if (displayName) return displayName.split(' ').map((n) => n[0]).join('').toUpperCase();
    return 'U';
  };

  const busy = uploading || verifying;

  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        className={`relative group cursor-pointer transition-all duration-200 ${dragOver ? 'scale-105' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !busy && fileInputRef.current?.click()}
      >
        <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
          <AvatarImage src={currentAvatarUrl || undefined} alt="Profile picture" className="object-cover" />
          <AvatarFallback className="text-2xl font-bold bg-muted">{getInitials()}</AvatarFallback>
        </Avatar>

        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full flex items-center justify-center">
          <Camera className="h-8 w-8 text-white" />
        </div>

        {dragOver && (
          <div className="absolute inset-0 bg-pink-500/20 border-2 border-dashed border-pink-500 rounded-full flex items-center justify-center">
            <Upload className="h-8 w-8 text-pink-500" />
          </div>
        )}

        {currentAvatarUrl && faceVerified && !busy && (
          <div className="absolute -bottom-1 -right-1 bg-black text-white rounded-full p-1.5 border-2 border-white">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        )}
      </div>

      {uploading && (
        <div className="w-32">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center mt-1">Uploading... {uploadProgress}%</p>
        </div>
      )}

      {verifying && (
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-black">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verifying photo...
        </div>
      )}

      {verifyError && !busy && (
        <div className="flex items-start gap-2 max-w-xs border-2 border-black bg-white p-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="font-sans text-xs text-black">{verifyError}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="bg-white text-black border-2 border-black hover:bg-white hover:text-pink-500 hover:border-pink-500"
        >
          <Upload className="h-4 w-4 mr-2" />
          {currentAvatarUrl ? 'Change' : 'Upload'}
        </Button>

        {currentAvatarUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteAvatar}
            disabled={busy}
            className="bg-white text-black border-2 border-black hover:bg-white hover:text-red-500 hover:border-red-500"
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Drag and drop an image or click to browse. Max 5MB.
      </p>
    </div>
  );
};
