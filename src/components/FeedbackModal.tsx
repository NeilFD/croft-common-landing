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

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal = ({ isOpen, onClose }: FeedbackModalProps) => {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
          isAnonymous
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
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Tell us more
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Help us maintain our uncommon standards. Your feedback goes directly to our team.
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