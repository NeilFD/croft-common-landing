import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ManagementLayout } from "@/components/management/ManagementLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Share2, Download, History, Pin, Clock, FolderInput } from "lucide-react";
import { DocumentViewer } from "@/components/management/DocumentViewer";
import { DocumentHistoryDialog } from "@/components/management/DocumentHistoryDialog";
import { DocumentShareDialog } from "@/components/management/DocumentShareDialog";
import { DocumentEditDialog } from "@/components/management/DocumentEditDialog";
import { MoveFolderDialog } from "@/components/management/folders/MoveFolderDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';

GlobalWorkerOptions.workerPort = new PdfWorker();

interface Collection {
  id: string;
  name: string;
  parent_id: string | null;
}

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
  collection_id?: string | null;
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
  const [collections, setCollections] = useState<Collection[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchDocument();
    }
  }, [slug]);

  const fetchDocument = async () => {
    try {
      setLoading(true);

      // Fetch collections
      const { data: colls } = await supabase
        .from("ck_collections")
        .select("*")
        .order("name");
      setCollections(colls || []);

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

      // Prepare holder for current version
      let currentVersion: Version | null = null;

      // Fetch version if exists
      if (docData.version_current_id) {
        const { data: versionData, error: versionError } = await supabase
          .from("ck_doc_versions")
          .select("*")
          .eq("id", docData.version_current_id)
          .single();

        if (versionError) throw versionError;
        currentVersion = versionData as Version;
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

        // Auto-repair: if version content looks corrupt or too short, extract from PDF and update
        if (currentVersion && (
          !currentVersion.content_md ||
          currentVersion.content_md.length < 200 ||
          /^%PDF/.test(currentVersion.content_md) ||
          /\x00/.test(currentVersion.content_md)
        )) {
          try {
            const { data: signed, error: signErr } = await supabase
              .storage
              .from('common-knowledge')
              .createSignedUrl(fileData.storage_path, 60);
            if (signErr || !signed?.signedUrl) throw new Error(signErr?.message || 'Failed to sign URL');

            const res = await fetch(signed.signedUrl);
            if (!res.ok) throw new Error(`Download failed (${res.status})`);
            const arrayBuffer = await res.arrayBuffer();

            const pdf = await getDocument({ data: arrayBuffer }).promise;
            let allText = '';
            const maxPages = Math.min(pdf.numPages, 100);
            for (let p = 1; p <= maxPages; p++) {
              const page = await pdf.getPage(p);
              const textContent = await page.getTextContent();
              allText += textContent.items.map((it: any) => it.str || '').join(' ') + '\n';
            }
            const extracted = allText.replace(/\s+/g, ' ').trim();

            if (extracted && extracted.length > 100) {
              const { error: rpcErr } = await supabase.rpc('admin_update_doc_content', {
                p_version_id: currentVersion.id,
                p_content_md: extracted,
                p_summary: extracted.substring(0, 500)
              });
              if (rpcErr) throw rpcErr;
              setVersion({ ...currentVersion, content_md: extracted, summary: extracted.substring(0, 500) });
              toast({ title: 'Document repaired', description: 'Extracted text has been indexed for search' });
            }
          } catch (repairErr: any) {
            console.warn('Auto-repair failed:', repairErr?.message || repairErr);
          }
        }
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
      toast({
        title: "Downloading...",
        description: "Your file download is starting",
      });

      const { data, error } = await supabase.storage
        .from("common-knowledge")
        .createSignedUrl(file.storage_path, 60);

      if (error) throw error;
      if (!data?.signedUrl) throw new Error("Failed to get download URL");

      const response = await fetch(data.signedUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

      toast({
        title: "Download complete",
        description: "Your file has been downloaded",
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

  if (!doc) {
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
      <div className="space-y-4 md:space-y-6 p-3 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/management/common-knowledge")}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-2 overflow-x-auto pb-2 w-full sm:w-auto no-scrollbar">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => togglePin.mutate()}
              disabled={togglePin.isPending}
              className="shrink-0"
            >
              <Pin className={`h-4 w-4 ${isPinned ? 'fill-current mr-2' : 'sm:mr-2'}`} />
              <span className="hidden sm:inline">{isPinned ? "Unpin" : "Pin"}</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setMoveOpen(true)}
              className="shrink-0"
            >
              <FolderInput className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Move</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setHistoryOpen(true)}
              className="shrink-0"
            >
              <History className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">History</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShareOpen(true)}
              className="shrink-0"
            >
              <Share2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExport}
              className="shrink-0"
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button 
              size="sm"
              onClick={() => setEditOpen(true)}
              className="shrink-0"
            >
              <Edit className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </div>
        </div>

        <Card className="p-4 md:p-6 lg:p-8">
          <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="space-y-3 md:space-y-4 border-b pb-4 md:pb-6">
              <div className="flex flex-col gap-3">
                <div className="space-y-2">
                  <div className="flex items-start gap-2 md:gap-3 flex-wrap">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-brutalist font-bold break-words flex-1 min-w-0">{doc.title}</h1>
                    {isPinned && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-[hsl(var(--accent-pink))]/10 text-[hsl(var(--accent-pink))] text-xs font-bold uppercase rounded shrink-0">
                        <Pin className="h-3 w-3 fill-current" />
                        <span className="hidden sm:inline">Pinned</span>
                      </div>
                    )}
                  </div>
                  {doc.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {doc.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={STATUS_COLORS[doc.status as keyof typeof STATUS_COLORS]}>
                      {doc.status.replace("_", " ")}
                    </Badge>
                    <Badge variant="outline">{TYPE_LABELS[doc.type]}</Badge>
                    {version && (
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        Version {version.version_no}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 md:gap-6 text-xs sm:text-sm text-muted-foreground">
                <div className="whitespace-nowrap">
                  <span className="font-medium">Created:</span>{" "}
                  {new Date(doc.created_at).toLocaleDateString()}
                </div>
                <div className="whitespace-nowrap">
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
            ) : (
              <div className="prose prose-sm max-w-none font-industrial bg-muted/20 p-6 rounded-lg">
                <p className="text-muted-foreground">
                  {version 
                    ? "This document has metadata but no file attached. Content preview is not available."
                    : "No content available for this document yet. Upload a file or add content to get started."
                  }
                </p>
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

      <DocumentEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        document={doc}
        onUpdate={fetchDocument}
      />

      <MoveFolderDialog
        open={moveOpen}
        onOpenChange={setMoveOpen}
        documentId={doc.id}
        documentTitle={doc.title}
        currentFolderId={doc.collection_id || null}
        collections={collections}
        onSuccess={fetchDocument}
      />
    </ManagementLayout>
  );
}
