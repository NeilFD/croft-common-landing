import React, { useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  displayName?: string | null;
  onAvatarChange: (newAvatarUrl: string | null) => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  displayName,
  onAvatarChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { uploadAvatar, deleteAvatar, uploading, uploadProgress } = useAvatarUpload();

  const handleFileSelect = async (file: File) => {
    const uploadedUrl = await uploadAvatar(file);
    if (uploadedUrl) {
      onAvatarChange(uploadedUrl);
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDeleteAvatar = async () => {
    if (currentAvatarUrl) {
      const success = await deleteAvatar(currentAvatarUrl);
      if (success) {
        onAvatarChange(null);
      }
    }
  };

  const getInitials = () => {
    if (displayName) {
      return displayName.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        className={`relative group cursor-pointer transition-all duration-200 ${
          dragOver ? 'scale-105' : ''
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
          <AvatarImage src={currentAvatarUrl || undefined} alt="Profile picture" />
          <AvatarFallback className="text-2xl font-bold bg-muted">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full flex items-center justify-center">
          <Camera className="h-8 w-8 text-white" />
        </div>

        {dragOver && (
          <div className="absolute inset-0 bg-pink-500/20 border-2 border-dashed border-pink-500 rounded-full flex items-center justify-center">
            <Upload className="h-8 w-8 text-pink-500" />
          </div>
        )}
      </div>

      {uploading && (
        <div className="w-32">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center mt-1">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="border-2 border-black hover:border-pink-500 hover:text-pink-500"
        >
          <Upload className="h-4 w-4 mr-2" />
          {currentAvatarUrl ? 'Change' : 'Upload'}
        </Button>

        {currentAvatarUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteAvatar}
            disabled={uploading}
            className="border-2 border-black hover:border-red-500 hover:text-red-500"
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