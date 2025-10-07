import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface LineItem {
  id: string;
  category: string;
  item_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  item_order: number;
}

interface ProposalContent {
  eventOverview?: {
    clientName?: string;
    eventName?: string;
    headcount?: number;
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
  lineItems?: LineItem[];
  serviceChargePct?: number;
}

export const ProposalViewer = ({ content, versionNo, generatedAt, lineItems = [], serviceChargePct = 0 }: ProposalViewerProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    overview: false,
    venue: false,
    setup: false,
    menu: false,
    equipment: false,
    timeline: false,
    pricing: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    
    // Handle ISO 8601 timestamp (2025-09-28T10:00:00+00:00)
    if (timeString.includes('T')) {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    
    // Handle time-only format (10:00:00)
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }
    
    return timeString;
  };

  const calculatePricing = () => {
    // Sum gross (incl. VAT) from line items
    const grossSubtotal = lineItems.reduce((sum, item) => sum + (item.total_cost || 0), 0);

    // Determine VAT rate from content (fallback 20%)
    const vatRate = content?.venue?.vat_rate ?? 20;

    // Compute net by removing VAT from gross
    const netSubtotal = vatRate > 0 ? grossSubtotal / (1 + vatRate / 100) : grossSubtotal;
    const vat = grossSubtotal - netSubtotal;

    // Service charge: match main builder display (rate applied to gross)
    const scRate = (serviceChargePct ?? 0);
    const serviceCharge = grossSubtotal * (scRate / 100);

    const total = grossSubtotal + serviceCharge;

    return {
      netSubtotal,
      grossSubtotal,
      serviceCharge,
      vat,
      total,
      vatRate,
      serviceChargeRate: scRate,
    };
  };

