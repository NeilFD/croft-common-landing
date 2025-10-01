import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Eye, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker";

GlobalWorkerOptions.workerPort = new PdfWorker();

interface DocumentViewerProps {
  fileId: string;
  storagePath: string;
  filename: string;
  mimeType: string;
}

export function DocumentViewer({ fileId, storagePath, filename, mimeType }: DocumentViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAndDisplayFile();
  }, [fileId, storagePath]);

  // Render PDF pages into canvases inside the modal to avoid Chrome plugin blocking
  useEffect(() => {
    if (!previewOpen || mimeType !== "application/pdf" || !fileUrl) return;
    let cancelled = false;

    const renderPreview = async () => {
      try {
        setPreviewLoading(true);
        const { data, error } = await supabase.storage
          .from("common-knowledge")
          .download(storagePath);
        if (error || !data) throw error || new Error("Failed to download file for preview");
        const buffer = await data.arrayBuffer();
        const pdf = await getDocument({ data: buffer }).promise;
        console.info("PDF preview: loaded", { pages: pdf.numPages, filename });
        let container = previewContainerRef.current;
        if (!container) {
          console.warn("PDF preview: container not ready, waiting a frame");
          await new Promise((r) => requestAnimationFrame(() => r(null)));
          container = previewContainerRef.current;
        }
        if (!container) {
          console.error("PDF preview: container still missing, aborting render");
          return;
        }
        container.innerHTML = "";

          for (let pageNum = 1; pageNum <= pdf.numPages && !cancelled; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const cssScale = 1.25;
            const outputScale = window.devicePixelRatio || 1;
            const viewport = page.getViewport({ scale: cssScale * outputScale });
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) continue;
            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            canvas.style.width = `${Math.floor(viewport.width / outputScale)}px`;
            canvas.style.height = `${Math.floor(viewport.height / outputScale)}px`;
            canvas.className = "mx-auto mb-4 shadow";
            container.appendChild(canvas);
            await page.render({ canvasContext: ctx, viewport } as any).promise;
            console.info("PDF preview: rendered page", pageNum);
          }

          if (container && container.childElementCount === 0) {
            console.warn("PDF preview: no pages rendered, using iframe fallback");
            const blobUrl = URL.createObjectURL(new Blob([buffer], { type: "application/pdf" }));
            const iframe = document.createElement("iframe");
            iframe.src = blobUrl;
            iframe.className = "w-full h-full rounded border";
            iframe.style.height = "100%";
            container.appendChild(iframe);
          }
        } catch (e) {
        console.error("PDF render error", e);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };

    renderPreview();

    return () => {
      cancelled = true;
      const container = previewContainerRef.current;
      if (container) container.innerHTML = "";
    };
  }, [previewOpen, fileUrl, mimeType]);

  const fetchAndDisplayFile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get signed URL from storage
      const { data: urlData, error: urlError } = await supabase.storage
        .from("common-knowledge")
        .createSignedUrl(storagePath, 3600);

      if (urlError) throw urlError;
      if (!urlData?.signedUrl) throw new Error("Failed to get file URL");

      setFileUrl(urlData.signedUrl);
    } catch (err: any) {
      console.error("Error fetching file:", err);
      setError(err.message || "Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      toast({
        title: "Downloading...",
        description: "Your file download is starting",
      });

      const { data, error } = await supabase.storage
        .from("common-knowledge")
        .download(storagePath);
      if (error || !data) throw error || new Error("Failed to download file");

      const blobUrl = URL.createObjectURL(data);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

      toast({
        title: "Download complete",
        description: "Your file has been downloaded",
      });
    } catch (err: any) {
      console.error("Download error:", err);
      toast({
        title: "Download failed",
        description: err.message || "Failed to download file",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchAndDisplayFile}>Retry</Button>
      </div>
    );
  }

  // For PDFs, show action buttons
  if (mimeType === "application/pdf") {
    return (
      <>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 p-4 sm:p-8 bg-muted/20 rounded-lg">
          <Button variant="outline" onClick={() => setPreviewOpen(true)} size="sm" className="w-full sm:w-auto">
            <Eye className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Preview PDF</span>
          </Button>
          <Button variant="outline" onClick={handleDownload} size="sm" className="w-full sm:w-auto">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Download PDF</span>
          </Button>
        </div>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-3 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-sm sm:text-base break-words pr-8">{filename}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden relative">
              <div
                ref={previewContainerRef}
                className="w-full h-full overflow-auto bg-muted/20 p-2 sm:p-4 rounded"
              />
              {previewLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <p className="text-muted-foreground">Preparing preview…</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // For Word docs and other files, provide download option
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 bg-muted/20 rounded-lg">
        <div className="text-center space-y-4">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
          <div>
            <h3 className="font-semibold text-lg mb-2">Word Document</h3>
            <p className="text-muted-foreground mb-4">
              Preview is not available for Word documents. Download to view.
            </p>
          </div>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download {filename}
          </Button>
        </div>
      </div>
    );
  }

  // For text files, display inline
  if (mimeType === "text/plain" || mimeType === "text/markdown") {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
        <iframe
          src={fileUrl || ""}
          className="w-full min-h-[600px] rounded-lg border"
          title={filename}
        />
      </div>
    );
  }

  // Fallback for other file types
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <p className="text-muted-foreground">Preview not available for this file type</p>
      <Button onClick={handleDownload}>
        <Download className="h-4 w-4 mr-2" />
        Download {filename}
      </Button>
    </div>
  );
}
