import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';

GlobalWorkerOptions.workerPort = new PdfWorker();

export default function FixDocument() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const extractFromArrayBuffer = async (arrayBuffer: ArrayBuffer) => {
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    let allText = '';
    const maxPages = Math.min(pdf.numPages, 100);
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((it: any) => it.str || '').join(' ');
      allText += pageText + '\n';
    }
    return allText.replace(/\s+/g, ' ').trim();
  };

  const handleFix = async () => {
    setLoading(true);
    try {
      // 1) Find the doc and file
      const { data: doc, error: docErr } = await supabase
        .from('ck_docs')
        .select(`id, slug, version_current_id, ck_files (storage_path, filename, mime) `)
        .eq('slug', 'croft-common-hospitality-300925')
        .maybeSingle();

      if (docErr || !doc) throw new Error(docErr?.message || 'Document not found');
      const versionId = doc.version_current_id as string;
      const storagePath = (doc.ck_files as any)?.[0]?.storage_path as string;
      if (!storagePath) throw new Error('No storage file found for this document');

      // 2) Get a signed URL and download
      const { data: signed, error: signErr } = await supabase
        .storage
        .from('common-knowledge')
        .createSignedUrl(storagePath, 60);
      if (signErr || !signed) throw new Error(signErr?.message || 'Could not create signed URL');

      const res = await fetch(signed.signedUrl);
      if (!res.ok) throw new Error(`Failed to download file (${res.status})`);
      const arrayBuffer = await res.arrayBuffer();

      // 3) Extract text client-side
      const extractedText = await extractFromArrayBuffer(arrayBuffer);
      if (!extractedText || extractedText.length < 100) {
        throw new Error('Text extraction failed or produced too little text');
      }

      // 4) Update via SECURITY DEFINER RPC
      const { error: rpcErr } = await supabase.rpc('admin_update_doc_content', {
        p_version_id: versionId,
        p_content_md: extractedText,
        p_summary: extractedText.substring(0, 500)
      });
      if (rpcErr) throw new Error(rpcErr.message);

      toast({
        title: 'Fixed',
        description: `Updated ${Math.min(extractedText.length, 99999)} characters of content`,
      });
    } catch (error: any) {
      console.error('Fix error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fix document',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Fix Document Extraction</h1>
      <Button onClick={handleFix} disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Fix "Croft Common Hospitality 300925"
      </Button>
    </div>
  );
}
