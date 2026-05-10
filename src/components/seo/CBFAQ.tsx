import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useEditMode } from "@/contexts/EditModeContext";
import { useCMSFaqs, type CMSFaqDisplay } from "@/hooks/useCMSFaqs";
import type { FAQ } from "./CBStructuredData";

interface CBFAQProps {
  /** Static FAQs (legacy / non-CMS callers). Ignored when cmsPage is set. */
  faqs?: FAQ[];
  /** Page namespace in cms_faq_content (e.g. "country/pub"). Enables inline editing. */
  cmsPage?: string;
  /** Bundled defaults shown until the page has its own FAQ rows. */
  fallbackFaqs?: FAQ[];
  title?: string;
}

/** Pink dot used to signal an editable region inside the visual editor. */
const PinkDot = () => (
  <span
    aria-hidden
    className="inline-block w-2 h-2 rounded-full bg-pink-500 ml-2 align-middle shadow-[0_0_0_3px_rgba(236,72,153,0.18)]"
  />
);

const CBFAQ = ({ faqs, cmsPage, fallbackFaqs, title = "Asked and answered." }: CBFAQProps) => {
  const { isEditMode } = useEditMode();

  // CMS-backed mode
  if (cmsPage) {
    return (
      <CMSFaqs
        cmsPage={cmsPage}
        fallbackFaqs={fallbackFaqs ?? faqs ?? []}
        title={title}
        editable={isEditMode}
      />
    );
  }

  // Legacy static mode
  if (!faqs?.length) return null;
  return (
    <section className="border-t border-foreground/10 bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        <h2 className="font-display text-3xl md:text-4xl uppercase tracking-tight text-foreground">
          {title}
        </h2>
        <Accordion type="single" collapsible className="mt-8 divide-y divide-foreground/10 border-y border-foreground/10">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`q-${i}`} className="border-0">
              <AccordionTrigger className="py-5 text-left font-cb-sans text-lg md:text-xl text-foreground hover:no-underline">
                {f.question}
              </AccordionTrigger>
              <AccordionContent className="pb-6 pt-0 font-cb-sans text-base md:text-lg leading-relaxed text-foreground/80">
                {f.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

interface CMSFaqsProps {
  cmsPage: string;
  fallbackFaqs: FAQ[];
  title: string;
  editable: boolean;
}

const CMSFaqs = ({ cmsPage, fallbackFaqs, title, editable }: CMSFaqsProps) => {
  const mode = editable ? "cms" : "live";
  const { items, loading, addFaq, updateFaq, removeFaq, reorder } = useCMSFaqs(cmsPage, {
    mode,
    fallback: fallbackFaqs,
  });
  const [dragId, setDragId] = useState<string | null>(null);

  if (loading && items.length === 0) return null;
  if (!items.length && !editable) return null;

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const ids = items.map((i) => i.id);
    const fromIdx = ids.indexOf(dragId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...ids];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setDragId(null);
    reorder(next);
  };

  return (
    <section className="border-t border-foreground/10 bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        <h2 className="font-display text-3xl md:text-4xl uppercase tracking-tight text-foreground">
          {title}
        </h2>
        <Accordion
          type="single"
          collapsible
          className="mt-8 divide-y divide-foreground/10 border-y border-foreground/10"
        >
          {items.map((item) => (
            <FaqRow
              key={item.id}
              item={item}
              editable={editable}
              isDragging={dragId === item.id}
              onDragStart={() => setDragId(item.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => { if (dragId) e.preventDefault(); }}
              onDrop={() => handleDrop(item.id)}
              onSaveQuestion={(value) => updateFaq(item.id, { question: value })}
              onSaveAnswer={(value) => updateFaq(item.id, { answer: value })}
              onRemove={() => removeFaq(item.id)}
            />
          ))}
        </Accordion>
        {editable && (
          <div className="mt-6">
            <Button variant="outline" size="sm" onClick={() => addFaq()} className="gap-2">
              <Plus className="h-4 w-4" /> Add question
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

interface FaqRowProps {
  item: CMSFaqDisplay;
  editable: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onSaveQuestion: (value: string) => void;
  onSaveAnswer: (value: string) => void;
  onRemove: () => void;
}

const FaqRow = ({
  item,
  editable,
  isDragging,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onSaveQuestion,
  onSaveAnswer,
  onRemove,
}: FaqRowProps) => {
  const [editingQ, setEditingQ] = useState(false);
  const [editingA, setEditingA] = useState(false);
  const [qDraft, setQDraft] = useState(item.question);
  const [aDraft, setADraft] = useState(item.answer);

  // Reset local drafts when the underlying item updates (after save / refresh).
  if (!editingQ && qDraft !== item.question) setQDraft(item.question);
  if (!editingA && aDraft !== item.answer) setADraft(item.answer);

  return (
    <div
      draggable={editable}
      onDragStart={editable ? onDragStart : undefined}
      onDragEnd={editable ? onDragEnd : undefined}
      onDragOver={editable ? onDragOver : undefined}
      onDrop={editable ? onDrop : undefined}
      className={`relative ${isDragging ? "opacity-40" : ""}`}
    >
      <AccordionItem value={`q-${item.id}`} className="border-0">
        <div className="flex items-start gap-2">
          {editable && (
            <span
              className="mt-6 cursor-grab active:cursor-grabbing text-foreground/40 hover:text-foreground/80 select-none"
              aria-hidden
            >
              <GripVertical className="h-4 w-4" />
            </span>
          )}
          <div className="flex-1 min-w-0">
            <AccordionTrigger className="py-5 text-left font-cb-sans text-lg md:text-xl text-foreground hover:no-underline">
              {editable && editingQ ? (
                <Input
                  autoFocus
                  value={qDraft}
                  onChange={(e) => setQDraft(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (qDraft !== item.question) onSaveQuestion(qDraft);
                      setEditingQ(false);
                    } else if (e.key === "Escape") {
                      setQDraft(item.question);
                      setEditingQ(false);
                    }
                  }}
                  onBlur={() => {
                    if (qDraft !== item.question) onSaveQuestion(qDraft);
                    setEditingQ(false);
                  }}
                  className="font-cb-sans text-lg md:text-xl"
                />
              ) : (
                <span
                  onClick={(e) => {
                    if (!editable) return;
                    e.stopPropagation();
                    e.preventDefault();
                    setEditingQ(true);
                  }}
                  className={editable ? "cursor-text" : undefined}
                >
                  {item.question}
                  {editable && <PinkDot />}
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent className="pb-6 pt-0 font-cb-sans text-base md:text-lg leading-relaxed text-foreground/80">
              {editable && editingA ? (
                <Textarea
                  autoFocus
                  value={aDraft}
                  onChange={(e) => setADraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setADraft(item.answer);
                      setEditingA(false);
                    }
                  }}
                  onBlur={() => {
                    if (aDraft !== item.answer) onSaveAnswer(aDraft);
                    setEditingA(false);
                  }}
                  className="font-cb-sans text-base md:text-lg leading-relaxed min-h-[100px]"
                />
              ) : (
                <span
                  onClick={() => editable && setEditingA(true)}
                  className={editable ? "cursor-text inline-block w-full" : undefined}
                >
                  {item.answer}
                  {editable && <PinkDot />}
                </span>
              )}
            </AccordionContent>
          </div>
          {editable && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Delete this FAQ?")) onRemove();
              }}
              aria-label="Delete FAQ"
              className="mt-5 p-2 text-foreground/40 hover:text-destructive transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        {editable && item.isDraft && (
          <span className="absolute top-1 right-10 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-700">
            Draft
          </span>
        )}
      </AccordionItem>
    </div>
  );
};

export default CBFAQ;
