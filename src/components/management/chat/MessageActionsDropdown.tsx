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
}

export const MessageActionsDropdown = ({
  canEdit,
  canDelete,
  onCopy,
  onReply,
  onEdit,
  onDelete,
}: MessageActionsDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 md:h-8 md:w-8 p-0 opacity-70 md:opacity-0 md:group-hover:opacity-100 hover:opacity-100 transition-opacity absolute top-1 right-1 md:top-2 md:right-2 z-20"
        >
          <MoreVertical className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48 bg-white dark:bg-gray-900 border-border z-[200]" align="end">
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