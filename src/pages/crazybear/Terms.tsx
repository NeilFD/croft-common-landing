import CBStaticPage from "@/components/crazybear/CBStaticPage";

const Terms = () => (
  <CBStaticPage
    title="Terms"
    intro="The agreements behind the mischief."
    seoDescription="Terms and conditions for The Crazy Bear. Bookings, cancellations, payment, conduct, liability and changes."
    path="/terms"
  >
    <div className="space-y-10 font-cb-sans text-base leading-relaxed">
      <section>
        <h2 className="font-serif text-2xl uppercase">1. About us</h2>
        <p className="mt-3 opacity-85">
          The Crazy Bear is the trading name of The Crazy Bear Group, with hotels at Stadhampton (Oxfordshire) and
          Beaconsfield (Buckinghamshire). These terms apply to all bookings, visits and use of crazybear.dev.
        </p>
      </section>
      <section>
        <h2 className="font-serif text-2xl uppercase">2. Bookings</h2>
        <p className="mt-3 opacity-85">
          A booking is confirmed only when you receive written confirmation. We may require a card to guarantee
          your booking and may take a deposit. Rates and availability can change until confirmed.
        </p>
      </section>
      <section>
        <h2 className="font-serif text-2xl uppercase">3. Cancellations</h2>
        <p className="mt-3 opacity-85">
          Standard rooms and tables can be cancelled free of charge up to 48 hours before arrival. Inside 48 hours
          the full first night's stay or the booking deposit is non-refundable. Event and group bookings have their
          own cancellation terms which we will share in writing.
        </p>
      </section>
      <section>
        <h2 className="font-serif text-2xl uppercase">4. Payment</h2>
        <p className="mt-3 opacity-85">
          We accept all major UK debit and credit cards, plus Apple and Google Pay. All prices are in pounds
          sterling and include VAT where applicable. A discretionary service charge may be added to bills.
        </p>
      </section>
      <section>
        <h2 className="font-serif text-2xl uppercase">5. Conduct</h2>
        <p className="mt-3 opacity-85">
          We host theatre, not chaos. We reserve the right to refuse service, end a stay or remove guests whose
          behaviour endangers, abuses or disturbs other guests or staff. The full <a href="/house-rules" className="underline underline-offset-4">House Rules</a> set out what we expect.
        </p>
      </section>
      <section>
        <h2 className="font-serif text-2xl uppercase">6. Children &amp; dogs</h2>
        <p className="mt-3 opacity-85">
          Both sites welcome well-behaved children at the discretion of the host. Dogs are welcome at Country
          in designated rooms by prior arrangement. See the <a href="/country/dogs" className="underline underline-offset-4">Dogs page</a> for specifics.
        </p>
      </section>
      <section>
        <h2 className="font-serif text-2xl uppercase">7. Liability</h2>
        <p className="mt-3 opacity-85">
          To the fullest extent permitted by law, our liability for loss or damage is limited to the value of the
          booking. We are not liable for any loss of profit, business or indirect loss. Nothing in these terms
          excludes liability for death, personal injury caused by our negligence, or fraud.
        </p>
      </section>
      <section>
        <h2 className="font-serif text-2xl uppercase">8. Bears Den Gold</h2>
        <p className="mt-3 opacity-85">
          Bear's Den Gold is a £69 per month subscription giving 25% off, in app and in venue. Subscriptions
          renew monthly and can be cancelled at any time. Cancellation takes effect at the end of the current
          billing period. Discount terms and exclusions are listed in the app.
        </p>
      </section>
      <section>
        <h2 className="font-serif text-2xl uppercase">9. Changes</h2>
        <p className="mt-3 opacity-85">
          We may update these terms from time to time. The current version applies to bookings made from the
          date of publication. Material changes will be flagged on this page.
        </p>
      </section>
      <section>
        <h2 className="font-serif text-2xl uppercase">10. Governing law</h2>
        <p className="mt-3 opacity-85">
          These terms are governed by the laws of England and Wales. Any dispute is subject to the exclusive
          jurisdiction of the English courts.
        </p>
        <p className="mt-6 font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">
          Last updated: May 2026
        </p>
      </section>
    </div>
  </CBStaticPage>
);

export default Terms;
