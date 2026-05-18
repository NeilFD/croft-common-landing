import { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, differenceInCalendarDays, format, isSameDay, isWeekend, startOfDay } from 'date-fns';
import type { MarketingCampaign } from '@/lib/marketing/types';
import {
  LANE_LABELS,
  LANE_ORDER,
  PROPERTY_ACCENT,
  dayIndex,
  indexToDate,
  type Lane,
  type ProgrammeWindow,
} from '@/lib/marketing/programme';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { CampaignTooltip } from './CampaignTooltip';

interface Props {
  window: ProgrammeWindow;
  campaigns: MarketingCampaign[];
  onOpenCampaign: (id: string) => void;
  onCreateInLane: (lane: Lane, date: Date) => void;
  onCommitDates: (id: string, startISO: string, endISO: string) => Promise<void>;
  optimisticUpdate: (id: string, startISO: string, endISO: string) => void;
  readOnly?: boolean;
}

const LANE_PADDING = 12; // top+bottom padding inside a lane
const SUB_ROW_HEIGHT = 26; // px per stacked bar within a lane
const SUB_ROW_GAP = 4;
const LANE_MIN_HEIGHT = 56; // px minimum row height
const LEFT_RAIL = 160; // px label column
const MIN_DAY_WIDTH = 26; // px — ensures day numbers stay legible (esp. in Quarter view)

type DragMode = 'move' | 'resize-l' | 'resize-r';

