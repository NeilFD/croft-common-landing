import CBStaticPage from "@/components/crazybear/CBStaticPage";
import { Link } from "react-router-dom";

const Contact = () => (
  <CBStaticPage
    title="Contact"
    intro={"Two hotels. Two phones. One spirit.\nPick the one nearest the trouble you're planning."}
    seoDescription="Contact The Crazy Bear. Town in Beaconsfield, Country in Stadhampton. Phone, email, and an enquiry form."
    path="/contact"
  >
    <div className="grid md:grid-cols-2 gap-10">
      <div className="border border-foreground/15 p-8">
        <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60">Country / Stadhampton</p>
        <h2 className="mt-2 font-serif text-3xl uppercase">Crazy Bear Country</h2>
        <p className="mt-4 font-cb-sans text-base opacity-85">
          Bear Lane<br />
          Stadhampton, Oxfordshire<br />
          OX44 7UR
        </p>
        <a href="tel:01865890714" className="mt-4 inline-block font-cb-mono text-[12px] tracking-[0.35em] uppercase underline underline-offset-4">
          01865 890 714
        </a>
        <br />
        <a href="mailto:country@crazybear.dev" className="mt-2 inline-block font-cb-mono text-[12px] tracking-[0.35em] uppercase underline underline-offset-4">
          country@crazybear.dev
        </a>
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
        <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60">Town / Beaconsfield</p>
        <h2 className="mt-2 font-serif text-3xl uppercase">Crazy Bear Town</h2>
        <p className="mt-4 font-cb-sans text-base opacity-85">
          75 Wycombe End<br />
          Beaconsfield, Buckinghamshire<br />
          HP9 1LX
        </p>
        <a href="tel:01494673086" className="mt-4 inline-block font-cb-mono text-[12px] tracking-[0.35em] uppercase underline underline-offset-4">
          01494 673 086
        </a>
        <br />
        <a href="mailto:town@crazybear.dev" className="mt-2 inline-block font-cb-mono text-[12px] tracking-[0.35em] uppercase underline underline-offset-4">
          town@crazybear.dev
        </a>
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
      <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-70">Got a bigger ask?</p>
      <h2 className="mt-2 font-serif text-3xl uppercase">Send us the brief</h2>
      <p className="mt-4 font-cb-sans text-lg opacity-85 max-w-xl mx-auto">
        Weddings, takeovers, press, partnerships. Whatever you're planning, tell us about it.
      </p>
      <Link
        to="/enquire"
        className="mt-6 inline-block border border-foreground px-8 py-4 font-cb-mono text-[10px] tracking-[0.4em] uppercase hover:bg-foreground hover:text-background transition-colors"
      >
        Open the enquiry form
      </Link>
    </div>
  </CBStaticPage>
);

export default Contact;
