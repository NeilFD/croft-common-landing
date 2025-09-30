import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ManagementLayout } from "@/components/management/ManagementLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Share2, Download, History, Pin, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Document {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  version_current_id: string;
}

interface Version {
  id: string;
  version_no: number;
  content_md: string;
  summary: string;
  created_at: string;
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
  const [doc, setDoc] = useState<Document | null>(null);
  const [version, setVersion] = useState<Version | null>(null);
  const [loading, setLoading] = useState(true);

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

      if (docData.version_current_id) {
        const { data: versionData, error: versionError } = await supabase
          .from("ck_doc_versions")
          .select("*")
          .eq("id", docData.version_current_id)
          .single();

        if (versionError) throw versionError;
        setVersion(versionData);
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
            <Button variant="outline" size="sm">
              <Pin className="h-4 w-4 mr-2" />
              Pin
            </Button>
            <Button variant="outline" size="sm">
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
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
            <div className="prose prose-sm max-w-none font-industrial">
              <ReactMarkdown>{version.content_md}</ReactMarkdown>
            </div>
          </div>
        </Card>
      </div>
    </ManagementLayout>
  );
}
