import { StructuredData } from './StructuredData';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQItem[];
  title?: string;
  className?: string;
}

export const FAQSection = ({ faqs, title = "Frequently Asked Questions", className = "" }: FAQSectionProps) => {
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

  return (
    <>
      <StructuredData data={faqSchema} />
      <section className={`py-16 ${className}`}>
        <div className="container mx-auto px-6">
          <h2 className="font-brutalist text-3xl md:text-4xl mb-12 text-center text-foreground">
            {title}
          </h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <details key={index} className="group border border-border rounded-lg overflow-hidden">
                <summary className="flex justify-between items-center p-6 cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                  <h3 className="font-industrial text-lg font-medium text-foreground pr-4">
                    {faq.question}
                  </h3>
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform duration-200">
                    ▼
                  </span>
                </summary>
                <div className="p-6 pt-0">
                  <p className="font-industrial text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};