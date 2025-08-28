import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Tag, X, Plus, Edit } from 'lucide-react';
import { useMemberMoments, MemberMoment } from '@/hooks/useMemberMoments';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface MemberMomentEditProps {
  moment: MemberMoment;
  onClose?: () => void;
  isOpen?: boolean;
}

const PRESET_TAGS = [
  'Café', 'Cocktails', 'Kitchens', 'Taprooms', 'Hall', 'Terrace', 
  'Rooftop', 'SecretCinema', 'LuckyNo7', 'CroftCommon', 'CommonGood'
];

const MemberMomentEdit: React.FC<MemberMomentEditProps> = ({ moment, onClose, isOpen = true }) => {
  const [tagline, setTagline] = useState(moment.tagline);
  const [dateTaken, setDateTaken] = useState(format(new Date(moment.date_taken), 'yyyy-MM-dd'));
  const [selectedTags, setSelectedTags] = useState<string[]>(moment.tags || []);
  const [customTag, setCustomTag] = useState('');
  const [updating, setUpdating] = useState(false);
  
  const { updateMoment } = useMemberMoments();
  const { toast } = useToast();

  const togglePresetTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const trimmedTag = customTag.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      setSelectedTags(prev => [...prev, trimmedTag]);
      setCustomTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleUpdate = async () => {
    if (!tagline.trim()) {
      toast({
        title: "Missing information",
        description: "Please add a tagline",
        variant: "destructive"
      });
      return;
    }

    setUpdating(true);
    try {
      await updateMoment(moment.id, tagline.trim(), dateTaken, selectedTags);
      onClose?.();
    } catch (error: any) {
      console.error('Update error caught:', error);
      toast({
        title: "Update failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Moment
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Update your moment details
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Image Preview */}
          <div className="relative">
            <img
              src={moment.image_url}
              alt={moment.tagline}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>

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

          {/* Tags Section */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Update tags (optional)
            </Label>
            
            {/* Preset Tags */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Popular tags:</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_TAGS.map(tag => (
                  <Button
                    key={tag}
                    type="button"
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    size="sm"
                    onClick={() => togglePresetTag(tag)}
                    className={`text-xs h-7 ${
                      selectedTags.includes(tag) 
                        ? 'bg-background text-accent border-accent' 
                        : 'bg-background text-foreground border-accent hover:border-accent hover:bg-accent/5'
                    }`}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Tag Input */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Add your own:</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Type a custom tag..."
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomTag}
                  disabled={!customTag.trim()}
                  className="border-accent hover:bg-accent/5"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Selected tags:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map(tag => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="bg-background text-foreground border-accent flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!tagline.trim() || updating}
              className="flex-1"
            >
              {updating ? 'Updating...' : 'Update Moment'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberMomentEdit;