import CBStaticPage from "@/components/crazybear/CBStaticPage";
import { useCookieConsent, openCookiePreferences } from "@/hooks/useCookieConsent";

const Row = ({ name, purpose, duration, type }: { name: string; purpose: string; duration: string; type: string }) => (
  <tr className="border-t border-foreground/15">
    <td className="py-3 pr-4 align-top font-cb-mono text-[11px] tracking-[0.2em] uppercase">{name}</td>
    <td className="py-3 pr-4 align-top text-sm opacity-85">{purpose}</td>
    <td className="py-3 pr-4 align-top font-cb-mono text-[10px] tracking-[0.2em] uppercase opacity-70">{duration}</td>
    <td className="py-3 align-top font-cb-mono text-[10px] tracking-[0.2em] uppercase opacity-70">{type}</td>
  </tr>
);

const Cookies = () => {
  const { status } = useCookieConsent();
  return (
    <CBStaticPage
      title="Cookies"
      intro={"What we set, why we set it, and how to change your mind."}
      seoDescription="Cookies policy for The Crazy Bear. Essential, analytics and embedded media cookies, with a preference toggle."
      path="/cookies"
    >
      <div className="space-y-10 font-cb-sans text-base leading-relaxed">
        <section>
          <h2 className="font-serif text-2xl uppercase">Your current setting</h2>
          <p className="mt-3 opacity-85">
            {status === "accepted" && "You have accepted all cookies, including analytics and embeds."}
            {status === "rejected" && "You have rejected non-essential cookies. Only essential ones are active."}
            {status === null && "You have not yet made a choice. The banner will appear at the bottom of the screen."}
          </p>
          <button
            type="button"
            onClick={openCookiePreferences}
            className="mt-4 inline-block border border-foreground px-6 py-3 font-cb-mono text-[10px] tracking-[0.4em] uppercase hover:bg-foreground hover:text-background transition-colors"
          >
            Manage preferences
          </button>
        </section>

        <section>
          <h2 className="font-serif text-2xl uppercase">What are cookies?</h2>
          <p className="mt-3 opacity-85">
            Cookies are small text files placed on your device when you visit a website. They help sites
            remember you, keep you signed in, and measure how the site is used. Some cookies are essential;
            others help us improve things.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl uppercase">Categories we use</h2>

          <div className="mt-6 space-y-8">
            <div>
              <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-70">Essential</p>
              <p className="mt-2 opacity-85">
                Required for the site to work — sign-in, security, booking sessions. Always on. Cannot be disabled.
              </p>
              <table className="mt-3 w-full text-left">
                <tbody>
                  <Row name="sb-auth" purpose="Sign-in session for the Bear's Den" duration="30 days" type="Essential" />
                  <Row name="cb-cookie-consent" purpose="Records your cookie choice" duration="1 year" type="Essential" />
                </tbody>
              </table>
            </div>

            <div>
              <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-70">Analytics</p>
              <p className="mt-2 opacity-85">
                Helps us understand which pages people read and what works. Only set if you accept.
              </p>
              <table className="mt-3 w-full text-left">
                <tbody>
                  <Row name="_ga" purpose="Distinguishes anonymous visitors" duration="2 years" type="Analytics" />
                  <Row name="_gid" purpose="Distinguishes sessions" duration="24 hours" type="Analytics" />
                </tbody>
              </table>
            </div>

            <div>
              <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-70">Embedded media</p>
              <p className="mt-2 opacity-85">
                Spotify, YouTube, Instagram, TikTok. These set their own cookies when an embed loads.
                Only loaded if you accept.
              </p>
              <table className="mt-3 w-full text-left">
                <tbody>
                  <Row name="sp_*" purpose="Spotify playlist embeds" duration="varies" type="Third party" />
                  <Row name="VISITOR_INFO1_LIVE" purpose="YouTube video embeds" duration="6 months" type="Third party" />
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl uppercase">Changing your mind</h2>
          <p className="mt-3 opacity-85">
            You can reopen the cookie banner using the button at the top of this page, or by clearing site
            data in your browser. We honour your latest choice for as long as the preference cookie is set.
          </p>
          <p className="mt-6 font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">
            Last updated: May 2026
          </p>
        </section>
      </div>
    </CBStaticPage>
  );
};

export default Cookies;
