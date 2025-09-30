import { useState, useEffect } from "react";
import { ManagementLayout } from "@/components/management/ManagementLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

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

export default function CommonKnowledgeNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    content: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const slug = generateSlug(formData.title);

      const { data, error } = await supabase.rpc("rpc_ck_create_doc", {
        p_title: formData.title,
        p_slug: slug,
        p_type: formData.type as any,
        p_content_md: formData.content,
        p_collection_id: formData.collection_id || null,
      });

      if (error) throw error;

      toast({
        title: "Document created",
        description: "Your document has been created successfully",
      });

      navigate(`/management/common-knowledge/d/${slug}`);
    } catch (error: any) {
      console.error("Error creating document:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ManagementLayout>
      <div className="max-w-3xl space-y-6 p-3 md:p-6">
        <h1 className="text-brutalist text-2xl md:text-4xl font-black uppercase tracking-wider">CREATE DOCUMENT</h1>
        <Button
          variant="ghost"
          onClick={() => navigate("/management/common-knowledge")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Knowledge Base
        </Button>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                value={formData.collection_id}
                onValueChange={(value) => setFormData({ ...formData, collection_id: value })}
              >
                <SelectTrigger id="folder">
                  <SelectValue placeholder="Select a folder (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No folder</SelectItem>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Start writing your document content in Markdown..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Supports Markdown formatting
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/management/common-knowledge")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !formData.title || !formData.type}>
                {loading ? "Creating..." : "Create Document"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </ManagementLayout>
  );
}
