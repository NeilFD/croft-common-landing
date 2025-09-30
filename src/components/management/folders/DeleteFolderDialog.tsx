import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeleteFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  folderName: string;
  hasChildren: boolean;
  hasDocuments: boolean;
  onSuccess: () => void;
}

export function DeleteFolderDialog({
  open,
  onOpenChange,
  folderId,
  folderName,
  hasChildren,
  hasDocuments,
  onSuccess,
}: DeleteFolderDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (hasChildren || hasDocuments) {
      toast({
        title: "Cannot Delete",
        description: "Folder must be empty before deleting. Move or delete contents first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("ck_collections")
        .delete()
        .eq("id", folderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Folder deleted successfully",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete folder",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Folder</AlertDialogTitle>
          <AlertDialogDescription>
            {hasChildren || hasDocuments ? (
              <span>
                Cannot delete <strong>{folderName}</strong> because it contains{" "}
                {hasChildren && "subfolders"}
                {hasChildren && hasDocuments && " and "}
                {hasDocuments && "documents"}. Please empty the folder first.
              </span>
            ) : (
              <span>
                Are you sure you want to delete <strong>{folderName}</strong>?
                This action cannot be undone.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {!hasChildren && !hasDocuments && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Folder"}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
