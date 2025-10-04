import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Copy, Reply, Edit, Trash, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageActionsDropdownProps {
  canEdit: boolean;
  canDelete: boolean;
  onCopy: () => void;
  onReply: () => void;
  onEdit?: () => void;
  onDelete: () => void;
  messageLength: number;
}

export const MessageActionsDropdown = ({
  canEdit,
  canDelete,
  onCopy,
  onReply,
  onEdit,
  onDelete,
  messageLength,
}: MessageActionsDropdownProps) => {
  // Only show three-dot button for messages longer than 20 characters
  if (messageLength < 20) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 z-10"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48 bg-white dark:bg-gray-900 border-border" align="end">
        <DropdownMenuItem onClick={onCopy}>
          <Copy className="mr-2 h-4 w-4" />
          Copy message
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onReply}>
          <Reply className="mr-2 h-4 w-4" />
          Reply
        </DropdownMenuItem>
        {canEdit && onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