export const GanttGrid = ({
  window: win,
  campaigns,
  onOpenCampaign,
  onCreateInLane,
  onCommitDates,
  optimisticUpdate,
  readOnly = false,
}: Props) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [dayWidth, setDayWidth] = useState(32);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const update = () => {
      const w = el.getBoundingClientRect().width;
      setDayWidth(Math.max(MIN_DAY_WIDTH, w / win.days));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [win.days]);

  // Pack bars into sub-rows per lane so overlapping campaigns stack vertically
  // without overlapping. Lane height grows to fit the deepest stack.
  const packed = useMemo(() => {
    const lanes: Record<Lane, { items: Array<{ c: MarketingCampaign; subRow: number; startIdx: number; endIdx: number }>; rows: number }> = {
      key_dates: { items: [], rows: 1 },
      room_promo: { items: [], rows: 1 },
      fnb_promo: { items: [], rows: 1 },
      live_campaign: { items: [], rows: 1 },
      programming: { items: [], rows: 1 },
      social: { items: [], rows: 1 },
      newsletter: { items: [], rows: 1 },
    };
    const sorted = [...campaigns]
      .filter((c) => c.start_date && c.end_date)
      .sort((a, b) => (a.start_date! < b.start_date! ? -1 : 1));
    for (const c of sorted) {
      const lane = lanes[c.lane as Lane];
      if (!lane) continue;
      const start = new Date(c.start_date!);
      const end = new Date(c.end_date!);
      const sIdx = dayIndex(start, win);
      const eIdx = dayIndex(end, win);
      // Find first sub-row whose latest endIdx < sIdx
      const rowEnds: number[] = [];
      for (const item of lane.items) {
        rowEnds[item.subRow] = Math.max(rowEnds[item.subRow] ?? -Infinity, item.endIdx);
      }
      let subRow = 0;
      while ((rowEnds[subRow] ?? -Infinity) >= sIdx) subRow++;
      lane.items.push({ c, subRow, startIdx: sIdx, endIdx: eIdx });
      lane.rows = Math.max(lane.rows, subRow + 1);
    }
    return lanes;
  }, [campaigns, win]);

  const laneHeight = (lane: Lane) =>
    Math.max(
      LANE_MIN_HEIGHT,
      LANE_PADDING + packed[lane].rows * SUB_ROW_HEIGHT + (packed[lane].rows - 1) * SUB_ROW_GAP,
    );

  const today = startOfDay(new Date());
  const todayInWindow = today >= win.start && today <= win.end;
  const todayLeft = todayInWindow ? dayIndex(today, win) * dayWidth : null;

  const headerDays = Array.from({ length: win.days }, (_, i) => addDays(win.start, i));

  const minGridWidth = win.days * MIN_DAY_WIDTH;
  const colTemplate = `repeat(${win.days}, minmax(${MIN_DAY_WIDTH}px, 1fr))`;

  return (
    <div className="border border-foreground bg-background overflow-x-auto">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `${LEFT_RAIL}px 1fr`,
          minWidth: LEFT_RAIL + minGridWidth,
        }}
      >
        {/* Top-left corner */}
        <div className="border-b border-r border-foreground bg-foreground text-background px-3 py-2 font-display text-xs uppercase tracking-wider flex items-center sticky left-0 z-10">
          {format(win.start, 'MMM yyyy')}
          {win.size === 'quarter' ? ` – ${format(win.end, 'MMM yyyy')}` : ''}
        </div>

        {/* Day header */}
        <div
          className="border-b border-foreground bg-foreground text-background grid"
          style={{ gridTemplateColumns: colTemplate }}
        >
        {headerDays.map((d, i) => (
          <div
            key={i}
            className={`text-[10px] font-display py-1 text-center border-r border-background/20 ${
              isWeekend(d) ? 'bg-background/10' : ''
            }`}
            title={format(d, 'EEEE d MMMM yyyy')}
          >
            {format(d, 'd')}
          </div>
        ))}
      </div>

      {/* Lane label rail */}
      <div className="border-r border-foreground">
        {LANE_ORDER.map((lane) => (
          <div
            key={lane}
            className="border-b border-foreground/20 px-3 flex items-center font-display uppercase tracking-wider text-[11px]"
            style={{ height: laneHeight(lane) }}
          >
            {LANE_LABELS[lane]}
          </div>
        ))}
      </div>

      {/* Grid + bars */}
      <div ref={gridRef} className="relative">
        {/* Lane row backgrounds (with weekend striping) */}
        {LANE_ORDER.map((lane, laneIdx) => (
          <div
            key={lane}
            className="relative border-b border-foreground/20"
            style={{ height: laneHeight(lane) }}
          >
            {/* Vertical day separators */}
            <div
              className="absolute inset-0 grid pointer-events-none"
              style={{ gridTemplateColumns: colTemplate }}
            >
              {headerDays.map((d, i) => (
                <div
                  key={i}
                  className={`border-r border-foreground/10 ${
                    isWeekend(d) ? 'bg-foreground/[0.03]' : ''
                  }`}
                />
              ))}
            </div>

            {/* Click-to-create overlay */}
            {!readOnly && (
              <div
                className="absolute inset-0 grid"
                style={{ gridTemplateColumns: colTemplate }}
              >
                {headerDays.map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`New ${LANE_LABELS[lane]} on ${format(d, 'd MMM')}`}
                    onClick={() => onCreateInLane(lane, d)}
                    className="cursor-cell hover:bg-foreground/5"
                  />
                ))}
              </div>
            )}

            {/* Bars */}
            {packed[lane].items.map((item) => (
              <GanttBar
                key={item.c.id}
                campaign={item.c}
                window={win}
                dayWidth={dayWidth}
                subRow={item.subRow}
                subRowHeight={SUB_ROW_HEIGHT}
                subRowGap={SUB_ROW_GAP}
                lanePadding={LANE_PADDING}
                onOpen={() => onOpenCampaign(item.c.id)}
                onCommit={onCommitDates}
                optimistic={optimisticUpdate}
                readOnly={readOnly}
              />
            ))}
          </div>
        ))}

        {/* Today line */}
        {todayLeft !== null && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{
              left: todayLeft + dayWidth / 2,
              width: 0,
              borderLeft: '1px dashed hsl(var(--foreground))',
            }}
          >
            <div className="absolute -top-5 -translate-x-1/2 font-display uppercase text-[9px] tracking-widest bg-foreground text-background px-1.5 py-0.5">
              Today
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------------

interface BarProps {
  campaign: MarketingCampaign;
  window: ProgrammeWindow;
  dayWidth: number;
  subRow: number;
  subRowHeight: number;
  subRowGap: number;
  lanePadding: number;
  onOpen: () => void;
  onCommit: (id: string, startISO: string, endISO: string) => Promise<void>;
  optimistic: (id: string, startISO: string, endISO: string) => void;
  readOnly: boolean;
}

