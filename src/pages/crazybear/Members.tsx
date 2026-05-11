import { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import CBTopNav from "@/components/crazybear/CBTopNav";
import { CMSText } from "@/components/cms/CMSText";
import { useSEO } from "@/hooks/useSEO";

const CBFooter = lazy(() => import("@/components/crazybear/CBFooter"));

const PAGE = "cb-members";

const Members = () => {
  useSEO({
    title: "Join the Bears Den / The Crazy Bear",
    description:
      "The Bears Den. The bear's memory of you. Quiet perks across Town and Country. Free to join.",
  });

  return (
    <main className="bg-black text-white font-cb-sans min-h-screen">
      {/* Hero / intro */}
      <section className="relative w-full bg-black text-white pt-40 md:pt-48 pb-20 md:pb-28 px-6 md:px-16">
        <CBTopNav tone="light" />

        <div className="relative z-10 mx-auto max-w-4xl">
          <CMSText
            page={PAGE}
            section="hero"
            contentKey="eyebrow"
            fallback="The Bears Den / Town / Country"
            as="p"
            className="font-cb-mono text-[10px] md:text-xs tracking-[0.5em] uppercase opacity-80"
          />
          <CMSText
            page={PAGE}
            section="hero"
            contentKey="headline"
            fallback="Join the Bears Den."
            as="h1"
            className="mt-6 font-display uppercase text-5xl md:text-7xl leading-[0.9] tracking-tight"
          />
          <CMSText
            page={PAGE}
            section="hero"
            contentKey="intro"
            fallback="Free to join. The bear remembers you. Birthdays, bookings, the odd quiet table when the room looks full. Town and Country. Both houses, one ear."
            as="p"
            className="mt-8 max-w-2xl font-cb-sans text-lg md:text-xl leading-relaxed opacity-90"
          />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/15 px-6 md:px-16 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <CMSText
            page={PAGE}
            section="how"
            contentKey="kicker"
            fallback="How it works"
            as="p"
            className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60"
          />

          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {[
              {
                num: "01",
                key: "step-1",
                title: "Sign up",
                body: "Name and email. Ten seconds. No card.",
              },
              {
                num: "02",
                key: "step-2",
                title: "We remember you",
                body: "Bookings. Birthdays. The bits you tell us. Nothing shouted.",
              },
              {
                num: "03",
                key: "step-3",
                title: "Walk in",
                body: "A softer landing at Town and Country. The bear knows your name.",
              },
            ].map((s) => (
              <div key={s.num} className="border-t border-white/20 pt-6">
                <p className="font-cb-mono text-[11px] tracking-[0.4em] opacity-60">
                  {s.num}
                </p>
                <CMSText
                  page={PAGE}
                  section="how"
                  contentKey={`${s.key}-title`}
                  fallback={s.title}
                  as="h2"
                  className="mt-3 font-display uppercase text-2xl tracking-tight"
                />
                <CMSText
                  page={PAGE}
                  section="how"
                  contentKey={`${s.key}-body`}
                  fallback={s.body}
                  as="p"
                  className="mt-3 font-cb-sans text-base opacity-80 leading-relaxed"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="border-t border-white/15 px-6 md:px-16 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <CMSText
            page={PAGE}
            section="get"
            contentKey="kicker"
            fallback="What you get"
            as="p"
            className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60"
          />
          <ul className="mt-10 space-y-5">
            {[
              { k: "perk-1", t: "Priority on quiet rooms and last-minute tables." },
              { k: "perk-2", t: "First word on new openings, suppers and odd nights." },
              { k: "perk-3", t: "A birthday nod from the bear." },
              { k: "perk-4", t: "Members-only moments. Town and Country." },
            ].map((p) => (
              <li key={p.k} className="flex gap-5 border-b border-white/15 pb-5">
                <span aria-hidden className="font-cb-mono text-[11px] tracking-[0.4em] opacity-60 pt-1">
                  /
                </span>
                <CMSText
                  page={PAGE}
                  section="get"
                  contentKey={p.k}
                  fallback={p.t}
                  as="p"
                  className="font-cb-sans text-base md:text-lg leading-relaxed"
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Gold tease */}
      <section className="border-t border-white/15 px-6 md:px-16 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <CMSText
            page={PAGE}
            section="gold"
            contentKey="kicker"
            fallback="Want more?"
            as="p"
            className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60"
          />
          <CMSText
            page={PAGE}
            section="gold"
            contentKey="title"
            fallback="Bear's Den Gold."
            as="h2"
            className="mt-6 font-display uppercase text-4xl md:text-5xl tracking-tight"
          />
          <CMSText
            page={PAGE}
            section="gold"
            contentKey="body"
            fallback="£69 a month. 25% off everywhere. In-app and in-venue. Referral credits when friends join. A gold card. The bear notices."
            as="p"
            className="mt-6 font-cb-sans text-lg leading-relaxed opacity-90"
          />
          <p className="mt-8 font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60">
            Sign up first. Gold lives inside.
          </p>
        </div>
      </section>

      {/* Sign-up form */}
      <section id="join" className="border-t border-white/15 px-6 md:px-16 py-20 md:py-28 bg-black">
        <Suspense fallback={null}>
          <SignUpFormSection />
        </Suspense>
      </section>

      {/* Already a member */}
      <section className="border-t border-white/15 px-6 md:px-16 py-12 text-center">
        <CMSText
          page={PAGE}
          section="footer"
          contentKey="already"
          fallback="Already a member?"
          as="p"
          className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60"
        />
        <Link
          to="/den"
          className="mt-4 inline-block font-cb-mono text-xs tracking-[0.4em] uppercase border border-white/40 px-6 py-3 hover:bg-white hover:text-black transition-colors"
        >
          Enter the Den
        </Link>
      </section>

      <Suspense fallback={null}>
        <CBFooter />
      </Suspense>
    </main>
  );
};

const CBSubscriptionForm = lazy(() => import("@/components/crazybear/CBSubscriptionForm"));
const SignUpFormSection = () => (
  <Suspense fallback={null}>
    <CBSubscriptionForm />
  </Suspense>
);

export default Members;
