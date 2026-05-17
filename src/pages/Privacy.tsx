import CBStaticPage from "@/components/crazybear/CBStaticPage";
import { CMSText } from "@/components/cms/CMSText";

const PAGE = "privacy";

interface ListSection {
  id: string;
  title: string;
  intro?: string;
  body?: string;
  items?: { id: string; text: string }[];
}

const SECTIONS: ListSection[] = [
  {
    id: "who",
    title: "1. Who we are",
    body:
      "The Crazy Bear Group is the data controller for crazybear.dev and bookings made at our hotels at Stadhampton (Oxfordshire) and Beaconsfield (Buckinghamshire).",
  },
  {
    id: "what",
    title: "2. What we collect",
    items: [
      { id: "i1", text: "Your name, email, phone number and address" },
      { id: "i2", text: "Booking, stay and event details" },
      { id: "i3", text: "Payment information processed by our payment provider" },
      { id: "i4", text: "Account, membership and Bear's Den Gold subscription data" },
      { id: "i5", text: "Website usage, device and cookie data" },
    ],
  },
  {
    id: "how",
    title: "3. How we use it",
    items: [
      { id: "i1", text: "To take and manage your bookings" },
      { id: "i2", text: "To run your membership and subscription" },
      { id: "i3", text: "To send you updates and offers you have opted into" },
      { id: "i4", text: "To improve the website and our service" },
      { id: "i5", text: "To meet our legal and tax obligations" },
    ],
  },
  {
    id: "basis",
    title: "4. Legal basis",
    body:
      "We process your data under consent, contract, legitimate interests and legal obligation, as set out by the UK GDPR and the Data Protection Act 2018.",
  },
  {
    id: "sharing",
    title: "5. Sharing",
    body:
      "We do not sell your personal data. We share it only with trusted processors who help us run the business (payments, email, analytics, hosting), and with authorities where required by law.",
  },
  {
    id: "rights",
    title: "6. Your rights",
    items: [
      { id: "i1", text: "Access the data we hold on you" },
      { id: "i2", text: "Correct anything that's wrong" },
      { id: "i3", text: "Ask us to delete it" },
      { id: "i4", text: "Object to or restrict processing" },
      { id: "i5", text: "Withdraw consent at any time" },
      { id: "i6", text: "Port your data to another provider" },
    ],
  },
  {
    id: "retention",
    title: "7. Retention",
    body:
      "We keep your data only as long as we need it for the purpose it was collected, or as required by law. Marketing data is kept until you unsubscribe.",
  },
  {
    id: "cookies",
    title: "8. Cookies",
    body: "See our Cookies policy for the full list and to change your preferences.",
  },
];

const Privacy = () => (
  <CBStaticPage
    title="Privacy"
    intro="What we collect. Why. And how to make us forget."
    seoDescription="Privacy policy for The Crazy Bear. What we collect, why we hold it, your rights and how to contact us."
    path="/privacy"
    cmsPage={PAGE}
  >
    <div className="space-y-10 font-cb-sans text-base leading-relaxed">
      {SECTIONS.map((s) => (
        <section key={s.id}>
          <CMSText page={PAGE} section={s.id} contentKey="title" fallback={s.title} as="h2" className="font-serif text-2xl uppercase" />
          {s.body && (
            <CMSText
              page={PAGE}
              section={s.id}
              contentKey="body"
              fallback={s.body}
              as="p"
              className="mt-3 opacity-85"
            />
          )}
          {s.items && (
            <ul className="mt-3 list-disc list-inside space-y-2 opacity-85">
              {s.items.map((it) => (
                <li key={it.id}>
                  <CMSText page={PAGE} section={`${s.id}-${it.id}`} contentKey="text" fallback={it.text} as="span" />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <section>
        <CMSText page={PAGE} section="contact" contentKey="title" fallback="9. Contact" as="h2" className="font-serif text-2xl uppercase" />
        <div className="mt-3 border border-black/15 p-6">
          <CMSText page={PAGE} section="contact" contentKey="name" fallback="The Crazy Bear Group" as="p" className="opacity-85 font-bold" />
          <CMSText page={PAGE} section="contact" contentKey="address" fallback="Bear Lane, Stadhampton, Oxfordshire OX44 7UR" as="p" className="opacity-85" />
          <CMSText page={PAGE} section="contact" contentKey="email" fallback="privacy@crazybear.dev" as="p" className="opacity-85" />
          <CMSText
            page={PAGE}
            section="contact"
            contentKey="note"
            fallback="You can also complain to the Information Commissioner's Office (ICO) at ico.org.uk."
            as="p"
            className="mt-4 opacity-70 text-sm"
          />
        </div>
        <CMSText
          page={PAGE}
          section="contact"
          contentKey="updated"
          fallback="Last updated: May 2026"
          as="p"
          className="mt-6 font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60"
        />
      </section>
    </div>
  </CBStaticPage>
);

export default Privacy;
