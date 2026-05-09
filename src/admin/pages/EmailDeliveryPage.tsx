import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '../components/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type LogRow = {
  message_id: string | null;
  template_name: string | null;
  recipient_email: string | null;
  status: string | null;
  error_message: string | null;
  created_at: string;
};

const RANGES = [
  { label: '24h', hours: 24 },
  { label: '7 days', hours: 24 * 7 },
  { label: '30 days', hours: 24 * 30 },
];

const statusVariant = (status: string | null) => {
  switch (status) {
    case 'sent':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'dlq':
    case 'failed':
    case 'bounced':
    case 'complained':
      return 'destructive';
    case 'suppressed':
    case 'rate_limited':
      return 'outline';
    default:
      return 'secondary';
  }
};

export const EmailDeliveryPage = () => {
  const [hours, setHours] = useState(24);
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('email_send_log')
      .select('message_id, template_name, recipient_email, status, error_message, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Failed to load email_send_log', error);
      setRows([]);
      setLoading(false);
      return;
    }

    // Deduplicate by message_id, keeping the latest row per email.
    const latest = new Map<string, LogRow>();
    for (const row of (data || []) as LogRow[]) {
      const key = row.message_id || `${row.recipient_email}-${row.created_at}`;
      if (!latest.has(key)) latest.set(key, row);
    }
    const deduped = Array.from(latest.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    setRows(deduped);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours]);

  const stats = rows.reduce(
    (acc, r) => {
      acc.total += 1;
      const s = r.status || 'unknown';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    { total: 0 } as Record<string, number>,
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Email delivery</h1>
            <p className="text-muted-foreground">
              Live status of sign-up codes and other emails sent by the system.
            </p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        <div className="flex gap-2">
          {RANGES.map((r) => (
            <Button
              key={r.label}
              variant={hours === r.hours ? 'default' : 'outline'}
              size="sm"
              onClick={() => setHours(r.hours)}
            >
              Last {r.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Sent" value={stats.sent || 0} />
          <StatCard label="Pending" value={stats.pending || 0} />
          <StatCard label="Failed" value={(stats.failed || 0) + (stats.dlq || 0)} />
          <StatCard label="Suppressed" value={stats.suppressed || 0} />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No emails in this period.
                  </TableCell>
                </TableRow>
              ) : (
                rows.slice(0, 200).map((r) => (
                  <TableRow key={`${r.message_id}-${r.created_at}`}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(r.created_at).toLocaleString('en-GB')}
                    </TableCell>
                    <TableCell className="text-sm">{r.template_name || '-'}</TableCell>
                    <TableCell className="text-sm">{r.recipient_email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(r.status) as any}>{r.status || 'unknown'}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-md truncate">
                      {r.error_message || ''}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-md border p-4">
    <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="text-2xl font-semibold">{value}</div>
  </div>
);

export default EmailDeliveryPage;
