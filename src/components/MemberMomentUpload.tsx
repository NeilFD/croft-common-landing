import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Image, MapPin, AlertTriangle, Calendar, Tag, X } from 'lucide-react';
import { useMemberMoments } from '@/hooks/useMemberMoments';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface MemberMomentUploadProps {
  onClose?: () => void;
  isOpen?: boolean;
}

const MemberMomentUpload: React.FC<MemberMomentUploadProps> = ({ onClose, isOpen = true }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [tagline, setTagline] = useState('');
  const [dateTaken, setDateTaken] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [step, setStep] = useState<'upload' | 'details'>('upload');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadMoment, uploading } = useMemberMoments();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive"
        });
        return;
      }

      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setStep('details');
    }
  };

  const handleUpload = async () => {
    console.log('🎬 COMPONENT: handleUpload called', { file: file?.name, tagline, dateTaken });
    
    if (!file || !tagline.trim()) {
      console.log('❌ COMPONENT: Missing file or tagline');
      toast({
        title: "Missing information",
        description: "Please add a photo and tagline",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🚀 COMPONENT: Calling uploadMoment...');
      await uploadMoment(file, tagline.trim(), dateTaken);
      console.log('✅ COMPONENT: Upload successful, cleaning up...');
      handleReset();
      onClose?.();
    } catch (error: any) {
      console.error('❌ COMPONENT: Upload error caught:', error);
      toast({
        title: "Upload failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };


  const handleReset = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    setTagline('');
    setDateTaken(format(new Date(), 'yyyy-MM-dd'));
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('upload');
      handleReset();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Image className="h-5 w-5" />
              Share a Moment
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Share your favorite memories from Croft Common
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 'upload' && (
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm font-medium">Click to upload a photo</p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, GIF up to 10MB
                </p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4">
              {previewUrl && (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBack}
                    className="absolute top-2 left-2"
                  >
                    Change Photo
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="tagline" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tell us about this moment
                </Label>
                <Textarea
                  id="tagline"
                  placeholder="What's happening in this photo?"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  maxLength={200}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {tagline.length}/200 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  When was this taken?
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={dateTaken}
                  onChange={(e) => setDateTaken(e.target.value)}
                  max={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>

              <Button
                onClick={handleUpload}
                disabled={!tagline.trim() || uploading}
                className="w-full"
              >
                {uploading ? 'Uploading...' : 'Share Moment'}
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default MemberMomentUpload;