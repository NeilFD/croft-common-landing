import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Message, EnquiryData } from '@/pages/EventEnquiry';
import { useNavigate } from 'react-router-dom';

interface EnquiryReviewProps {
  enquiryData: EnquiryData;
  messages: Message[];
  onEdit: () => void;
}

const labelClass = 'block font-mono text-[10px] tracking-[0.3em] uppercase text-black/60 mb-1';
const valueClass = 'font-sans text-sm md:text-base text-black';

export const EnquiryReview = ({ enquiryData, messages, onEdit }: EnquiryReviewProps) => {
  const [additionalComments, setAdditionalComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('convert-enquiry-to-lead', {
        body: { enquiryData, conversationHistory: messages, additionalComments },
      });

      if (error) {
        const serverMessage = (data as any)?.error || (error as any)?.message || 'Submission failed';
        const details = (data as any)?.details;
        throw new Error(details ? `${serverMessage} (${details})` : serverMessage);
      }

      toast({
        title: 'Enquiry sent',
        description: "The Bear will be in touch.",
      });

      setTimeout(() => navigate('/curious'), 1800);
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: 'Could not send',
        description: (error as Error)?.message || 'Try again, or email neil.fincham-dukes@crazybear.co.uk.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border-2 border-black p-6 md:p-10 shadow-[8px_8px_0_0_rgba(0,0,0,0.9)] space-y-8">
      <div>
        <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-black/50 mb-2">/ / /</p>
        <h2 className="font-display uppercase text-3xl md:text-4xl tracking-tight leading-none mb-3">
          Your Enquiry
        </h2>
        <p className="font-sans text-sm text-black/70">
          A first read on what you've told us. We'll come back inside a working day to talk it through.
        </p>
      </div>

      {/* Recommended space */}
      {enquiryData.recommendedSpace && (
        <div className="border-2 border-black bg-black text-white p-6 space-y-4">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-accent-pink">
            / Suggested Space
          </p>
          <h3 className="font-display uppercase text-2xl md:text-3xl tracking-tight">
            {enquiryData.recommendedSpace.name}
          </h3>
          {enquiryData.matchScore !== undefined && (
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/60">
              {enquiryData.matchScore}% fit
            </p>
          )}
          {enquiryData.aiReasoning && (
            <p className="font-sans text-sm md:text-base leading-relaxed text-white/90">
              {enquiryData.aiReasoning}
            </p>
          )}
          {enquiryData.keyFeatures && enquiryData.keyFeatures.length > 0 && (
            <ul className="space-y-1 pt-2">
              {enquiryData.keyFeatures.map((feature, idx) => (
                <li key={idx} className="font-sans text-sm text-white/90 flex gap-2">
                  <span className="text-accent-pink">/</span>
                  {feature}
                </li>
              ))}
            </ul>
          )}
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/60 pt-3 border-t border-white/20">
            Capacity: {enquiryData.recommendedSpace.capacity_seated} seated /{' '}
            {enquiryData.recommendedSpace.capacity_standing} standing
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="border-2 border-black p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        {enquiryData.contactName && (
          <div>
            <span className={labelClass}>Name</span>
            <span className={valueClass}>{enquiryData.contactName}</span>
          </div>
        )}
        {enquiryData.contactEmail && (
          <div>
            <span className={labelClass}>Email</span>
            <span className={valueClass}>{enquiryData.contactEmail}</span>
          </div>
        )}
        {enquiryData.eventType && (
          <div>
            <span className={labelClass}>Event Type</span>
            <span className={valueClass}>{enquiryData.eventType}</span>
          </div>
        )}
        {enquiryData.eventDate && (
          <div>
            <span className={labelClass}>Date</span>
            <span className={valueClass}>{enquiryData.eventDate}</span>
          </div>
        )}
        {enquiryData.guestCount !== undefined && (
          <div>
            <span className={labelClass}>Guests</span>
            <span className={valueClass}>{enquiryData.guestCount}</span>
          </div>
        )}
        {enquiryData.vibe && (
          <div>
            <span className={labelClass}>Vibe</span>
            <span className={valueClass}>{enquiryData.vibe}</span>
          </div>
        )}
        {enquiryData.fbStyle && (
          <div>
            <span className={labelClass}>Food & Drink</span>
            <span className={valueClass}>{enquiryData.fbStyle}</span>
          </div>
        )}
        {enquiryData.budget && (
          <div>
            <span className={labelClass}>Budget</span>
            <span className={valueClass}>{enquiryData.budget}</span>
          </div>
        )}
      </div>

      {/* Additional comments */}
      <div>
        <span className={labelClass}>Anything else</span>
        <textarea
          value={additionalComments}
          onChange={(e) => setAdditionalComments(e.target.value)}
          placeholder="Allergies, music, access, anything we should know."
          className="w-full min-h-[140px] bg-white border-2 border-black px-4 py-3 font-sans text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-0 focus:border-black"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 border-2 border-black bg-white text-black px-6 py-4 font-mono text-[11px] tracking-[0.4em] uppercase hover:bg-black hover:text-white transition-colors"
        >
          Edit answers
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 border-2 border-black bg-black text-white px-6 py-4 font-mono text-[11px] tracking-[0.4em] uppercase hover:bg-accent-pink hover:border-accent-pink transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending
            </>
          ) : (
            'Send to the Bear'
          )}
        </button>
      </div>

      <p className="text-center font-mono text-[10px] tracking-[0.3em] uppercase text-black/50 pt-4 border-t-2 border-black/10">
        We answer within a working day
      </p>
    </div>
  );
};
