import { useState, useEffect } from "react";
import { ManagementLayout } from "@/components/management/ManagementLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, FileText, File } from "lucide-react";
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';

// Configure pdfjs worker
GlobalWorkerOptions.workerPort = new PdfWorker();

interface Collection {
  id: string;
  name: string;
  parent_id: string | null;
}

const DOC_TYPES = [
  { value: "ethos", label: "Ethos" },
  { value: "sop", label: "Standard Operating Procedure" },
  { value: "standard", label: "Service Standard" },
  { value: "policy", label: "Policy" },
  { value: "training", label: "Training Material" },
  { value: "menu", label: "Menu" },
  { value: "legal", label: "Legal Document" },
  { value: "finance", label: "Finance Document" },
  { value: "marketing", label: "Marketing Material" },
  { value: "licence", label: "Licence" },
  { value: "briefing", label: "Briefing" },
];

export default function CommonKnowledgeUpload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    description: "",
    collection_id: "",
  });

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from("ck_collections")
        .select("*")
        .order("name");

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error("Error fetching collections:", error);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const extractPdfText = async (file: File): Promise<string> => {
    try {
      console.log('Starting PDF extraction...');
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      
      console.log(`PDF loaded: ${pdf.numPages} pages`);
      let allText = '';
      const maxPages = Math.min(pdf.numPages, 100);
      
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        allText += pageText + '\n';
      }
      
      const extracted = allText.replace(/\s+/g, ' ').trim();
      console.log(`Extracted ${extracted.length} characters`);
      return extracted;
    } catch (error) {
      console.error('PDF extraction error:', error);
      toast({
        title: "PDF extraction failed",
        description: "Document uploaded but text extraction failed",
        variant: "destructive",
      });
      return '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Auto-fill title from filename if not already set
      if (!formData.title) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
        setFormData({ ...formData, title: nameWithoutExt });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const slug = generateSlug(formData.title);

      // Get current user for ownership
      const { data: authData } = await supabase.auth.getUser();
      const ownerId = authData?.user?.id || null;

      // Create document first
      const { data: docData, error: docError } = await supabase
        .from('ck_docs')
        .insert({
          title: formData.title,
          slug: slug,
          type: formData.type as any,
          description: formData.description || null,
          status: 'draft',
          owner_id: ownerId,
          collection_id: formData.collection_id || null,
        })
        .select('id')
        .single();

      if (docError) throw docError;
      const docId = docData.id;

      // Create initial version and set as current
      const { data: versionData, error: versionError } = await supabase
        .from('ck_doc_versions')
        .insert({
          doc_id: docId,
          version_no: 1,
          content_md: `Uploaded file: ${file.name}`,
          summary: formData.description || `Document: ${formData.title}`,
        })
        .select('id')
        .single();

      if (versionError) throw versionError;

      // Update document with current version id
      const { error: updateDocError } = await supabase
        .from('ck_docs')
        .update({ version_current_id: versionData.id })
        .eq('id', docId);

      if (updateDocError) throw updateDocError;

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `doc/${docId}/v1/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('common-knowledge')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Create file record
      const { error: fileError } = await supabase
        .from('ck_files')
        .insert({
          doc_id: docId,
          version_id: versionData.id,
          storage_path: filePath,
          filename: file.name,
          mime: file.type,
          size: file.size,
        });

      if (fileError) throw fileError;

      // Extract content client-side for PDFs
      if (file.type === 'application/pdf') {
        try {
          const extractedText = await extractPdfText(file);
          
          if (extractedText.length > 100) {
            // Update version with extracted content
            const { error: updateError } = await supabase.functions.invoke('update-document-content', {
              body: {
                versionId: versionData.id,
                contentMd: extractedText,
                summary: extractedText.substring(0, 500),
              }
            });

            if (updateError) {
              console.warn('Failed to update extracted content:', updateError);
            }
          }
        } catch (extractError) {
          console.warn('PDF extraction error:', extractError);
        }
      }

      toast({
        title: "File uploaded",
        description: "Your document has been uploaded successfully",
      });

      navigate(`/management/common-knowledge/d/${slug}`);
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ManagementLayout>
      <div className="max-w-3xl space-y-6 p-3 md:p-6">
        <h1 className="text-brutalist text-2xl md:text-4xl font-black uppercase tracking-wider">UPLOAD DOCUMENT</h1>
        
        <Button
          variant="ghost"
          onClick={() => navigate("/management/common-knowledge")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Knowledge Base
        </Button>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File upload */}
            <div className="space-y-2">
              <Label htmlFor="file">File *</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-[hsl(var(--accent-pink))] transition-colors">
                <input
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.md"
                  className="hidden"
                  required
                />
                <label htmlFor="file" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-[hsl(var(--accent-pink))]/10">
                      {file ? (
                        <File className="h-8 w-8 text-[hsl(var(--accent-pink))]" />
                      ) : (
                        <Upload className="h-8 w-8 text-[hsl(var(--accent-pink))]" />
                      )}
                    </div>
                    <div>
                      {file ? (
                        <>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium">Click to upload or drag and drop</p>
                          <p className="text-sm text-muted-foreground">
                            PDF, DOC, DOCX, TXT, MD (max 50MB)
                          </p>
                        </>
                      )}
                    </div>
                    {file && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setFile(null);
                        }}
                      >
                        Remove file
                      </Button>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Document Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Opening Procedures"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Document Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                required
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="folder">Folder</Label>
              <Select
                value={formData.collection_id || undefined}
                onValueChange={(value) => setFormData({ ...formData, collection_id: value })}
              >
                <SelectTrigger id="folder">
                  <SelectValue placeholder="No folder (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the document (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/management/common-knowledge")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !file || !formData.title || !formData.type}>
                {loading ? "Uploading..." : "Upload Document"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </ManagementLayout>
  );
}
