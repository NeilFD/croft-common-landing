import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface ProposalContent {
  eventOverview?: {
    clientName?: string;
    eventCode?: string;
    headcount?: number;
    eventDate?: string;
    eventType?: string;
    contactEmail?: string;
  };
  venue?: {
    venue_name?: string;
    setup_time?: string;
    breakdown_time?: string;
    hire_cost?: number;
    vat_rate?: number;
    capacity?: number;
    notes?: string;
  };
  setup?: {
    spaces?: Array<{
      space_name: string;
      capacity: number;
      layout_type: string;
      setup_time: string;
      breakdown_time: string;
      setup_notes?: string;
    }>;
  };
  menu?: {
    courses?: Array<{
      course: string;
      items: Array<{
        item_name: string;
        allergens?: string[];
        description?: string;
      }>;
    }>;
  };
  equipment?: Array<{
    category: string;
    item_name: string;
    quantity: number;
    specifications?: string;
  }>;
  timeline?: {
    schedule?: Array<{
      time_label: string;
      scheduled_at: string;
      duration_minutes?: number;
      notes?: string;
    }>;
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
    setup: true,
    menu: true,
    equipment: true,
    timeline: true,
    pricing: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Calculate pricing dynamically from available data
  const calculatePricing = () => {
    const venueHire = content.venue?.hire_cost || 0;
    const vatRate = content.venue?.vat_rate || 20;
    const serviceChargeRate = 10;
    
    const subtotal = venueHire;
    const serviceCharge = subtotal * (serviceChargeRate / 100);
    const subtotalWithService = subtotal + serviceCharge;
    const vat = subtotalWithService * (vatRate / 100);
    const total = subtotalWithService + vat;
    
    return { 
      subtotal, 
      serviceCharge, 
      vat, 
      total, 
      vatRate, 
      serviceChargeRate 
    };
  };

  const pricing = calculatePricing();

  // Group equipment by category
  const groupedEquipment = content.equipment?.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof content.equipment>);

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
        {content.eventOverview && (
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
                {content.eventOverview.clientName && (
                  <div>
                    <p className="font-industrial text-xs uppercase text-steel mb-1">Client</p>
                    <p className="font-industrial text-foreground">{content.eventOverview.clientName}</p>
                  </div>
                )}
                {content.eventOverview.eventCode && (
                  <div>
                    <p className="font-industrial text-xs uppercase text-steel mb-1">Event Code</p>
                    <p className="font-industrial text-foreground font-mono">{content.eventOverview.eventCode}</p>
                  </div>
                )}
                {content.eventOverview.headcount && (
                  <div>
                    <p className="font-industrial text-xs uppercase text-steel mb-1">Headcount</p>
                    <p className="font-industrial text-foreground">{content.eventOverview.headcount} guests</p>
                  </div>
                )}
                {content.eventOverview.eventDate && (
                  <div>
                    <p className="font-industrial text-xs uppercase text-steel mb-1">Date</p>
                    <p className="font-industrial text-foreground">{content.eventOverview.eventDate}</p>
                  </div>
                )}
                {content.eventOverview.eventType && (
                  <div>
                    <p className="font-industrial text-xs uppercase text-steel mb-1">Event Type</p>
                    <p className="font-industrial text-foreground">{content.eventOverview.eventType}</p>
                  </div>
                )}
                {content.eventOverview.contactEmail && (
                  <div>
                    <p className="font-industrial text-xs uppercase text-steel mb-1">Contact Email</p>
                    <p className="font-industrial text-foreground">{content.eventOverview.contactEmail}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Venue Details */}
        {content.venue && (
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
                {content.venue.venue_name && (
                  <div className="flex justify-between items-start">
                    <span className="font-industrial text-steel">Venue</span>
                    <span className="font-industrial text-foreground font-medium">{content.venue.venue_name}</span>
                  </div>
                )}
                {content.venue.capacity !== undefined && (
                  <div className="flex justify-between items-start">
                    <span className="font-industrial text-steel">Capacity</span>
                    <span className="font-industrial text-foreground font-medium">{content.venue.capacity} guests</span>
                  </div>
                )}
                {content.venue.setup_time && (
                  <div className="flex justify-between items-start">
                    <span className="font-industrial text-steel">Setup Time</span>
                    <span className="font-industrial text-foreground font-medium">{content.venue.setup_time}</span>
                  </div>
                )}
                {content.venue.breakdown_time && (
                  <div className="flex justify-between items-start">
                    <span className="font-industrial text-steel">Breakdown Time</span>
                    <span className="font-industrial text-foreground font-medium">{content.venue.breakdown_time}</span>
                  </div>
                )}
                {content.venue.hire_cost !== undefined && (
                  <div className="flex justify-between items-start pt-2 border-t-[2px] border-black">
                    <span className="font-industrial text-foreground font-medium">Venue Hire</span>
                    <span className="font-industrial text-foreground font-medium">£{content.venue.hire_cost.toFixed(2)}</span>
                  </div>
                )}
                {content.venue.notes && (
                  <div className="pt-2 border-t-[2px] border-black">
                    <p className="font-industrial text-xs uppercase text-steel mb-1">Notes</p>
                    <p className="font-industrial text-foreground text-sm">{content.venue.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Setup Details */}
        {content.setup?.spaces && content.setup.spaces.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('setup')}
              className="w-full p-4 flex items-center justify-between hover:bg-surface transition-colors"
            >
              <span className="font-industrial uppercase text-sm font-medium text-foreground">Setup Details</span>
              {expandedSections.setup ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.setup && (
              <div className="p-6 pt-0 space-y-4">
                {content.setup.spaces.map((space, idx) => (
                  <div key={idx} className="border-l-[3px] border-black pl-4">
                    <p className="font-industrial font-bold text-foreground mb-2">{space.space_name}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-industrial text-steel">Layout</span>
                        <span className="font-industrial text-foreground">{space.layout_type}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="font-industrial text-steel">Capacity</span>
                        <span className="font-industrial text-foreground">{space.capacity} guests</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="font-industrial text-steel">Setup</span>
                        <span className="font-industrial text-foreground">{space.setup_time}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="font-industrial text-steel">Breakdown</span>
                        <span className="font-industrial text-foreground">{space.breakdown_time}</span>
                      </div>
                    </div>
                    {space.setup_notes && (
                      <p className="font-industrial text-steel text-sm mt-2">{space.setup_notes}</p>
                    )}
                  </div>
                ))}
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
                    <p className="font-industrial uppercase font-bold text-foreground mb-2">{course.course}</p>
                    {course.items && course.items.length > 0 && (
                      <div className="space-y-2 ml-4">
                        {course.items.map((item, itemIdx) => (
                          <div key={itemIdx}>
                            <p className="font-industrial text-foreground">{item.item_name}</p>
                            {item.description && (
                              <p className="font-industrial text-steel text-sm ml-2">{item.description}</p>
                            )}
                            {item.allergens && item.allergens.length > 0 && (
                              <p className="font-industrial text-steel text-xs ml-2">
                                Allergens: {item.allergens.join(', ')}
                              </p>
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
        {groupedEquipment && Object.keys(groupedEquipment).length > 0 && (
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
                {Object.entries(groupedEquipment).map(([category, items], idx) => (
                  <div key={idx}>
                    <p className="font-industrial uppercase font-bold text-foreground mb-2">{category}</p>
                    <div className="space-y-2 ml-4">
                      {items?.map((item, itemIdx) => (
                        <div key={itemIdx}>
                          <div className="flex justify-between items-start">
                            <span className="font-industrial text-foreground">
                              {item.item_name}
                            </span>
                            <span className="font-industrial text-steel">
                              ×{item.quantity}
                            </span>
                          </div>
                          {item.specifications && (
                            <p className="font-industrial text-steel text-xs ml-2">{item.specifications}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        {content.timeline?.schedule && content.timeline.schedule.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('timeline')}
              className="w-full p-4 flex items-center justify-between hover:bg-surface transition-colors"
            >
              <span className="font-industrial uppercase text-sm font-medium text-foreground">Timeline</span>
              {expandedSections.timeline ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.timeline && (
              <div className="p-6 pt-0 space-y-3">
                {content.timeline.schedule.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="font-industrial text-foreground font-bold">{item.time_label}</span>
                      <span className="font-industrial text-steel font-mono text-sm">{item.scheduled_at}</span>
                    </div>
                    {item.duration_minutes && (
                      <p className="font-industrial text-steel text-xs ml-2">Duration: {item.duration_minutes} minutes</p>
                    )}
                    {item.notes && (
                      <p className="font-industrial text-steel text-sm ml-2">{item.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pricing */}
        {pricing.total > 0 && (
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
                <div className="flex justify-between items-start">
                  <span className="font-industrial text-steel">Subtotal</span>
                  <span className="font-industrial text-foreground">£{pricing.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="font-industrial text-steel">Service Charge ({pricing.serviceChargeRate}%)</span>
                  <span className="font-industrial text-foreground">£{pricing.serviceCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="font-industrial text-steel">VAT ({pricing.vatRate}%)</span>
                  <span className="font-industrial text-foreground">£{pricing.vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-start pt-3 border-t-[3px] border-black">
                  <span className="font-industrial text-foreground font-bold text-lg">Total</span>
                  <span className="font-industrial text-foreground font-bold text-lg">£{pricing.total.toFixed(2)}</span>
                </div>
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
