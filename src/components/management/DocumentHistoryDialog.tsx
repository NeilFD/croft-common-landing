import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";

interface DocumentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docId: string;
}

export function DocumentHistoryDialog({
  open,
  onOpenChange,
  docId,
}: DocumentHistoryDialogProps) {
  const { data: versions, isLoading } = useQuery({
    queryKey: ["doc-versions", docId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ck_doc_versions")
        .select(`
          *,
          editor:profiles(first_name, last_name)
        `)
        .eq("doc_id", docId)
        .order("version_no", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Document History</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading history...</p>
          ) : versions && versions.length > 0 ? (
            <div className="space-y-4">
              {versions.map((version: any) => (
                <div
                  key={version.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Version {version.version_no}</Badge>
                      {version.version_no === versions[0].version_no && (
                        <Badge>Current</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(version.created_at).toLocaleString()}
                    </div>
                  </div>
                  {version.editor && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span>
                        {version.editor.first_name} {version.editor.last_name}
                      </span>
                    </div>
                  )}
                  {version.summary && (
                    <p className="text-sm text-muted-foreground">{version.summary}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No version history available</p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
