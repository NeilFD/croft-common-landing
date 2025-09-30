import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function FixDocument() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFix = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reextract-document', {
        body: { docSlug: 'croft-common-hospitality-300925' }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Extracted ${data.extractedLength} characters`,
      });

      console.log('Preview:', data.preview);
    } catch (error: any) {
      console.error('Fix error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fix document",
        variant: "destructive",
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
