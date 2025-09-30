import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { supabase } from "@/integrations/supabase/client";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAndDisplayFile();
  }, [fileId, storagePath]);

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

      // Handle PDF rendering
      if (mimeType === "application/pdf") {
        await renderPDF(urlData.signedUrl);
      }
    } catch (err: any) {
      console.error("Error fetching file:", err);
      setError(err.message || "Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const renderPDF = async (url: string) => {
    if (!containerRef.current) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      containerRef.current.innerHTML = "";

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.className = "mx-auto mb-4 shadow-lg";

        containerRef.current.appendChild(canvas);

        await page.render({
          canvasContext: context,
          viewport: viewport,
        } as any).promise;
      }
    } catch (err: any) {
      console.error("Error rendering PDF:", err);
      setError("Failed to render PDF");
    }
  };

  const handleDownload = () => {
    if (fileUrl) {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = filename;
      link.click();
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

  // For PDFs, show the rendered canvas elements
  if (mimeType === "application/pdf") {
    return (
      <div className="space-y-4">
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
        <div ref={containerRef} className="bg-muted/20 p-6 rounded-lg" />
      </div>
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
          <ExternalLink className="h-16 w-16 mx-auto text-muted-foreground" />
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
