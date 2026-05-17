import { Link } from "react-router-dom";
import { CBSeo } from "@/components/seo/CBSeo";
import { breadcrumbSchema } from "@/components/seo/CBStructuredData";
import CBTopNav from "@/components/crazybear/CBTopNav";
import CBFooter from "@/components/crazybear/CBFooter";

const DENOMINATIONS = [50, 100, 150, 250, 500];

const GiftVouchers = () => (
  <>
    <CBSeo
      title="Gift Vouchers | Crazy Bear"
      description="Gift vouchers for Crazy Bear Town and Country. Rooms, dinner, drinks. Posted or sent by email."
      path="/gift-vouchers"
      jsonLd={[breadcrumbSchema("/gift-vouchers")]}
    />

    <section className="relative bg-black text-white pt-40 md:pt-48 pb-24 md:pb-32 px-6">
      <CBTopNav tone="light" />
      <div className="mx-auto max-w-4xl text-center">
        <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-70">Crazy Bear</p>
        <h1 className="mt-4 font-serif text-5xl md:text-7xl uppercase">Gift Vouchers</h1>
        <p className="mt-6 font-cb-sans text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
          Rooms. Dinner. Drinks. Whatever they fancy, on you. Posted or sent by email.
        </p>
      </div>
    </section>

    <section className="bg-background text-foreground px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60 text-center">
          Choose an amount
        </p>
        <ul className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
          {DENOMINATIONS.map((amt) => (
            <li key={amt}>
              <Link
                to="/enquire"
                className="block text-center border border-foreground py-8 hover:bg-foreground hover:text-background transition-colors"
              >
                <span className="font-serif text-3xl">£{amt}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-16 max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl uppercase">Something specific?</h2>
          <p className="mt-4 font-cb-sans text-lg opacity-85">
            Afternoon tea for two. A night in the Decadent. Sunday lunch for the whole family. Tell us what you want and
            we'll make the voucher.
          </p>
          <Link
            to="/enquire"
            className="mt-8 inline-block font-cb-mono text-[10px] tracking-[0.5em] uppercase border border-foreground px-7 py-4 hover:bg-foreground hover:text-background transition-colors"
          >
            Enquire
          </Link>
        </div>

        <div className="mt-20 border-t border-foreground/15 pt-10 text-sm font-cb-sans opacity-80 max-w-2xl mx-auto">
          <p>Vouchers are valid for twelve months from issue. Redeemable at Crazy Bear Town and Country. Not transferable for cash.</p>
        </div>
      </div>
    </section>
    <CBFooter />
  </>
);

export default GiftVouchers;
