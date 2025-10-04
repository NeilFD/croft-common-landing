import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Copy, Reply, Edit, Trash } from 'lucide-react';

interface MessageActionsMenuProps {
  children: React.ReactNode;
  canEdit: boolean;
  canDelete: boolean;
  onCopy: () => void;
  onReply: () => void;
  onEdit?: () => void;
  onDelete: () => void;
}

export const MessageActionsMenu = ({
  children,
  canEdit,
  canDelete,
  onCopy,
  onReply,
  onEdit,
  onDelete,
}: MessageActionsMenuProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48 bg-white dark:bg-gray-900 border-border z-[200]">
        <ContextMenuItem onClick={onCopy}>
          <Copy className="mr-2 h-4 w-4" />
          Copy message
        </ContextMenuItem>
        <ContextMenuItem onClick={onReply}>
          <Reply className="mr-2 h-4 w-4" />
          Reply
        </ContextMenuItem>
        {canEdit && onEdit && (
          <ContextMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </ContextMenuItem>
        )}
        {canDelete && (
          <ContextMenuItem onClick={onDelete} className="text-destructive">
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};
