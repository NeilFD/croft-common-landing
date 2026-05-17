import CBStaticPage from "@/components/crazybear/CBStaticPage";

const Privacy = () => (
  <CBStaticPage
    title="Privacy"
    intro="What we collect. Why. And how to make us forget."
    seoDescription="Privacy policy for The Crazy Bear. What we collect, why we hold it, your rights and how to contact us."
    path="/privacy"
  >
    <div className="space-y-10 font-cb-sans text-base leading-relaxed">
      <section>
        <h2 className="font-serif text-2xl uppercase">1. Who we are</h2>
        <p className="mt-3 opacity-85">
          The Crazy Bear Group is the data controller for crazybear.dev and bookings made at our hotels at
          Stadhampton (Oxfordshire) and Beaconsfield (Buckinghamshire).
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl uppercase">2. What we collect</h2>
        <ul className="mt-3 list-disc list-inside space-y-2 opacity-85">
          <li>Your name, email, phone number and address</li>
          <li>Booking, stay and event details</li>
          <li>Payment information processed by our payment provider</li>
          <li>Account, membership and Bear's Den Gold subscription data</li>
          <li>Website usage, device and cookie data</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl uppercase">3. How we use it</h2>
        <ul className="mt-3 list-disc list-inside space-y-2 opacity-85">
          <li>To take and manage your bookings</li>
          <li>To run your membership and subscription</li>
          <li>To send you updates and offers you have opted into</li>
          <li>To improve the website and our service</li>
          <li>To meet our legal and tax obligations</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl uppercase">4. Legal basis</h2>
        <p className="mt-3 opacity-85">
          We process your data under consent, contract, legitimate interests and legal obligation, as set out by
          the UK GDPR and the Data Protection Act 2018.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl uppercase">5. Sharing</h2>
        <p className="mt-3 opacity-85">
          We do not sell your personal data. We share it only with trusted processors who help us run the
          business (payments, email, analytics, hosting), and with authorities where required by law.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl uppercase">6. Your rights</h2>
        <ul className="mt-3 list-disc list-inside space-y-2 opacity-85">
          <li>Access the data we hold on you</li>
          <li>Correct anything that's wrong</li>
          <li>Ask us to delete it</li>
          <li>Object to or restrict processing</li>
          <li>Withdraw consent at any time</li>
          <li>Port your data to another provider</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-2xl uppercase">7. Retention</h2>
        <p className="mt-3 opacity-85">
          We keep your data only as long as we need it for the purpose it was collected, or as required by law.
          Marketing data is kept until you unsubscribe.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl uppercase">8. Cookies</h2>
        <p className="mt-3 opacity-85">
          See our <a href="/cookies" className="underline underline-offset-4">Cookies policy</a> for the full
          list and to change your preferences.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl uppercase">9. Contact</h2>
        <div className="mt-3 border border-black/15 p-6">
          <p className="opacity-85"><strong>The Crazy Bear Group</strong></p>
          <p className="opacity-85">Bear Lane, Stadhampton, Oxfordshire OX44 7UR</p>
          <p className="opacity-85">privacy@crazybear.dev</p>
          <p className="mt-4 opacity-70 text-sm">
            You can also complain to the Information Commissioner's Office (ICO) at ico.org.uk.
          </p>
        </div>
        <p className="mt-6 font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">
          Last updated: May 2026
        </p>
      </section>
    </div>
  </CBStaticPage>
);

export default Privacy;
