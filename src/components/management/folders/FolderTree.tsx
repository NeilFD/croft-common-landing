import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Collection {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  created_at: string;
}

interface FolderTreeProps {
  collections: Collection[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onContextMenu: (e: React.MouseEvent, collection: Collection | null) => void;
}

interface TreeNodeProps {
  collection: Collection | null;
  children: Collection[];
  allCollections: Collection[];
  level: number;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onContextMenu: (e: React.MouseEvent, collection: Collection | null) => void;
}

const TreeNode = ({
  collection,
  children,
  allCollections,
  level,
  selectedFolderId,
  onSelectFolder,
  onContextMenu,
}: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = children.length > 0;
  const isSelected = collection?.id === selectedFolderId;
  const isRoot = collection === null;

  const handleClick = () => {
    if (collection) {
      onSelectFolder(collection.id);
    } else {
      onSelectFolder(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, collection);
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors",
          "hover:bg-accent/50",
          isSelected && "bg-accent text-accent-foreground font-medium"
        )}
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-background/50 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}
        
        {isExpanded && hasChildren ? (
          <FolderOpen className="h-4 w-4 text-primary" />
        ) : (
          <Folder className="h-4 w-4 text-muted-foreground" />
        )}
        
        <span className="flex-1 truncate text-sm">
          {collection?.name || "All Documents"}
        </span>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {children.map((child) => {
            const grandChildren = allCollections.filter(
              (c) => c.parent_id === child.id
            );
            return (
              <TreeNode
                key={child.id}
                collection={child}
                children={grandChildren}
                allCollections={allCollections}
                level={level + 1}
                selectedFolderId={selectedFolderId}
                onSelectFolder={onSelectFolder}
                onContextMenu={onContextMenu}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export function FolderTree({
  collections,
  selectedFolderId,
  onSelectFolder,
  onContextMenu,
}: FolderTreeProps) {
  const rootCollections = collections.filter((c) => !c.parent_id);

  return (
    <div className="space-y-1">
      <TreeNode
        collection={null}
        children={rootCollections}
        allCollections={collections}
        level={0}
        selectedFolderId={selectedFolderId}
        onSelectFolder={onSelectFolder}
        onContextMenu={onContextMenu}
      />
    </div>
  );
}
