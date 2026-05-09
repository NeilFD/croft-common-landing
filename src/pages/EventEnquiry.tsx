import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { EventEnquiryChat } from '@/components/enquiry/EventEnquiryChat';
import { EnquiryReview } from '@/components/enquiry/EnquiryReview';
import cbBgImage from '@/assets/den-bg-neon.jpg';

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
  recommendedSpace?: {
    id: string;
    name: string;
    capacity_seated: number;
    capacity_standing: number;
    description?: string;
  };
  aiReasoning?: string;
  matchScore?: number;
  keyFeatures?: string[];
  alternatives?: Array<{
    spaceId: string;
    spaceName: string;
    reasoning: string;
  }>;
};

const EventEnquiry = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [enquiryData, setEnquiryData] = useState<EnquiryData>({});
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    document.title = 'Plan Your Event | Crazy Bear';
  }, []);

  const handleComplete = (data: EnquiryData, conversationHistory: Message[]) => {
    setEnquiryData(data);
    setMessages(conversationHistory);
    setIsComplete(true);
  };

  const handleEdit = () => {
    setIsComplete(false);
  };

  return (
    <>
      <Helmet>
        <title>Plan Your Event | Crazy Bear</title>
        <meta name="description" content="Tell the Bear what you're planning. Weddings, parties, takeovers." />
      </Helmet>

      <div className="relative min-h-screen text-black">
        {/* Neon B&W background */}
        <div
          aria-hidden
          className="fixed inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${cbBgImage})` }}
        />
        <div aria-hidden className="fixed inset-0 -z-10 bg-white/55" />

        {/* Brand bar */}
        <header className="border-b-2 border-black/80 px-6 md:px-12 py-6 flex items-center gap-4 bg-white/85 backdrop-blur-sm">
          <Link to="/" className="flex items-center gap-3">
            <img src="/brand/crazy-bear-mark.png" alt="Crazy Bear" className="w-10 h-10" />
            <span className="font-display uppercase tracking-tight text-xl">Crazy Bear</span>
          </Link>
          <span className="ml-auto font-mono text-[10px] tracking-[0.4em] uppercase text-black/60">
            {isComplete ? 'Review' : 'Plan Your Event'}
          </span>
          <button
            onClick={() => navigate('/curious')}
            className="font-mono text-[10px] tracking-[0.4em] uppercase text-black/70 hover:text-black hidden md:inline"
          >
            ← All enquiries
          </button>
        </header>

        <main className="relative max-w-4xl mx-auto px-6 md:px-12 py-10 md:py-16">
          {!isComplete ? (
            <EventEnquiryChat onComplete={handleComplete} />
          ) : (
            <EnquiryReview
              enquiryData={enquiryData}
              messages={messages}
              onEdit={handleEdit}
            />
          )}
        </main>
      </div>
    </>
  );
};

export default EventEnquiry;
