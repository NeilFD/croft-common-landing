import CBStaticPage from "@/components/crazybear/CBStaticPage";
import { Link } from "react-router-dom";
import { CMSText } from "@/components/cms/CMSText";

const PAGE = "contact";

const Contact = () => (
  <CBStaticPage
    title="Contact"
    intro={"Two hotels. Two phones. One spirit.\nPick the one nearest the trouble you're planning."}
    seoDescription="Contact The Crazy Bear. Town in Beaconsfield, Country in Stadhampton. Phone, email, and an enquiry form."
    path="/contact"
    cmsPage={PAGE}
  >
    <div className="grid md:grid-cols-2 gap-10">
      <div className="border border-foreground/15 p-8">
        <CMSText page={PAGE} section="country" contentKey="eyebrow" fallback="Country / Stadhampton" as="p" className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60" />
        <CMSText page={PAGE} section="country" contentKey="name" fallback="Crazy Bear Country" as="h2" className="mt-2 font-serif text-3xl uppercase" />
        <CMSText
          page={PAGE}
          section="country"
          contentKey="address"
          fallback={"Bear Lane\nStadhampton, Oxfordshire\nOX44 7UR"}
          as="p"
          className="mt-4 font-cb-sans text-base opacity-85 whitespace-pre-line"
        />
        <CMSText
          page={PAGE}
          section="country"
          contentKey="phone"
          fallback="01865 890 714"
          as="a"
          href="tel:01865890714"
          className="mt-4 inline-block font-cb-mono text-[12px] tracking-[0.35em] uppercase underline underline-offset-4"
        />
        <br />
        <CMSText
          page={PAGE}
          section="country"
          contentKey="email"
          fallback="country@crazybear.dev"
          as="a"
          href="mailto:country@crazybear.dev"
          className="mt-2 inline-block font-cb-mono text-[12px] tracking-[0.35em] uppercase underline underline-offset-4"
        />
        <p className="mt-6">
          <a
            href="https://maps.google.com/?q=Crazy+Bear+Stadhampton"
            target="_blank"
            rel="noreferrer"
            className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-70 hover:opacity-100 underline-offset-4 hover:underline"
          >
            Open in Maps
          </a>
        </p>
      </div>

      <div className="border border-foreground/15 p-8">
        <CMSText page={PAGE} section="town" contentKey="eyebrow" fallback="Town / Beaconsfield" as="p" className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60" />
        <CMSText page={PAGE} section="town" contentKey="name" fallback="Crazy Bear Town" as="h2" className="mt-2 font-serif text-3xl uppercase" />
        <CMSText
          page={PAGE}
          section="town"
          contentKey="address"
          fallback={"75 Wycombe End\nBeaconsfield, Buckinghamshire\nHP9 1LX"}
          as="p"
          className="mt-4 font-cb-sans text-base opacity-85 whitespace-pre-line"
        />
        <CMSText
          page={PAGE}
          section="town"
          contentKey="phone"
          fallback="01494 673 086"
          as="a"
          href="tel:01494673086"
          className="mt-4 inline-block font-cb-mono text-[12px] tracking-[0.35em] uppercase underline underline-offset-4"
        />
        <br />
        <CMSText
          page={PAGE}
          section="town"
          contentKey="email"
          fallback="town@crazybear.dev"
          as="a"
          href="mailto:town@crazybear.dev"
          className="mt-2 inline-block font-cb-mono text-[12px] tracking-[0.35em] uppercase underline underline-offset-4"
        />
        <p className="mt-6">
          <a
            href="https://maps.google.com/?q=Crazy+Bear+Beaconsfield"
            target="_blank"
            rel="noreferrer"
            className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-70 hover:opacity-100 underline-offset-4 hover:underline"
          >
            Open in Maps
          </a>
        </p>
      </div>
    </div>

    <div className="mt-16 text-center">
      <CMSText page={PAGE} section="cta" contentKey="eyebrow" fallback="Got a bigger ask?" as="p" className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-70" />
      <CMSText page={PAGE} section="cta" contentKey="title" fallback="Send us the brief" as="h2" className="mt-2 font-serif text-3xl uppercase" />
      <CMSText
        page={PAGE}
        section="cta"
        contentKey="body"
        fallback="Weddings, takeovers, press, partnerships. Whatever you're planning, tell us about it."
        as="p"
        className="mt-4 font-cb-sans text-lg opacity-85 max-w-xl mx-auto"
      />
      <Link
        to="/enquire"
        className="mt-6 inline-block border border-foreground px-8 py-4 font-cb-mono text-[10px] tracking-[0.4em] uppercase hover:bg-foreground hover:text-background transition-colors"
      >
        <CMSText page={PAGE} section="cta" contentKey="button" fallback="Open the enquiry form" as="span" />
      </Link>
    </div>
  </CBStaticPage>
);

export default Contact;
