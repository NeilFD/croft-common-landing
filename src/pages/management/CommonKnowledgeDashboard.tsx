import { useState, useEffect } from "react";
import { ManagementLayout } from "@/components/management/ManagementLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Search, Pin, Clock, FileText, Star, File, FolderPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FolderTree } from "@/components/management/folders/FolderTree";
import { CreateFolderDialog } from "@/components/management/folders/CreateFolderDialog";
import { RenameFolderDialog } from "@/components/management/folders/RenameFolderDialog";
import { DeleteFolderDialog } from "@/components/management/folders/DeleteFolderDialog";

interface Collection {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  created_at: string;
}

interface Document {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  collection_id: string | null;
}

interface PinnedDocument extends Document {
  pinned_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  ethos: "Ethos",
  sop: "SOP",
  standard: "Standard",
  policy: "Policy",
  training: "Training",
  menu: "Menu",
  legal: "Legal",
  finance: "Finance",
  marketing: "Marketing",
  licence: "Licence",
  briefing: "Briefing",
};

const STATUS_COLORS = {
  draft: "bg-gray-500",
  in_review: "bg-yellow-500",
  approved: "bg-green-500",
};

export default function CommonKnowledgeDashboard() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pinnedDocuments, setPinnedDocuments] = useState<PinnedDocument[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    in_review: 0,
    pinned: 0,
  });
  
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameFolderOpen, setRenameFolderOpen] = useState(false);
  const [deleteFolderOpen, setDeleteFolderOpen] = useState(false);
  const [contextFolder, setContextFolder] = useState<Collection | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all collections
      const { data: colls, error: collsError } = await supabase
        .from("ck_collections")
        .select("*")
        .order("name");

      if (collsError) throw collsError;
      setCollections(colls || []);
      
      // Fetch all documents
      const { data: docs, error } = await supabase
        .from("ck_docs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setDocuments(docs || []);

      // Calculate stats
      const total = docs?.length || 0;
      const approved = docs?.filter(d => d.status === "approved").length || 0;
      const in_review = docs?.filter(d => d.status === "in_review").length || 0;
      
      // Fetch pinned documents with details
      const { data: pins, error: pinsError } = await supabase
        .from("ck_pins")
        .select(`
          created_at,
          ck_docs (
            id,
            title,
            slug,
            type,
            status,
            created_at,
            updated_at,
            collection_id
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (pinsError) throw pinsError;

      // Transform pinned data
      const pinnedDocs = (pins || [])
        .filter(pin => pin.ck_docs)
        .map(pin => ({
          ...(pin.ck_docs as any),
          pinned_at: pin.created_at,
        }));

      setPinnedDocuments(pinnedDocs);

      setStats({
        total,
        approved,
        in_review,
        pinned: pinnedDocs.length,
      });
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFolderContextMenu = (e: React.MouseEvent, collection: Collection | null) => {
    e.preventDefault();
    setContextFolder(collection);
    // Open appropriate dialog based on right-click action
  };

  const handleCreateFolder = () => {
    setCreateFolderOpen(true);
  };

  const handleCopyFolder = async () => {
    if (!contextFolder) return;
    
    try {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("ck_collections").insert({
        name: `${contextFolder.name} (Copy)`,
        slug: `${contextFolder.slug}-copy-${Date.now()}`,
        parent_id: contextFolder.parent_id,
        created_by: user.user?.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Folder duplicated successfully",
      });

      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to duplicate folder",
        variant: "destructive",
      });
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolderId === null ? true : doc.collection_id === selectedFolderId;
    return matchesSearch && matchesFolder;
  });

  const hasChildren = (folderId: string) => {
    return collections.some((c) => c.parent_id === folderId);
  };

  const hasDocuments = (folderId: string) => {
    return documents.some((d) => d.collection_id === folderId);
  };

  return (
    <ManagementLayout>
      <div className="flex gap-6 h-full">
        {/* Sidebar with folder tree */}
        <div className="w-64 border-r pr-6 flex flex-col shrink-0">
          <div className="flex items-center justify-between mb-4 pt-6">
            <h2 className="font-brutalist font-bold">FOLDERS</h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCreateFolder}
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <FolderTree
              collections={collections}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              onContextMenu={handleFolderContextMenu}
            />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-3 md:p-6">
            <h1 className="text-brutalist text-2xl md:text-4xl font-black uppercase tracking-wider">COMMON KNOWLEDGE</h1>
            
            {/* Header with search and new doc button */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents, SOPs, policies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link to="/management/common-knowledge/new">
                    <FileText className="h-4 w-4 mr-2" />
                    New Document
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/management/common-knowledge/upload">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload File
                  </Link>
                </Button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[hsl(var(--accent-pink))]/10">
                    <FileText className="h-5 w-5 text-[hsl(var(--accent-pink))]" />
                  </div>
                  <div>
                    <p className="text-2xl font-brutalist font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Docs</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[hsl(var(--accent-pink))]/10">
                    <Star className="h-5 w-5 text-[hsl(var(--accent-pink))]" />
                  </div>
                  <div>
                    <p className="text-2xl font-brutalist font-bold">{stats.approved}</p>
                    <p className="text-sm text-muted-foreground">Approved</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[hsl(var(--accent-pink))]/10">
                    <Clock className="h-5 w-5 text-[hsl(var(--accent-pink))]" />
                  </div>
                  <div>
                    <p className="text-2xl font-brutalist font-bold">{stats.in_review}</p>
                    <p className="text-sm text-muted-foreground">In Review</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[hsl(var(--accent-pink))]/10">
                    <Pin className="h-5 w-5 text-[hsl(var(--accent-pink))]" />
                  </div>
                  <div>
                    <p className="text-2xl font-brutalist font-bold">{stats.pinned}</p>
                    <p className="text-sm text-muted-foreground">Pinned</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent documents */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-brutalist font-bold">
                  {selectedFolderId 
                    ? collections.find(c => c.id === selectedFolderId)?.name || "Documents"
                    : "Recent Documents"}
                </h2>
              </div>
              
              {loading ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">Loading documents...</p>
                </Card>
              ) : filteredDocuments.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-muted">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-brutalist font-bold mb-2">
                        {selectedFolderId ? "No documents in this folder" : "No documents yet"}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {selectedFolderId 
                          ? "Add documents to this folder to organize your content"
                          : "Create your first document to start building your knowledge base"}
                      </p>
                      <Button asChild>
                        <Link to="/management/common-knowledge/new">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Document
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.map((doc) => (
                    <Link key={doc.id} to={`/management/common-knowledge/d/${doc.slug}`}>
                      <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-[hsl(var(--accent-pink))]/10 shrink-0">
                                <File className="h-5 w-5 text-[hsl(var(--accent-pink))]" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-brutalist font-bold text-sm truncate">{doc.title}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {TYPE_LABELS[doc.type]}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={STATUS_COLORS[doc.status as keyof typeof STATUS_COLORS]} variant="secondary">
                              {doc.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Updated {new Date(doc.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Pinned documents section */}
            {!selectedFolderId && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-brutalist font-bold">Pinned Documents</h2>
                </div>
                
                {pinnedDocuments.length === 0 ? (
                  <Card className="p-8 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-full bg-muted">
                        <Pin className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          Pin important documents for quick access
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pinnedDocuments.map((doc) => (
                      <Link key={doc.id} to={`/management/common-knowledge/d/${doc.slug}`}>
                        <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer border-[hsl(var(--accent-pink))]/20">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-[hsl(var(--accent-pink))]/10 shrink-0">
                                  <File className="h-5 w-5 text-[hsl(var(--accent-pink))]" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-brutalist font-bold text-sm truncate">{doc.title}</h3>
                                    <Pin className="h-3 w-3 text-[hsl(var(--accent-pink))] fill-current shrink-0" />
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {TYPE_LABELS[doc.type]}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={STATUS_COLORS[doc.status as keyof typeof STATUS_COLORS]} variant="secondary">
                                {doc.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Pinned {new Date(doc.pinned_at).toLocaleDateString()}
                            </p>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        parentId={contextFolder?.id || null}
        onSuccess={fetchDocuments}
      />

      {contextFolder && (
        <>
          <RenameFolderDialog
            open={renameFolderOpen}
            onOpenChange={setRenameFolderOpen}
            folderId={contextFolder.id}
            currentName={contextFolder.name}
            onSuccess={fetchDocuments}
          />

          <DeleteFolderDialog
            open={deleteFolderOpen}
            onOpenChange={setDeleteFolderOpen}
            folderId={contextFolder.id}
            folderName={contextFolder.name}
            hasChildren={hasChildren(contextFolder.id)}
            hasDocuments={hasDocuments(contextFolder.id)}
            onSuccess={fetchDocuments}
          />
        </>
      )}
    </ManagementLayout>
  );
}
