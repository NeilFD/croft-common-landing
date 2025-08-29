import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Bug, Trash2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DebugLog {
  id: string;
  step: string;
  data: any;
  error_message?: string;
  created_at: string;
}

interface MobileDebugPanelProps {
  sessionId: string;
}

export function MobileDebugPanel({ sessionId }: MobileDebugPanelProps) {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('mobile_debug_logs')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Failed to fetch debug logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = async () => {
    try {
      await supabase
        .from('mobile_debug_logs')
        .delete()
        .eq('session_id', sessionId);
      setLogs([]);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  const exportLogs = () => {
    const logText = logs.map(log => 
      `[${log.created_at}] ${log.step}\n${log.data ? JSON.stringify(log.data, null, 2) : ''}\n${log.error_message ? `ERROR: ${log.error_message}` : ''}\n---\n`
    ).join('');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${sessionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, sessionId]);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('debug-logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mobile_debug_logs',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          setLogs(current => [payload.new as DebugLog, ...current]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getLogStyle = (log: DebugLog) => {
    if (log.error_message) return 'border-destructive bg-destructive/10';
    if (log.step.includes('✅') || log.step.includes('Success')) return 'border-success bg-success/10';
    if (log.step.includes('⚠️') || log.step.includes('Warning')) return 'border-warning bg-warning/10';
    return 'border-muted';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="mb-2 bg-background/95 backdrop-blur-sm"
          >
            <Bug className="w-4 h-4 mr-2" />
            Debug Panel
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="bg-background/95 backdrop-blur-sm border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                Debug Logs ({logs.length})
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={exportLogs}
                    disabled={logs.length === 0}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearLogs}
                    disabled={logs.length === 0}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <ScrollArea className="h-64">
                {isLoading ? (
                  <div className="text-center py-4 text-muted-foreground">Loading...</div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No debug logs yet</div>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log) => (
                      <div key={log.id} className={`p-2 rounded border text-xs ${getLogStyle(log)}`}>
                        <div className="font-medium flex items-center justify-between">
                          <span className="truncate">{log.step}</span>
                          <span className="text-muted-foreground ml-2 text-[10px]">
                            {formatTime(log.created_at)}
                          </span>
                        </div>
                        {log.data && (
                          <details className="mt-1">
                            <summary className="cursor-pointer text-muted-foreground">Data</summary>
                            <pre className="mt-1 text-[10px] overflow-x-auto bg-muted/50 p-1 rounded">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </details>
                        )}
                        {log.error_message && (
                          <div className="mt-1 text-destructive font-medium">
                            Error: {log.error_message}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}