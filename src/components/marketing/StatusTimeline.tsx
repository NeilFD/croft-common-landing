import { format } from 'date-fns';
import { useMarketingStatusLog } from '@/hooks/useMarketing';
import { STATUS_LABELS, type MarketingStatus } from '@/lib/marketing/types';

interface Props {
  postId: string;
}

export const StatusTimeline = ({ postId }: Props) => {
  const { data: log = [], isLoading } = useMarketingStatusLog(postId);

  return (
    <div className="space-y-3">
      <div className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">
        Audit log
      </div>
      {isLoading && <div className="text-xs text-muted-foreground">Loading...</div>}
      {!isLoading && log.length === 0 && (
        <div className="text-xs text-muted-foreground italic">No status changes yet.</div>
      )}
      <ol className="space-y-2 border-l border-foreground/20 pl-3">
        {log.map((entry) => (
          <li key={entry.id} className="text-xs">
            <div className="flex items-center gap-2">
              <span className="font-display uppercase tracking-wider">
                {entry.from_status ? STATUS_LABELS[entry.from_status as MarketingStatus] || entry.from_status : 'Created'}
              </span>
              <span className="text-muted-foreground">{'->'}</span>
              <span className="font-display uppercase tracking-wider">
                {STATUS_LABELS[entry.to_status as MarketingStatus] || entry.to_status}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {format(new Date(entry.created_at), 'd MMM yyyy, HH:mm')}
            </div>
            {entry.note && <div className="text-xs italic mt-0.5">{entry.note}</div>}
          </li>
        ))}
      </ol>
    </div>
  );
};
