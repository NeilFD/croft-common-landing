import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { FolderPlus, Edit, Trash2, Copy } from "lucide-react";

interface FolderContextMenuProps {
  children: React.ReactNode;
  onCreateFolder: () => void;
  onRename: () => void;
  onDelete: () => void;
  onCopy: () => void;
  isRoot?: boolean;
}

export function FolderContextMenu({
  children,
  onCreateFolder,
  onRename,
  onDelete,
  onCopy,
  isRoot = false,
}: FolderContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56 bg-background text-foreground shadow-lg ring-1 ring-border">
        <ContextMenuItem onClick={onCreateFolder}>
          <FolderPlus className="mr-2 h-4 w-4" />
          New Folder
        </ContextMenuItem>
        
        {!isRoot && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onRename}>
              <Edit className="mr-2 h-4 w-4" />
              Rename
            </ContextMenuItem>
            <ContextMenuItem onClick={onCopy}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
