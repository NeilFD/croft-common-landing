import { CBSeo } from "@/components/seo/CBSeo";
import { goldProductSchema, organizationSchema } from "@/components/seo/CBStructuredData";
import { Link } from 'react-router-dom';
import bearMark from '@/assets/crazy-bear-mark.png';
import CBTopNav from '@/components/crazybear/CBTopNav';
import CBHeroBackdrop from '@/components/crazybear/CBHeroBackdrop';
import { CMSText } from '@/components/cms/CMSText';

const PAGE = "bears-den";

const tiles: { id: string; title: string; sub: string; to: string }[] = [
  { id: 'diary', title: 'Diary', sub: 'What is on, when', to: '/bears-den' },
  { id: 'tables', title: 'Tables', sub: 'Reserve, quietly', to: '/bears-den' },
  { id: 'rooms', title: 'Rooms', sub: 'Stay over', to: '/bears-den' },
  { id: 'cellar', title: 'Cellar', sub: 'Members only pours', to: '/bears-den' },
];

const BearsDen = () => {
  return (
    <>
      <CBSeo
        title="The Bear's Den | The Crazy Bear"
        description="A quiet members' room at The Crazy Bear. Town and Country."
        path="/bears-den"
        jsonLd={[goldProductSchema(), organizationSchema()]}
      />

      <main className="min-h-screen bg-black text-white font-cb-sans">
        <div className="relative overflow-hidden">
          <CBHeroBackdrop page={PAGE} overlayClassName="bg-black/65" />
          <CBTopNav tone="light" />
          <div className="relative z-10">
            <section className="px-6 pt-32 pb-24 max-w-5xl mx-auto text-center">
              <img src={bearMark} alt="" className="h-16 w-auto mx-auto invert opacity-90" />
          <CMSText
            page={PAGE}
            section="hero"
            contentKey="title"
            fallback="The Bear's Den"
            as="h1"
            className="mt-6 font-display uppercase text-5xl md:text-7xl tracking-tight"
          />
          <CMSText
            page={PAGE}
            section="hero"
            contentKey="eyebrow"
            fallback="Members / Quiet entrance"
            as="p"
            className="mt-5 font-cb-mono text-[10px] md:text-xs tracking-[0.5em] uppercase opacity-70"
          />
          <CMSText
            page={PAGE}
            section="hero"
            contentKey="intro"
            fallback="Welcome in. Pull the door shut behind you. Here is what the bear keeps for the circle."
            as="p"
            className="mt-8 font-cb-sans text-lg md:text-xl opacity-80 max-w-2xl mx-auto"
          />

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-px bg-white/15">
            {tiles.map((t) => (
              <Link
                key={t.id}
                to={t.to}
                className="group bg-black p-10 md:p-14 text-left hover:bg-white/[0.04] transition-colors"
              >
                <CMSText
                  page={PAGE}
                  section={`tile-${t.id}`}
                  contentKey="sub"
                  fallback={t.sub}
                  as="p"
                  className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60"
                />
                <CMSText
                  page={PAGE}
                  section={`tile-${t.id}`}
                  contentKey="title"
                  fallback={t.title}
                  as="p"
                  className="mt-3 font-display uppercase text-3xl md:text-4xl tracking-tight"
                />
                <span className="mt-6 inline-block font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 group-hover:opacity-100">
                  Enter &rarr;
                </span>
              </Link>
            ))}
          </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
};

export default BearsDen;
