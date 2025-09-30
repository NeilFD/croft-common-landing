import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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
    } catch (err: any) {
      console.error("Error fetching file:", err);
      setError(err.message || "Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!fileUrl) return;
    
    try {
      toast({
        title: "Downloading...",
        description: "Your file download is starting",
      });

      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
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

  const handleOpenNewTab = () => {
    if (fileUrl) {
      window.open(fileUrl, "_blank");
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

  // For PDFs, use native browser rendering
  if (mimeType === "application/pdf") {
    return (
      <div className="space-y-4">
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleOpenNewTab}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
        <div className="bg-muted/20 p-2 rounded-lg">
          <object
            data={fileUrl || ""}
            type="application/pdf"
            className="w-full min-h-[800px] rounded"
          >
            <iframe
              src={fileUrl || ""}
              className="w-full min-h-[800px] rounded border-0"
              title={filename}
            />
          </object>
        </div>
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
