import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Edit, Send } from 'lucide-react';
import type { Message, EnquiryData } from '@/pages/EventEnquiry';
import { useNavigate } from 'react-router-dom';

interface EnquiryReviewProps {
  enquiryData: EnquiryData;
  messages: Message[];
  onEdit: () => void;
}

export const EnquiryReview = ({ enquiryData, messages, onEdit }: EnquiryReviewProps) => {
  const [additionalComments, setAdditionalComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('convert-enquiry-to-lead', {
        body: {
          enquiryData,
          conversationHistory: messages,
          additionalComments
        }
      });

      if (error) throw error;

      toast({
        title: "Enquiry Submitted! 🎉",
        description: "We'll be in touch shortly to discuss your event.",
      });

      // Redirect to thank you or back to hall
      setTimeout(() => {
        navigate('/hall');
      }, 2000);
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Submission Failed",
        description: "Please try again or contact us directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl bg-card border-2 border-foreground shadow-lg rounded-lg p-6 md:p-8 space-y-6">
      <div className="space-y-2">
        <h2 className="font-brutalist text-2xl md:text-3xl text-foreground">
          Your Event Enquiry Summary
        </h2>
        <p className="font-industrial text-muted-foreground">
          Review the details below and add any final comments
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-muted/50 border border-border rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enquiryData.contactName && (
            <div>
              <p className="font-industrial text-xs text-muted-foreground uppercase">Name</p>
              <p className="font-industrial text-foreground">{enquiryData.contactName}</p>
            </div>
          )}
          
          {enquiryData.contactEmail && (
            <div>
              <p className="font-industrial text-xs text-muted-foreground uppercase">Email</p>
              <p className="font-industrial text-foreground">{enquiryData.contactEmail}</p>
            </div>
          )}
          
          {enquiryData.eventType && (
            <div>
              <p className="font-industrial text-xs text-muted-foreground uppercase">Event Type</p>
              <p className="font-industrial text-foreground">{enquiryData.eventType}</p>
            </div>
          )}
          
          {enquiryData.eventDate && (
            <div>
              <p className="font-industrial text-xs text-muted-foreground uppercase">Date</p>
              <p className="font-industrial text-foreground">{enquiryData.eventDate}</p>
            </div>
          )}
          
          {enquiryData.guestCount && (
            <div>
              <p className="font-industrial text-xs text-muted-foreground uppercase">Guest Count</p>
              <p className="font-industrial text-foreground">{enquiryData.guestCount} guests</p>
            </div>
          )}
          
          {enquiryData.vibe && (
            <div>
              <p className="font-industrial text-xs text-muted-foreground uppercase">Vibe</p>
              <p className="font-industrial text-foreground">{enquiryData.vibe}</p>
            </div>
          )}
          
          {enquiryData.fbStyle && (
            <div>
              <p className="font-industrial text-xs text-muted-foreground uppercase">Food & Drink Style</p>
              <p className="font-industrial text-foreground">{enquiryData.fbStyle}</p>
            </div>
          )}
          
          {enquiryData.budget && (
            <div>
              <p className="font-industrial text-xs text-muted-foreground uppercase">Budget</p>
              <p className="font-industrial text-foreground">{enquiryData.budget}</p>
            </div>
          )}
        </div>

        {enquiryData.aiReasoning && (
          <div className="pt-4 border-t border-border">
            <p className="font-industrial text-xs text-muted-foreground uppercase mb-2">Why We Recommend This Space</p>
            <p className="font-industrial text-sm text-foreground">{enquiryData.aiReasoning}</p>
          </div>
        )}
      </div>

      {/* Additional Comments */}
      <div className="space-y-2">
        <label className="font-industrial text-sm text-foreground">
          Add any final details:
        </label>
        <Textarea
          value={additionalComments}
          onChange={(e) => setAdditionalComments(e.target.value)}
          placeholder="Allergies, specific requirements, questions, etc."
          className="min-h-[120px] font-industrial border-2 border-foreground focus-visible:ring-accent"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onEdit}
          variant="outline"
          className="flex-1 border-2 border-foreground font-industrial font-bold"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Answers
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/80 border-2 border-foreground font-industrial font-bold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit Enquiry
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
