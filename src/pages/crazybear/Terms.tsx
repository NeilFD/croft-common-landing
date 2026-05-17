import CBStaticPage from "@/components/crazybear/CBStaticPage";
import { CMSText } from "@/components/cms/CMSText";

const PAGE = "terms";

const SECTIONS: { id: string; title: string; body: string }[] = [
  {
    id: "about",
    title: "1. About us",
    body:
      "The Crazy Bear is the trading name of The Crazy Bear Group, with hotels at Stadhampton (Oxfordshire) and Beaconsfield (Buckinghamshire). These terms apply to all bookings, visits and use of crazybear.dev.",
  },
  {
    id: "bookings",
    title: "2. Bookings",
    body:
      "A booking is confirmed only when you receive written confirmation. We may require a card to guarantee your booking and may take a deposit. Rates and availability can change until confirmed.",
  },
  {
    id: "cancellations",
    title: "3. Cancellations",
    body:
      "Standard rooms and tables can be cancelled free of charge up to 48 hours before arrival. Inside 48 hours the full first night's stay or the booking deposit is non-refundable. Event and group bookings have their own cancellation terms which we will share in writing.",
  },
  {
    id: "payment",
    title: "4. Payment",
    body:
      "We accept all major UK debit and credit cards, plus Apple and Google Pay. All prices are in pounds sterling and include VAT where applicable. A discretionary service charge may be added to bills.",
  },
  {
    id: "conduct",
    title: "5. Conduct",
    body:
      "We host theatre, not chaos. We reserve the right to refuse service, end a stay or remove guests whose behaviour endangers, abuses or disturbs other guests or staff. The full House Rules set out what we expect.",
  },
  {
    id: "children-dogs",
    title: "6. Children & dogs",
    body:
      "Both sites welcome well-behaved children at the discretion of the host. Dogs are welcome at Country in designated rooms by prior arrangement. See the Dogs page for specifics.",
  },
  {
    id: "liability",
    title: "7. Liability",
    body:
      "To the fullest extent permitted by law, our liability for loss or damage is limited to the value of the booking. We are not liable for any loss of profit, business or indirect loss. Nothing in these terms excludes liability for death, personal injury caused by our negligence, or fraud.",
  },
  {
    id: "gold",
    title: "8. Bears Den Gold",
    body:
      "Bear's Den Gold is a £69 per month subscription giving 25% off, in app and in venue. Subscriptions renew monthly and can be cancelled at any time. Cancellation takes effect at the end of the current billing period. Discount terms and exclusions are listed in the app.",
  },
  {
    id: "changes",
    title: "9. Changes",
    body:
      "We may update these terms from time to time. The current version applies to bookings made from the date of publication. Material changes will be flagged on this page.",
  },
  {
    id: "law",
    title: "10. Governing law",
    body:
      "These terms are governed by the laws of England and Wales. Any dispute is subject to the exclusive jurisdiction of the English courts.",
  },
];

const Terms = () => (
  <CBStaticPage
    title="Terms"
    intro="The agreements behind the mischief."
    seoDescription="Terms and conditions for The Crazy Bear. Bookings, cancellations, payment, conduct, liability and changes."
    path="/terms"
    cmsPage={PAGE}
  >
    <div className="space-y-10 font-cb-sans text-base leading-relaxed">
      {SECTIONS.map((s) => (
        <section key={s.id}>
          <CMSText page={PAGE} section={s.id} contentKey="title" fallback={s.title} as="h2" className="font-serif text-2xl uppercase" />
          <CMSText page={PAGE} section={s.id} contentKey="body" fallback={s.body} as="p" className="mt-3 opacity-85" />
        </section>
      ))}
      <CMSText
        page={PAGE}
        section="meta"
        contentKey="updated"
        fallback="Last updated: May 2026"
        as="p"
        className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60"
      />
    </div>
  </CBStaticPage>
);

export default Terms;
