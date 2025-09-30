import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ManagementLayout } from "@/components/management/ManagementLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Share2, Download, History, Pin, Clock } from "lucide-react";
import { DocumentViewer } from "@/components/management/DocumentViewer";
import { DocumentHistoryDialog } from "@/components/management/DocumentHistoryDialog";
import { DocumentShareDialog } from "@/components/management/DocumentShareDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Document {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  version_current_id: string;
  description?: string;
}

interface Version {
  id: string;
  version_no: number;
  content_md: string;
  summary: string;
  created_at: string;
}

interface FileData {
  id: string;
  filename: string;
  storage_path: string;
  mime: string;
  size: number;
}

const STATUS_COLORS = {
  draft: "bg-gray-500",
  in_review: "bg-yellow-500",
  approved: "bg-green-500",
};

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

export default function CommonKnowledgeView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [doc, setDoc] = useState<Document | null>(null);
  const [version, setVersion] = useState<Version | null>(null);
  const [file, setFile] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchDocument();
    }
  }, [slug]);

  const fetchDocument = async () => {
    try {
      setLoading(true);

      const { data: docData, error: docError } = await supabase
        .from("ck_docs")
        .select("*")
        .eq("slug", slug)
        .single();

      if (docError) throw docError;
      setDoc(docData);

      // Check if document is pinned
      const { data: pinData } = await supabase
        .from("ck_pins")
        .select("id")
        .eq("doc_id", docData.id)
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();
      
      setIsPinned(!!pinData);

      // Fetch version if exists
      if (docData.version_current_id) {
        const { data: versionData, error: versionError } = await supabase
          .from("ck_doc_versions")
          .select("*")
          .eq("id", docData.version_current_id)
          .single();

        if (versionError) throw versionError;
        setVersion(versionData);
      }

      // Fetch file if exists
      const { data: fileData, error: fileError } = await supabase
        .from("ck_files")
        .select("*")
        .eq("doc_id", docData.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!fileError && fileData) {
        setFile(fileData);
      }
    } catch (error: any) {
      console.error("Error fetching document:", error);
      toast({
        title: "Error",
        description: "Failed to load document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePin = useMutation({
    mutationFn: async () => {
      const user = await supabase.auth.getUser();
      if (!user.data.user || !doc) return;

      if (isPinned) {
        const { error } = await supabase
          .from("ck_pins")
          .delete()
          .eq("doc_id", doc.id)
          .eq("user_id", user.data.user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ck_pins")
          .insert({ doc_id: doc.id, user_id: user.data.user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setIsPinned(!isPinned);
      toast({
        title: isPinned ? "Unpinned" : "Pinned",
        description: isPinned ? "Document unpinned" : "Document pinned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["pinned-docs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update pin status",
        variant: "destructive",
      });
    },
  });

  const handleExport = async () => {
    if (!file) {
      toast({
        title: "No file",
        description: "No file available to export",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from("common-knowledge")
        .createSignedUrl(file.storage_path, 60);

      if (error) throw error;
      if (!data?.signedUrl) throw new Error("Failed to get download URL");

      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = file.filename;
      link.click();

      toast({
        title: "Export started",
        description: "Document download started",
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export document",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <ManagementLayout>
        <div className="flex items-center justify-center min-h-[400px] p-3 md:p-6">
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </ManagementLayout>
    );
  }

  if (!doc || !version) {
    return (
      <ManagementLayout>
        <div className="p-3 md:p-6">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Document not found</p>
            <Button onClick={() => navigate("/management/common-knowledge")}>
              Back to Knowledge Base
            </Button>
          </Card>
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout>
      <div className="space-y-6 p-3 md:p-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/management/common-knowledge")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => togglePin.mutate()}
              disabled={togglePin.isPending}
            >
              <Pin className={`h-4 w-4 mr-2 ${isPinned ? 'fill-current' : ''}`} />
              {isPinned ? "Unpin" : "Pin"}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setHistoryOpen(true)}
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              size="sm"
              onClick={() => navigate(`/management/common-knowledge/edit/${doc.slug}`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        <Card className="p-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-4 border-b pb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <h1 className="text-3xl font-brutalist font-bold">{doc.title}</h1>
                  {doc.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                      {doc.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={STATUS_COLORS[doc.status as keyof typeof STATUS_COLORS]}>
                      {doc.status.replace("_", " ")}
                    </Badge>
                    <Badge variant="outline">{TYPE_LABELS[doc.type]}</Badge>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      Version {version.version_no}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-6 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Created:</span>{" "}
                  {new Date(doc.created_at).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Last updated:</span>{" "}
                  {new Date(doc.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Content */}
            {file ? (
              <DocumentViewer
                fileId={file.id}
                storagePath={file.storage_path}
                filename={file.filename}
                mimeType={file.mime}
              />
            ) : version ? (
              <div className="prose prose-sm max-w-none font-industrial bg-muted/20 p-6 rounded-lg">
                <p className="text-muted-foreground">
                  This document has metadata but no file attached. Content preview is not available.
                </p>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none font-industrial bg-muted/20 p-6 rounded-lg">
                <p className="text-muted-foreground">No content available for this document.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <DocumentHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        docId={doc.id}
      />

      <DocumentShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        docSlug={doc.slug}
      />
    </ManagementLayout>
  );
}
