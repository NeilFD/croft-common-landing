import { StructuredData } from './StructuredData';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { useFAQContent } from '@/hooks/useFAQContent';
import { useCMSMode } from '@/contexts/CMSModeContext';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  page?: string;
  faqs?: FAQItem[];
  title?: string;
  className?: string;
}

export const FAQSection = ({ 
  page, 
  faqs: staticFaqs, 
  title = "Frequently Asked Questions", 
  className = "" 
}: FAQSectionProps) => {
  const { isCMSMode } = useCMSMode();
  const { faqs: cmsFaqs, loading } = useFAQContent(page || '', !isCMSMode);
  
  // Use CMS FAQs if page is provided, otherwise fallback to static FAQs
  const faqs = page ? cmsFaqs.map(faq => ({ question: faq.question, answer: faq.answer })) : (staticFaqs || []);
  
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  if (loading && page) {
    return (
      <section className={`py-16 ${className}`}>
        <div className="container mx-auto px-6">
          <div className="text-center">Loading FAQs...</div>
        </div>
      </section>
    );
  }

  if (faqs.length === 0) {
    return null;
  }

  return (
    <>
      <StructuredData data={faqSchema} />
      <section className={`py-16 ${className}`}>
        <div className="container mx-auto px-6">
          <h2 className="font-brutalist text-3xl md:text-4xl mb-12 text-center text-foreground">
            {title}
          </h2>
          <div className="max-w-4xl mx-auto">
            <Accordion type="multiple" className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border border-border rounded-lg overflow-hidden bg-card"
                >
                  <AccordionTrigger className="px-6 py-4 text-left font-industrial text-lg font-medium text-foreground hover:no-underline hover:bg-muted/50 transition-colors [&[data-state=open]]:bg-muted/30">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-0">
                    <p className="font-industrial text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </>
  );
};