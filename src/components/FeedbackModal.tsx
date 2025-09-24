import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { StarRating } from './StarRating';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Ratings {
  hospitality: number | null;
  food: number | null;
  drink: number | null;
  team: number | null;
  venue: number | null;
  price: number | null;
  overall: number | null;
}

export const FeedbackModal = ({ isOpen, onClose }: FeedbackModalProps) => {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratings, setRatings] = useState<Ratings>({
    hospitality: null,
    food: null,
    drink: null,
    team: null,
    venue: null,
    price: null,
    overall: null,
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please tell us more about your experience.",
        variant: "destructive",
      });
      return;
    }

    if (!isAnonymous && !name.trim()) {
      toast({
        title: "Name required",
        description: "Please provide your name or tick the anonymous box.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('send-feedback-email', {
        body: {
          name: name.trim(),
          message: message.trim(),
          isAnonymous,
          ratings,
          sourcePage: 'uncommon-standards'
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Feedback sent!",
        description: "Thank you for helping us maintain our uncommon standards.",
      });

      // Reset form and close modal
      setName('');
      setMessage('');
      setIsAnonymous(false);
      setRatings({
        hospitality: null,
        food: null,
        drink: null,
        team: null,
        venue: null,
        price: null,
        overall: null,
      });
      onClose();
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast({
        title: "Failed to send feedback",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setMessage('');
      setIsAnonymous(false);
      setRatings({
        hospitality: null,
        food: null,
        drink: null,
        team: null,
        venue: null,
        price: null,
        overall: null,
      });
      onClose();
    }
  };

  const handleRatingChange = (category: keyof Ratings, value: number | null) => {
    setRatings(prev => ({ ...prev, [category]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto my-4" style={{ marginTop: 'max(env(safe-area-inset-top, 0px) + 60px, 1rem)' }}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Tell us more
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Your feedback goes directly to Neil who runs the team at Croft Common. Give us the good and the not so good, everything helps.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Anonymous checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(checked === true)}
              />
              <Label 
                htmlFor="anonymous" 
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Submit anonymously
              </Label>
            </div>

            {/* Name field - only show if not anonymous */}
            {!isAnonymous && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                  Your name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isAnonymous}
                  className="w-full"
                />
              </div>
            )}

            {/* Message field */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium text-foreground">
                Tell us more *
              </Label>
              <Textarea
                id="message"
                placeholder="Share your thoughts about our standards, your experience, or how we can improve..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="min-h-[120px] w-full resize-none"
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {message.length}/1000 characters
              </p>
            </div>

            {/* Optional Rating System */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Rate your experience (optional)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Help us understand what we're doing well and where we can improve
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <StarRating
                  label="Hospitality"
                  value={ratings.hospitality}
                  onChange={(value) => handleRatingChange('hospitality', value)}
                />
                <StarRating
                  label="Food"
                  value={ratings.food}
                  onChange={(value) => handleRatingChange('food', value)}
                />
                <StarRating
                  label="Drink"
                  value={ratings.drink}
                  onChange={(value) => handleRatingChange('drink', value)}
                />
                <StarRating
                  label="Team"
                  value={ratings.team}
                  onChange={(value) => handleRatingChange('team', value)}
                />
                <StarRating
                  label="Venue"
                  value={ratings.venue}
                  onChange={(value) => handleRatingChange('venue', value)}
                />
                <StarRating
                  label="Price"
                  value={ratings.price}
                  onChange={(value) => handleRatingChange('price', value)}
                />
              </div>
              
              <StarRating
                label="Overall Experience"
                value={ratings.overall}
                onChange={(value) => handleRatingChange('overall', value)}
                className="pt-2"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="frameNeutral"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};