import { ChevronRight, ChevronDown, Folder, FolderOpen, Home } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { FolderContextMenu } from "./FolderContextMenu";

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
  onCreateFolder: (parentId: string | null) => void;
  onRename: (collection: Collection) => void;
  onDelete: (collection: Collection) => void;
  onCopy: (collection: Collection) => void;
}

interface TreeNodeProps {
  collection: Collection | null;
  children: Collection[];
  allCollections: Collection[];
  level: number;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRename: (collection: Collection) => void;
  onDelete: (collection: Collection) => void;
  onCopy: (collection: Collection) => void;
}

const TreeNode = ({
  collection,
  children,
  allCollections,
  level,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRename,
  onDelete,
  onCopy,
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

  return (
    <div>
      <FolderContextMenu
        onCreateFolder={() => onCreateFolder(collection?.id || null)}
        onRename={() => collection && onRename(collection)}
        onDelete={() => collection && onDelete(collection)}
        onCopy={() => collection && onCopy(collection)}
        isRoot={isRoot}
      >
        <div
          className={cn(
            "flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors",
            "hover:bg-accent/50",
            isSelected && "bg-accent text-accent-foreground font-medium"
          )}
          style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
          onClick={handleClick}
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
          
          {isRoot ? (
            <Home className="h-4 w-4 text-primary" />
          ) : isExpanded && hasChildren ? (
            <FolderOpen className="h-4 w-4 text-primary" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground" />
          )}
          
          <span className="flex-1 truncate text-sm">
            {collection?.name || "Home"}
          </span>
        </div>
      </FolderContextMenu>

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
                onCreateFolder={onCreateFolder}
                onRename={onRename}
                onDelete={onDelete}
                onCopy={onCopy}
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
  onCreateFolder,
  onRename,
  onDelete,
  onCopy,
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
        onCreateFolder={onCreateFolder}
        onRename={onRename}
        onDelete={onDelete}
        onCopy={onCopy}
      />
    </div>
  );
}
