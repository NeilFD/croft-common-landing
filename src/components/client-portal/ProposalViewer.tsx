import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface ProposalContent {
  event_overview?: {
    client_name?: string;
    event_code?: string;
    headcount?: number;
    event_date?: string;
    event_type?: string;
  };
  venue_details?: {
    space_name?: string;
    setup_time?: string;
    breakdown_time?: string;
    venue_hire?: number;
  };
  menu?: {
    courses?: Array<{
      name: string;
      items: Array<{
        name: string;
        quantity?: number;
        price_per_unit?: number;
      }>;
    }>;
  };
  equipment?: Array<{
    category: string;
    items: Array<{
      name: string;
      quantity: number;
      price?: number;
    }>;
  }>;
  timeline?: Array<{
    time: string;
    activity: string;
  }>;
  pricing?: {
    subtotal?: number;
    vat_rate?: number;
    vat_amount?: number;
    service_charge_rate?: number;
    service_charge_amount?: number;
    total?: number;
  };
}

interface ProposalViewerProps {
  content: ProposalContent;
  versionNo: number;
  generatedAt: string;
}

export const ProposalViewer = ({ content, versionNo, generatedAt }: ProposalViewerProps) => {
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    venue: true,
    menu: true,
    equipment: true,
    timeline: true,
    pricing: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="border-[3px] border-black rounded-lg bg-background">
      {/* Header */}
      <div className="p-6 border-b-[3px] border-black">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-brutalist text-xl uppercase tracking-wide text-foreground">
              Event Proposal v{versionNo}
            </h3>
            <p className="font-industrial text-xs text-steel mt-1">
              Generated {new Date(generatedAt).toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y-[3px] divide-black">
        {/* Event Overview */}
        {content.event_overview && (
          <div>
            <button
              onClick={() => toggleSection('overview')}
              className="w-full p-4 flex items-center justify-between hover:bg-surface transition-colors"
            >
              <span className="font-industrial uppercase text-sm font-medium text-foreground">Event Overview</span>
              {expandedSections.overview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.overview && (
              <div className="p-6 pt-0 grid grid-cols-2 gap-4">
                {content.event_overview.client_name && (
                  <div>
                    <p className="font-industrial text-xs uppercase text-steel mb-1">Client</p>
                    <p className="font-industrial text-foreground">{content.event_overview.client_name}</p>
                  </div>
                )}
                {content.event_overview.event_code && (
                  <div>
                    <p className="font-industrial text-xs uppercase text-steel mb-1">Event Code</p>
                    <p className="font-industrial text-foreground font-mono">{content.event_overview.event_code}</p>
                  </div>
                )}
                {content.event_overview.headcount && (
                  <div>
                    <p className="font-industrial text-xs uppercase text-steel mb-1">Headcount</p>
                    <p className="font-industrial text-foreground">{content.event_overview.headcount} guests</p>
                  </div>
                )}
                {content.event_overview.event_date && (
                  <div>
                    <p className="font-industrial text-xs uppercase text-steel mb-1">Date</p>
                    <p className="font-industrial text-foreground">{content.event_overview.event_date}</p>
                  </div>
                )}
                {content.event_overview.event_type && (
                  <div>
                    <p className="font-industrial text-xs uppercase text-steel mb-1">Event Type</p>
                    <p className="font-industrial text-foreground">{content.event_overview.event_type}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Venue Details */}
        {content.venue_details && (
          <div>
            <button
              onClick={() => toggleSection('venue')}
              className="w-full p-4 flex items-center justify-between hover:bg-surface transition-colors"
            >
              <span className="font-industrial uppercase text-sm font-medium text-foreground">Venue Details</span>
              {expandedSections.venue ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.venue && (
              <div className="p-6 pt-0 space-y-3">
                {content.venue_details.space_name && (
                  <div className="flex justify-between items-start">
                    <span className="font-industrial text-steel">Space</span>
                    <span className="font-industrial text-foreground font-medium">{content.venue_details.space_name}</span>
                  </div>
                )}
                {content.venue_details.setup_time && (
                  <div className="flex justify-between items-start">
                    <span className="font-industrial text-steel">Setup Time</span>
                    <span className="font-industrial text-foreground font-medium">{content.venue_details.setup_time}</span>
                  </div>
                )}
                {content.venue_details.breakdown_time && (
                  <div className="flex justify-between items-start">
                    <span className="font-industrial text-steel">Breakdown Time</span>
                    <span className="font-industrial text-foreground font-medium">{content.venue_details.breakdown_time}</span>
                  </div>
                )}
                {content.venue_details.venue_hire !== undefined && (
                  <div className="flex justify-between items-start pt-2 border-t-[2px] border-black">
                    <span className="font-industrial text-foreground font-medium">Venue Hire</span>
                    <span className="font-industrial text-foreground font-medium">£{content.venue_details.venue_hire.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Menu */}
        {content.menu?.courses && content.menu.courses.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('menu')}
              className="w-full p-4 flex items-center justify-between hover:bg-surface transition-colors"
            >
              <span className="font-industrial uppercase text-sm font-medium text-foreground">Menu</span>
              {expandedSections.menu ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.menu && (
              <div className="p-6 pt-0 space-y-4">
                {content.menu.courses.map((course, idx) => (
                  <div key={idx}>
                    <p className="font-industrial uppercase text-xs text-steel mb-2">{course.name}</p>
                    {course.items && course.items.length > 0 && (
                      <div className="space-y-1 ml-4">
                        {course.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex justify-between items-start">
                            <span className="font-industrial text-foreground">
                              {item.name} {item.quantity && `(×${item.quantity})`}
                            </span>
                            {item.price_per_unit !== undefined && (
                              <span className="font-industrial text-steel">£{item.price_per_unit.toFixed(2)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Equipment */}
        {content.equipment && content.equipment.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('equipment')}
              className="w-full p-4 flex items-center justify-between hover:bg-surface transition-colors"
            >
              <span className="font-industrial uppercase text-sm font-medium text-foreground">Equipment</span>
              {expandedSections.equipment ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.equipment && (
              <div className="p-6 pt-0 space-y-4">
                {content.equipment.map((category, idx) => (
                  <div key={idx}>
                    <p className="font-industrial uppercase text-xs text-steel mb-2">{category.category}</p>
                    {category.items && category.items.length > 0 && (
                      <div className="space-y-1 ml-4">
                        {category.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex justify-between items-start">
                            <span className="font-industrial text-foreground">
                              {item.name} {item.quantity && `(×${item.quantity})`}
                            </span>
                            {item.price !== undefined && (
                              <span className="font-industrial text-steel">£{item.price.toFixed(2)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        {content.timeline && content.timeline.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('timeline')}
              className="w-full p-4 flex items-center justify-between hover:bg-surface transition-colors"
            >
              <span className="font-industrial uppercase text-sm font-medium text-foreground">Timeline</span>
              {expandedSections.timeline ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.timeline && (
              <div className="p-6 pt-0 space-y-2">
                {content.timeline.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <span className="font-industrial text-foreground font-medium font-mono">{item.time}</span>
                    <span className="font-industrial text-foreground text-right flex-1 ml-4">{item.activity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pricing */}
        {content.pricing && (
          <div>
            <button
              onClick={() => toggleSection('pricing')}
              className="w-full p-4 flex items-center justify-between hover:bg-surface transition-colors"
            >
              <span className="font-industrial uppercase text-sm font-medium text-foreground">Financial Breakdown</span>
              {expandedSections.pricing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.pricing && (
              <div className="p-6 pt-0 space-y-3">
                {content.pricing.subtotal !== undefined && (
                  <div className="flex justify-between items-start">
                    <span className="font-industrial text-steel">Subtotal</span>
                    <span className="font-industrial text-foreground">£{content.pricing.subtotal.toFixed(2)}</span>
                  </div>
                )}
                {content.pricing.service_charge_rate !== undefined && content.pricing.service_charge_amount !== undefined && (
                  <div className="flex justify-between items-start">
                    <span className="font-industrial text-steel">Service Charge ({content.pricing.service_charge_rate}%)</span>
                    <span className="font-industrial text-foreground">£{content.pricing.service_charge_amount.toFixed(2)}</span>
                  </div>
                )}
                {content.pricing.vat_rate !== undefined && content.pricing.vat_amount !== undefined && (
                  <div className="flex justify-between items-start">
                    <span className="font-industrial text-steel">VAT ({content.pricing.vat_rate}%)</span>
                    <span className="font-industrial text-foreground">£{content.pricing.vat_amount.toFixed(2)}</span>
                  </div>
                )}
                {content.pricing.total !== undefined && (
                  <div className="flex justify-between items-start pt-3 border-t-[3px] border-black">
                    <span className="font-industrial text-foreground font-bold text-lg">Total</span>
                    <span className="font-industrial text-foreground font-bold text-lg">£{content.pricing.total.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="p-4 border-t-[3px] border-black bg-surface">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-steel mt-0.5 flex-shrink-0" />
          <p className="font-industrial text-xs text-steel">
            This proposal is generated from your event details. For the full PDF version, please contact your event coordinator.
          </p>
        </div>
      </div>
    </div>
  );
};