  const groupedEquipment = content.equipment?.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof content.equipment>);

  // Group line items by category
  const groupedLineItems = lineItems
    .filter(item => item.category !== 'Service Charge' && item.category !== 'VAT')
    .reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, LineItem[]>);

  return (
    <div className="space-y-4">
      {/* Header with Master Toggle */}
      <div className="border-2 border-industrial bg-card p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-brutalist text-xl md:text-2xl font-black uppercase tracking-wider">
              PROPOSAL v{versionNo}
            </h1>
            <p className="font-industrial text-sm text-muted-foreground mt-1">
              Generated {new Date(generatedAt).toLocaleDateString('en-GB', { 
                day: '2-digit',
                month: 'short', 
                year: 'numeric' 
              })}
            </p>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 font-industrial text-sm font-medium text-industrial hover:text-steel transition-colors border-2 border-industrial px-4 py-2"
          >
            {showDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            VIEW PROPOSAL DETAILS
          </button>
        </div>
      </div>

      {/* All Sections - Only shown when showDetails is true */}
      {showDetails && (
        <>
          {/* Event Overview Section */}
          {content.eventOverview && (
        <div className="border-2 border-industrial bg-card">
          <button
            onClick={() => toggleSection('overview')}
            className="w-full px-4 md:px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <h2 className="font-brutalist text-lg md:text-xl font-black uppercase tracking-wider">
              Event Overview
            </h2>
            {expandedSections.overview ? (
              <ChevronDown className="h-5 w-5 text-industrial" />
            ) : (
              <ChevronRight className="h-5 w-5 text-industrial" />
            )}
          </button>
          
          {expandedSections.overview && (
            <div className="px-4 md:px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {content.eventOverview.clientName && (
                  <div>
                    <span className="font-industrial text-xs uppercase text-steel block mb-1">Client Name</span>
                    <span className="font-industrial text-foreground">{content.eventOverview.clientName}</span>
                  </div>
                )}
                {content.eventOverview.eventName && (
                  <div>
                    <span className="font-industrial text-xs uppercase text-steel block mb-1">Event Name</span>
                    <span className="font-industrial text-foreground">{content.eventOverview.eventName}</span>
                  </div>
                )}
                {content.eventOverview.headcount && (
                  <div>
                    <span className="font-industrial text-xs uppercase text-steel block mb-1">Headcount</span>
                    <span className="font-industrial text-foreground">{content.eventOverview.headcount} guests</span>
                  </div>
                )}
                {content.eventOverview.contactEmail && (
                  <div>
                    <span className="font-industrial text-xs uppercase text-steel block mb-1">Contact Email</span>
                    <span className="font-industrial text-foreground">{content.eventOverview.contactEmail}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Venue Details Section */}
      {content.venue && (
        <div className="border-2 border-industrial bg-card">
          <button
            onClick={() => toggleSection('venue')}
            className="w-full px-4 md:px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <h2 className="font-brutalist text-lg md:text-xl font-black uppercase tracking-wider">
              Venue Details
            </h2>
            {expandedSections.venue ? (
              <ChevronDown className="h-5 w-5 text-industrial" />
            ) : (
              <ChevronRight className="h-5 w-5 text-industrial" />
            )}
          </button>
          
          {expandedSections.venue && (
            <div className="px-4 md:px-6 pb-6">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="font-industrial text-steel">Venue</span>
                  <span className="font-industrial text-foreground font-medium">{content.venue.venue_name}</span>
                </div>
                {content.venue.hire_cost !== undefined && (
                  <div className="flex justify-between items-start">
                    <span className="font-industrial text-steel">Hire Cost</span>
                    <span className="font-industrial text-foreground font-medium">£{content.venue.hire_cost.toFixed(2)}</span>
                  </div>
                )}
                {content.venue.setup_time && (
                  <div className="flex justify-between items-start">
                    <span className="font-industrial text-steel">Setup Time</span>
                    <span className="font-industrial text-foreground font-medium pr-2">{formatTime(content.venue.setup_time)}</span>
                  </div>
                )}
                {content.venue.breakdown_time && (
                  <div className="flex justify-between items-start">
                    <span className="font-industrial text-steel">Breakdown Time</span>
                    <span className="font-industrial text-foreground font-medium pr-2">{formatTime(content.venue.breakdown_time)}</span>
                  </div>
                )}
                {content.venue.capacity !== undefined && content.venue.capacity > 0 && (
                  <div className="flex justify-between items-start">
                    <span className="font-industrial text-steel">Capacity</span>
                    <span className="font-industrial text-foreground font-medium pr-2">{content.venue.capacity} guests</span>
                  </div>
                )}
                {content.venue.notes && (
                  <div className="pt-2 border-t border-industrial/20">
                    <span className="font-industrial text-xs uppercase text-steel block mb-1">Notes</span>
                    <span className="font-industrial text-foreground text-sm">{content.venue.notes}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Setup Details Section */}
      {content.setup?.spaces && content.setup.spaces.length > 0 && (
        <div className="border-2 border-industrial bg-card">
          <button
            onClick={() => toggleSection('setup')}
            className="w-full px-4 md:px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <h2 className="font-brutalist text-lg md:text-xl font-black uppercase tracking-wider">
              Setup Details
            </h2>
            {expandedSections.setup ? (
              <ChevronDown className="h-5 w-5 text-industrial" />
            ) : (
              <ChevronRight className="h-5 w-5 text-industrial" />
            )}
          </button>
          
          {expandedSections.setup && (
            <div className="px-4 md:px-6 pb-6 space-y-6">
              {content.setup.spaces.map((space, index) => (
                <div key={index} className="border-l-2 border-industrial pl-4">
                  <h3 className="font-brutalist text-sm uppercase tracking-wide mb-3">
                    {space.space_name}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-industrial text-steel">Layout</span>
                      <span className="font-industrial text-foreground font-medium">{space.layout_type}</span>
                    </div>
                  <div className="flex justify-between items-start">
                    <span className="font-industrial text-steel">Capacity</span>
                    <span className="font-industrial text-foreground font-medium pr-2">{space.capacity} guests</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="font-industrial text-steel">Setup Time</span>
                    <span className="font-industrial text-foreground font-medium pr-2">{formatTime(space.setup_time)}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="font-industrial text-steel">Breakdown Time</span>
                    <span className="font-industrial text-foreground font-medium pr-2">{formatTime(space.breakdown_time)}</span>
                  </div>
                    {space.setup_notes && (
                      <div className="pt-2 border-t border-industrial/20">
                        <span className="font-industrial text-steel text-sm">{space.setup_notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Menu Section */}
      {content.menu?.courses && content.menu.courses.length > 0 && (
        <div className="border-2 border-industrial bg-card">
          <button
            onClick={() => toggleSection('menu')}
            className="w-full px-4 md:px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <h2 className="font-brutalist text-lg md:text-xl font-black uppercase tracking-wider">
              Menu
            </h2>
            {expandedSections.menu ? (
              <ChevronDown className="h-5 w-5 text-industrial" />
            ) : (
              <ChevronRight className="h-5 w-5 text-industrial" />
            )}
          </button>
          
          {expandedSections.menu && (
            <div className="px-4 md:px-6 pb-6 space-y-6">
              {content.menu.courses.map((course, index) => (
                <div key={index}>
                  <h3 className="font-brutalist text-sm uppercase tracking-wide mb-3">
                    {course.course}
                  </h3>
                  <div className="space-y-2 pl-4">
                    {course.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="space-y-1">
                        <div className="font-industrial text-foreground">{item.item_name}</div>
                        {item.description && (
                          <div className="font-industrial text-steel text-sm">{item.description}</div>
                        )}
                        {item.allergens && item.allergens.length > 0 && (
                          <div className="font-industrial text-steel text-xs">
                            Allergens: {item.allergens.join(', ')}
                          </div>
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

      {/* Equipment Section */}
      {groupedEquipment && Object.keys(groupedEquipment).length > 0 && (
        <div className="border-2 border-industrial bg-card">
          <button
            onClick={() => toggleSection('equipment')}
            className="w-full px-4 md:px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <h2 className="font-brutalist text-lg md:text-xl font-black uppercase tracking-wider">
              Equipment
            </h2>
            {expandedSections.equipment ? (
              <ChevronDown className="h-5 w-5 text-industrial" />
            ) : (
              <ChevronRight className="h-5 w-5 text-industrial" />
            )}
          </button>
          
          {expandedSections.equipment && (
            <div className="px-4 md:px-6 pb-6 space-y-6">
              {Object.entries(groupedEquipment).map(([category, items], index) => (
                <div key={index}>
                  <h3 className="font-brutalist text-sm uppercase tracking-wide mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2 pl-4">
                    {items?.map((item, itemIndex) => (
                      <div key={itemIndex} className="space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="font-industrial text-foreground">{item.item_name}</span>
                          <span className="font-industrial text-steel">×{item.quantity}</span>
                        </div>
                        {item.specifications && (
                          <div className="font-industrial text-steel text-xs">{item.specifications}</div>
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

      {/* Timeline Section */}
      {content.timeline?.schedule && content.timeline.schedule.length > 0 && (
        <div className="border-2 border-industrial bg-card">
          <button
            onClick={() => toggleSection('timeline')}
            className="w-full px-4 md:px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <h2 className="font-brutalist text-lg md:text-xl font-black uppercase tracking-wider">
              Timeline
            </h2>
            {expandedSections.timeline ? (
              <ChevronDown className="h-5 w-5 text-industrial" />
            ) : (
              <ChevronRight className="h-5 w-5 text-industrial" />
            )}
          </button>
          
          {expandedSections.timeline && (
            <div className="px-4 md:px-6 pb-6 space-y-4">
              {content.timeline.schedule.map((item, index) => (
                <div key={index} className="border-l-2 border-industrial pl-4 py-2">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-brutalist text-sm uppercase tracking-wide text-foreground">
                      {item.time_label}
                    </span>
                    <span className="font-industrial text-steel text-sm pr-2">{formatTime(item.scheduled_at)}</span>
                  </div>
                  {item.duration_minutes && (
                    <div className="font-industrial text-steel text-xs">
                      Duration: {item.duration_minutes} minutes
                    </div>
                  )}
                  {item.notes && (
                    <div className="font-industrial text-steel text-sm mt-1">{item.notes}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pricing Section */}
      <div className="border-2 border-industrial bg-card">
        <button
          onClick={() => toggleSection('pricing')}
          className="w-full px-4 md:px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <h2 className="font-brutalist text-lg md:text-xl font-black uppercase tracking-wider">
            Financial Breakdown
          </h2>
          {expandedSections.pricing ? (
            <ChevronDown className="h-5 w-5 text-industrial" />
          ) : (
            <ChevronRight className="h-5 w-5 text-industrial" />
          )}
        </button>
        
        {expandedSections.pricing && (
          <div className="px-4 md:px-6 pb-6 space-y-6">
            {/* Line Items by Category */}
            {Object.entries(groupedLineItems).map(([category, items]) => (
              <div key={category} className="space-y-2">
                <h3 className="font-brutalist text-sm uppercase tracking-wide text-industrial mb-3">
                  {category}
                </h3>
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start pl-4">
                    <div className="flex-1">
                      <span className="font-industrial text-foreground">
                        {item.item_name}
                      </span>
                      {item.quantity > 1 && (
                        <span className="font-industrial text-steel text-sm ml-2">
                          (x{item.quantity} @ £{item.unit_cost.toFixed(2)})
                        </span>
                      )}
                    </div>
                    <span className="font-industrial text-foreground font-medium ml-4">
                      £{item.total_cost.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ))}

            {/* Totals */}
            {(() => {
              const pricing = calculatePricing();
              return (
                <>
                  <div className="space-y-2 pt-4 border-t-2 border-industrial/20">
                    <div className="flex justify-between items-center">
                      <span className="font-industrial text-steel">Net Subtotal</span>
                      <span className="font-industrial text-foreground font-medium">
                        £{pricing.netSubtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-industrial text-steel">
                        VAT ({pricing.vatRate.toFixed(0)}%)
                      </span>
                      <span className="font-industrial text-foreground font-medium">
                        £{pricing.vat.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-industrial text-steel">
                        Service Charge ({pricing.serviceChargeRate.toFixed(0)}%)
                      </span>
                      <span className="font-industrial text-foreground font-medium">
                        £{pricing.serviceCharge.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t-2 border-industrial">
                    <span className="font-brutalist text-lg uppercase tracking-wide">Grand Total</span>
                    <span className="font-brutalist text-xl text-foreground">
                      £{pricing.total.toFixed(2)}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};
