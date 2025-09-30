import { useState, useEffect } from "react";
import { ManagementLayout } from "@/components/management/ManagementLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Search, Pin, Clock, FileText, Star, File } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    in_review: 0,
    pinned: 0,
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
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
      
      // Fetch pinned count
      const { count: pinnedCount } = await supabase
        .from("ck_pins")
        .select("*", { count: "exact", head: true });

      setStats({
        total,
        approved,
        in_review,
        pinned: pinnedCount || 0,
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

  return (
    <ManagementLayout>
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
            <h2 className="text-xl font-brutalist font-bold">Recent Documents</h2>
          </div>
          
          {loading ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Loading documents...</p>
            </Card>
          ) : documents.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-muted">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-brutalist font-bold mb-2">No documents yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first document to start building your knowledge base
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
              {documents.map((doc) => (
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-brutalist font-bold">Pinned Documents</h2>
          </div>
          
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
        </div>
      </div>
    </ManagementLayout>
  );
}
