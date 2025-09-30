import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Folder } from "lucide-react";

interface Collection {
  id: string;
  name: string;
  parent_id: string | null;
}

interface MoveFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
  currentFolderId: string | null;
  collections: Collection[];
  onSuccess: () => void;
}

export function MoveFolderDialog({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  currentFolderId,
  collections,
  onSuccess,
}: MoveFolderDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleMove = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("ck_docs")
        .update({
          collection_id: selectedFolderId,
        })
        .eq("id", documentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: selectedFolderId 
          ? `Document moved to ${collections.find(c => c.id === selectedFolderId)?.name}`
          : "Document moved to root",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to move document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Build folder tree for display
  const renderFolderOptions = () => {
    const rootFolders = collections.filter(c => !c.parent_id);
    
    const renderFolder = (folder: Collection, level: number = 0): JSX.Element[] => {
      const children = collections.filter(c => c.parent_id === folder.id);
      const indent = "  ".repeat(level);
      
      return [
        <SelectItem key={folder.id} value={folder.id}>
          {indent}📁 {folder.name}
        </SelectItem>,
        ...children.flatMap(child => renderFolder(child, level + 1))
      ];
    };

    return rootFolders.flatMap(folder => renderFolder(folder));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move Document</DialogTitle>
          <DialogDescription>
            Move "{documentTitle}" to a different folder
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Destination Folder</label>
            <Select
              value={selectedFolderId || "root"}
              onValueChange={(value) => setSelectedFolderId(value === "root" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    All Documents (Root)
                  </div>
                </SelectItem>
                {renderFolderOptions()}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={loading}>
            {loading ? "Moving..." : "Move Document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
