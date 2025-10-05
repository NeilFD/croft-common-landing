import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EventEnquiryChat } from '@/components/enquiry/EventEnquiryChat';
import { EnquiryReview } from '@/components/enquiry/EnquiryReview';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
};

export type EnquiryData = {
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  eventType?: string;
  eventDate?: string;
  eventTime?: string;
  guestCount?: number;
  vibe?: string;
  fbStyle?: string;
  fbPreferences?: string;
  budget?: string;
  specialRequests?: string;
  recommendedSpaceId?: string;
  aiReasoning?: string;
};

const EventEnquiry = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [enquiryData, setEnquiryData] = useState<EnquiryData>({});
  const [isComplete, setIsComplete] = useState(false);

  const handleBack = () => {
    navigate('/hall');
  };

  const handleComplete = (data: EnquiryData, conversationHistory: Message[]) => {
    setEnquiryData(data);
    setMessages(conversationHistory);
    setIsComplete(true);
  };

  const handleEdit = () => {
    setIsComplete(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-muted flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-industrial text-sm">Back to Hall</span>
          </button>
          <h1 className="font-brutalist text-xl md:text-2xl text-foreground">
            {isComplete ? 'Review Your Enquiry' : 'Plan Your Event'}
          </h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        {!isComplete ? (
          <EventEnquiryChat onComplete={handleComplete} />
        ) : (
          <EnquiryReview 
            enquiryData={enquiryData} 
            messages={messages}
            onEdit={handleEdit}
          />
        )}
      </div>
    </div>
  );
};

export default EventEnquiry;
