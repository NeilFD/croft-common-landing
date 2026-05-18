import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Mode = "draft" | "rewrite" | "tighten" | "expand" | "seo";

interface Props {
  title: string;
  currentBody: string;
  onInsert: (html: string) => void;
  onSeo?: (seo: { seo_title?: string; seo_description?: string; excerpt?: string }) => void;
}

const lengthUnit = ["words", "minutes"] as const;

export const AiAssistPanel = ({ title, currentBody, onInsert, onSeo }: Props) => {
  const [brief, setBrief] = useState("");
  const [unit, setUnit] = useState<(typeof lengthUnit)[number]>("minutes");
  const [length, setLength] = useState<number>(4);
  const [model, setModel] = useState("google/gemini-2.5-flash");
  const [busy, setBusy] = useState<Mode | null>(null);

  const run = async (mode: Mode) => {
    setBusy(mode);
    try {
      const inputText =
        mode === "draft"
          ? brief.trim()
          : (currentBody.replace(/<[^>]+>/g, " ").trim() || brief.trim());
      if (!inputText) {
        toast({ title: mode === "draft" ? "Add a brief first" : "Editor is empty", variant: "destructive" });
        return;
      }
      const body: Record<string, unknown> = { mode, input: inputText, title, model };
      if (mode === "draft" || mode === "expand") {
        if (unit === "words") body.targetWords = length;
        else body.targetMinutes = length;
      }
      const { data, error } = await supabase.functions.invoke("cb-journal-ai-write", { body });
      if (error) {
        let detail = error.message;
        try {
          const ctxResp = (error as any)?.context;
          if (ctxResp && typeof ctxResp.json === "function") {
            const parsed = await ctxResp.json();
            detail = parsed?.error || parsed?.detail || detail;
          }
        } catch {}
        throw new Error(detail);
      }
      if (mode === "seo") {
        onSeo?.({
          seo_title: data?.seo_title,
          seo_description: data?.seo_description,
          excerpt: data?.excerpt,
        });
        toast({ title: "SEO suggestions applied" });
      } else {
        onInsert(data?.content ?? "");
        toast({ title: `Inserted ${data?.words ?? "?"} words` });
      }
    } catch (e: any) {
      toast({
        title: "AI failed",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4 rounded-md border p-4 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide">Write with AI</h3>
        <span className="text-[10px] text-muted-foreground">Bear's Den voice · British English · no em dashes</span>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Brief / angle / notes</Label>
        <Textarea
          rows={4}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="What is the post about? Key points, the angle, anything that must be in or out."
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Length</Label>
          <Input
            type="number"
            min={1}
            value={length}
            onChange={(e) => setLength(Math.max(1, Number(e.target.value) || 1))}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Unit</Label>
          <Select value={unit} onValueChange={(v) => setUnit(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minutes">minutes</SelectItem>
              <SelectItem value="words">words</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google/gemini-2.5-flash">Flash (fast)</SelectItem>
              <SelectItem value="google/gemini-2.5-pro">Pro (deeper)</SelectItem>
              <SelectItem value="openai/gpt-5">GPT-5 (premium)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button size="sm" onClick={() => run("draft")} disabled={busy !== null}>
          {busy === "draft" ? "Writing…" : "Generate draft"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => run("rewrite")} disabled={busy !== null}>
          {busy === "rewrite" ? "…" : "Rewrite in voice"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => run("tighten")} disabled={busy !== null}>
          {busy === "tighten" ? "…" : "Tighten"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => run("expand")} disabled={busy !== null}>
          {busy === "expand" ? "…" : "Expand"}
        </Button>
        {onSeo && (
          <Button size="sm" variant="outline" onClick={() => run("seo")} disabled={busy !== null}>
            {busy === "seo" ? "…" : "Suggest SEO"}
          </Button>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        AI output is inserted as a draft into the editor. You decide what to keep. Nothing publishes automatically.
      </p>
    </div>
  );
};

export default AiAssistPanel;
