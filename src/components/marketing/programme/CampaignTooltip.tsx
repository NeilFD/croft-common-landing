import { differenceInCalendarDays, format } from 'date-fns';
import type { MarketingCampaign } from '@/lib/marketing/types';
import { STATUS_LABELS } from '@/lib/marketing/types';
import { LANE_LABELS, PROPERTY_ACCENT, PROPERTY_LABELS, type Lane } from '@/lib/marketing/programme';

interface Props {
  campaign: MarketingCampaign;
}

const STATUS_TONE: Record<string, string> = {
  draft: '#9CA3AF',
  in_review: '#F59E0B',
  changes_requested: '#F97316',
  rejected: '#DC2626',
  approved: '#10B981',
  scheduled: '#3B82F6',
  published: '#22C55E',
  archived: '#6B7280',
};

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);

export const CampaignTooltip = ({ campaign }: Props) => {
  const start = campaign.start_date ? new Date(campaign.start_date) : null;
  const end = campaign.end_date ? new Date(campaign.end_date) : null;
  const today = new Date();

  let duration: number | null = null;
  let countdown: string | null = null;
  if (start && end) {
    duration = differenceInCalendarDays(end, start) + 1;
    const toStart = differenceInCalendarDays(start, today);
    const toEnd = differenceInCalendarDays(end, today);
    if (toStart > 0) countdown = `Starts in ${toStart} day${toStart === 1 ? '' : 's'}`;
    else if (toEnd >= 0) countdown = `Live · ${toEnd} day${toEnd === 1 ? '' : 's'} left`;
    else countdown = `Ended ${Math.abs(toEnd)} day${Math.abs(toEnd) === 1 ? '' : 's'} ago`;
  }

  const propertyAccent = campaign.property_tag ? PROPERTY_ACCENT[campaign.property_tag] : '#666';
  const statusTone = STATUS_TONE[campaign.status] ?? '#9CA3AF';
  const dateRange =
    start && end
      ? `${format(start, 'd MMM')} – ${format(end, 'd MMM yyyy')}${duration ? ` · ${duration} day${duration === 1 ? '' : 's'}` : ''}`
      : 'No dates set';

  return (
    <div className="w-[320px] bg-foreground text-background font-sans">
      {/* Header */}
      <div className="px-4 py-3 border-b border-background/15">
        <h3 className="font-display uppercase tracking-wider text-base leading-tight">
          {campaign.name}
        </h3>
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <span
            className="text-[9px] font-display uppercase tracking-widest px-2 py-0.5"
            style={{ background: statusTone, color: '#000' }}
          >
            {STATUS_LABELS[campaign.status as keyof typeof STATUS_LABELS] ?? campaign.status}
          </span>
          {campaign.property_tag && (
            <span
              className="text-[9px] font-display uppercase tracking-widest px-2 py-0.5"
              style={{ background: propertyAccent, color: '#fff' }}
            >
              {PROPERTY_LABELS[campaign.property_tag]}
            </span>
          )}
          <span className="text-[9px] font-display uppercase tracking-widest px-2 py-0.5 border border-background/30">
            {LANE_LABELS[campaign.lane as Lane]}
          </span>
        </div>
      </div>

      {/* Dates + countdown */}
      <div className="px-4 py-3 border-b border-background/15">
        <p className="font-display uppercase tracking-wider text-[10px] text-background/60">
          When
        </p>
        <p className="text-sm mt-0.5">{dateRange}</p>
        {countdown && (
          <p className="text-[11px] mt-1 font-display uppercase tracking-wider text-background/70">
            {countdown}
          </p>
        )}
      </div>

      {/* Details */}
      {(campaign.goal || campaign.kpi || campaign.budget != null) && (
        <div className="px-4 py-3 border-b border-background/15 space-y-2">
          {campaign.goal && (
            <div>
              <p className="font-display uppercase tracking-wider text-[10px] text-background/60">Goal</p>
              <p className="text-sm leading-snug line-clamp-2">{campaign.goal}</p>
            </div>
          )}
          {campaign.kpi && (
            <div>
              <p className="font-display uppercase tracking-wider text-[10px] text-background/60">KPI</p>
              <p className="text-sm leading-snug">{campaign.kpi}</p>
            </div>
          )}
          {campaign.budget != null && (
            <div>
              <p className="font-display uppercase tracking-wider text-[10px] text-background/60">Budget</p>
              <p className="text-sm">{fmtMoney(campaign.budget)}</p>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {campaign.notes && (
        <div className="px-4 py-3 border-b border-background/15">
          <p className="font-display uppercase tracking-wider text-[10px] text-background/60">Notes</p>
          <p className="text-[12px] italic leading-snug mt-1 line-clamp-3 text-background/90">
            {campaign.notes}
          </p>
        </div>
      )}

      {/* Footer hint */}
      <div className="px-4 py-2">
        <p className="font-display uppercase tracking-widest text-[9px] text-background/50">
          Click to edit · drag edges to resize
        </p>
      </div>
    </div>
  );
};
