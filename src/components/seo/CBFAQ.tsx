import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FAQ } from "./CBStructuredData";

interface CBFAQProps {
  faqs: FAQ[];
  title?: string;
}

const CBFAQ = ({ faqs, title = "Asked and answered." }: CBFAQProps) => {
  if (!faqs?.length) return null;

  return (
    <section className="border-t border-foreground/10 bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        <h2 className="font-cb-display text-3xl md:text-4xl uppercase tracking-tight text-foreground">
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

export default CBFAQ;
