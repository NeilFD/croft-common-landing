import CBStaticPage from "@/components/crazybear/CBStaticPage";
import { CMSText } from "@/components/cms/CMSText";
import { useCookieConsent, openCookiePreferences } from "@/hooks/useCookieConsent";

const PAGE = "cookies";

const Row = ({
  rowKey,
  name,
  purpose,
  duration,
  type,
}: { rowKey: string; name: string; purpose: string; duration: string; type: string }) => (
  <tr className="border-t border-foreground/15">
    <td className="py-3 pr-4 align-top font-cb-mono text-[11px] tracking-[0.2em] uppercase">
      <CMSText page={PAGE} section={rowKey} contentKey="name" fallback={name} as="span" />
    </td>
    <td className="py-3 pr-4 align-top text-sm opacity-85">
      <CMSText page={PAGE} section={rowKey} contentKey="purpose" fallback={purpose} as="span" />
    </td>
    <td className="py-3 pr-4 align-top font-cb-mono text-[10px] tracking-[0.2em] uppercase opacity-70">
      <CMSText page={PAGE} section={rowKey} contentKey="duration" fallback={duration} as="span" />
    </td>
    <td className="py-3 align-top font-cb-mono text-[10px] tracking-[0.2em] uppercase opacity-70">
      <CMSText page={PAGE} section={rowKey} contentKey="type" fallback={type} as="span" />
    </td>
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
      cmsPage={PAGE}
    >
      <div className="space-y-10 font-cb-sans text-base leading-relaxed">
        <section>
          <CMSText page={PAGE} section="status" contentKey="title" fallback="Your current setting" as="h2" className="font-serif text-2xl uppercase" />
          <p className="mt-3 opacity-85">
            {status === "accepted" && (
              <CMSText page={PAGE} section="status" contentKey="accepted" fallback="You have accepted all cookies, including analytics and embeds." as="span" />
            )}
            {status === "rejected" && (
              <CMSText page={PAGE} section="status" contentKey="rejected" fallback="You have rejected non-essential cookies. Only essential ones are active." as="span" />
            )}
            {status === null && (
              <CMSText page={PAGE} section="status" contentKey="none" fallback="You have not yet made a choice. The banner will appear at the bottom of the screen." as="span" />
            )}
          </p>
          <button
            type="button"
            onClick={openCookiePreferences}
            className="mt-4 inline-block border border-foreground px-6 py-3 font-cb-mono text-[10px] tracking-[0.4em] uppercase hover:bg-foreground hover:text-background transition-colors"
          >
            <CMSText page={PAGE} section="status" contentKey="button" fallback="Manage preferences" as="span" />
          </button>
        </section>

        <section>
          <CMSText page={PAGE} section="what" contentKey="title" fallback="What are cookies?" as="h2" className="font-serif text-2xl uppercase" />
          <CMSText
            page={PAGE}
            section="what"
            contentKey="body"
            fallback="Cookies are small text files placed on your device when you visit a website. They help sites remember you, keep you signed in, and measure how the site is used. Some cookies are essential; others help us improve things."
            as="p"
            className="mt-3 opacity-85"
          />
        </section>

        <section>
          <CMSText page={PAGE} section="cats" contentKey="title" fallback="Categories we use" as="h2" className="font-serif text-2xl uppercase" />

          <div className="mt-6 space-y-8">
            <div>
              <CMSText page={PAGE} section="essential" contentKey="label" fallback="Essential" as="p" className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-70" />
              <CMSText
                page={PAGE}
                section="essential"
                contentKey="body"
                fallback="Required for the site to work — sign-in, security, booking sessions. Always on. Cannot be disabled."
                as="p"
                className="mt-2 opacity-85"
              />
              <table className="mt-3 w-full text-left">
                <tbody>
                  <Row rowKey="row-sb-auth" name="sb-auth" purpose="Sign-in session for the Bear's Den" duration="30 days" type="Essential" />
                  <Row rowKey="row-consent" name="cb-cookie-consent" purpose="Records your cookie choice" duration="1 year" type="Essential" />
                </tbody>
              </table>
            </div>

            <div>
              <CMSText page={PAGE} section="analytics" contentKey="label" fallback="Analytics" as="p" className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-70" />
              <CMSText
                page={PAGE}
                section="analytics"
                contentKey="body"
                fallback="Helps us understand which pages people read and what works. Only set if you accept."
                as="p"
                className="mt-2 opacity-85"
              />
              <table className="mt-3 w-full text-left">
                <tbody>
                  <Row rowKey="row-ga" name="_ga" purpose="Distinguishes anonymous visitors" duration="2 years" type="Analytics" />
                  <Row rowKey="row-gid" name="_gid" purpose="Distinguishes sessions" duration="24 hours" type="Analytics" />
                </tbody>
              </table>
            </div>

            <div>
              <CMSText page={PAGE} section="embed" contentKey="label" fallback="Embedded media" as="p" className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-70" />
              <CMSText
                page={PAGE}
                section="embed"
                contentKey="body"
                fallback="Spotify, YouTube, Instagram, TikTok. These set their own cookies when an embed loads. Only loaded if you accept."
                as="p"
                className="mt-2 opacity-85"
              />
              <table className="mt-3 w-full text-left">
                <tbody>
                  <Row rowKey="row-sp" name="sp_*" purpose="Spotify playlist embeds" duration="varies" type="Third party" />
                  <Row rowKey="row-yt" name="VISITOR_INFO1_LIVE" purpose="YouTube video embeds" duration="6 months" type="Third party" />
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <CMSText page={PAGE} section="change" contentKey="title" fallback="Changing your mind" as="h2" className="font-serif text-2xl uppercase" />
          <CMSText
            page={PAGE}
            section="change"
            contentKey="body"
            fallback="You can reopen the cookie banner using the button at the top of this page, or by clearing site data in your browser. We honour your latest choice for as long as the preference cookie is set."
            as="p"
            className="mt-3 opacity-85"
          />
          <CMSText
            page={PAGE}
            section="change"
            contentKey="updated"
            fallback="Last updated: May 2026"
            as="p"
            className="mt-6 font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60"
          />
        </section>
      </div>
    </CBStaticPage>
  );
};

export default Cookies;