const GanttBar = ({
  campaign,
  window: win,
  dayWidth,
  subRow,
  subRowHeight,
  subRowGap,
  lanePadding,
  onOpen,
  onCommit,
  optimistic,
  readOnly,
}: BarProps) => {
  const start = campaign.start_date ? new Date(campaign.start_date) : win.start;
  const end = campaign.end_date ? new Date(campaign.end_date) : win.end;
  const startIdx = Math.max(0, dayIndex(start, win));
  const endIdx = Math.min(win.days - 1, dayIndex(end, win));
  const span = Math.max(1, endIdx - startIdx + 1);

  const [drag, setDrag] = useState<{ mode: DragMode; startX: number; origStartIdx: number; origEndIdx: number } | null>(null);
  const [previewStart, setPreviewStart] = useState(startIdx);
  const [previewSpan, setPreviewSpan] = useState(span);
  // Refs mirror latest preview values so the pointerup handler never reads
  // stale closure state (pointerup can fire before React flushes the last
  // pointermove update).
  const previewStartRef = useRef(startIdx);
  const previewSpanRef = useRef(span);

  useEffect(() => {
    if (!drag) {
      setPreviewStart(startIdx);
      setPreviewSpan(span);
      previewStartRef.current = startIdx;
      previewSpanRef.current = span;
    }
  }, [startIdx, span, drag]);

  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      const deltaDays = Math.round((e.clientX - drag.startX) / Math.max(1, dayWidth));
      let s = drag.origStartIdx;
      let en = drag.origEndIdx;
      if (drag.mode === 'move') {
        s = drag.origStartIdx + deltaDays;
        en = drag.origEndIdx + deltaDays;
      } else if (drag.mode === 'resize-l') {
        s = Math.min(drag.origEndIdx, drag.origStartIdx + deltaDays);
      } else {
        en = Math.max(drag.origStartIdx, drag.origEndIdx + deltaDays);
      }
      // clamp to window
      if (s < 0) {
        en = en - s;
        s = 0;
      }
      if (en > win.days - 1) {
        const over = en - (win.days - 1);
        if (drag.mode === 'move') s -= over;
        en = win.days - 1;
        if (s < 0) s = 0;
      }
      const nextSpan = Math.max(1, en - s + 1);
      previewStartRef.current = s;
      previewSpanRef.current = nextSpan;
      setPreviewStart(s);
      setPreviewSpan(nextSpan);
    };
    const onUp = async () => {
      const ps = previewStartRef.current;
      const pSpan = previewSpanRef.current;
      const newStart = indexToDate(ps, win);
      const newEnd = indexToDate(ps + pSpan - 1, win);
      const sISO = format(newStart, 'yyyy-MM-dd');
      const eISO = format(newEnd, 'yyyy-MM-dd');
      setDrag(null);
      if (sISO !== campaign.start_date || eISO !== campaign.end_date) {
        optimistic(campaign.id, sISO, eISO);
        try {
          await onCommit(campaign.id, sISO, eISO);
        } catch (err) {
          console.error('Failed to commit dates', err);
        }
      }
    };
    globalThis.addEventListener('pointermove', onMove);
    globalThis.addEventListener('pointerup', onUp, { once: true });
    return () => {
      globalThis.removeEventListener('pointermove', onMove);
      globalThis.removeEventListener('pointerup', onUp);
    };
  }, [drag, dayWidth, win, campaign.id, campaign.start_date, campaign.end_date, onCommit, optimistic]);

  const accent = campaign.property_tag ? PROPERTY_ACCENT[campaign.property_tag] : '#666';
  const top = lanePadding / 2 + subRow * (subRowHeight + subRowGap);
  const height = subRowHeight;

  const startDrag = (mode: DragMode) => (e: React.PointerEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    e.preventDefault();
    setDrag({ mode, startX: e.clientX, origStartIdx: startIdx, origEndIdx: endIdx });
  };

  const title = `${campaign.name}\n${format(indexToDate(previewStart, win), 'd MMM')} – ${format(indexToDate(previewStart + previewSpan - 1, win), 'd MMM')}`;

  return (
    <HoverCard openDelay={150} closeDelay={50} open={drag ? false : undefined}>
      <HoverCardTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            if (drag) return;
            e.stopPropagation();
            onOpen();
          }}
          onPointerDown={startDrag('move')}
          className="absolute group select-none border border-foreground bg-background text-foreground shadow-[2px_2px_0_0_hsl(var(--foreground))] flex items-stretch text-[11px] font-display uppercase tracking-wider"
          style={{
            left: previewStart * dayWidth,
            width: previewSpan * dayWidth - 2,
            top,
            height: Math.max(20, height),
            cursor: readOnly ? 'pointer' : drag?.mode === 'move' ? 'grabbing' : 'grab',
          }}
        >
          <span aria-hidden className="w-1.5 shrink-0" style={{ background: accent }} />
          <span className="flex-1 px-2 overflow-hidden whitespace-nowrap text-ellipsis flex items-center">
            {campaign.name}
          </span>
          {!readOnly && (
            <>
              <span
                onPointerDown={startDrag('resize-l')}
                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize"
                aria-label="Resize start"
              />
              <span
                onPointerDown={startDrag('resize-r')}
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize"
                aria-label="Resize end"
              />
            </>
          )}
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="start"
        sideOffset={8}
        collisionPadding={16}
        className="p-0 border-0 bg-transparent shadow-[4px_4px_0_0_hsl(var(--foreground))] w-auto z-50"
      >
        <CampaignTooltip campaign={campaign} />
      </HoverCardContent>
    </HoverCard>
  );
};
