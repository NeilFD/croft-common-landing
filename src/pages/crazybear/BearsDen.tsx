import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import bearMark from '@/assets/crazy-bear-mark.png';
import CBTopNav from '@/components/crazybear/CBTopNav';

const tiles: { title: string; sub: string; to: string }[] = [
  { title: 'Diary', sub: 'What is on, when', to: '/bears-den' },
  { title: 'Tables', sub: 'Reserve, quietly', to: '/bears-den' },
  { title: 'Rooms', sub: 'Stay over', to: '/bears-den' },
  { title: 'Cellar', sub: 'Members only pours', to: '/bears-den' },
];

const BearsDen = () => {
  return (
    <>
      <Helmet>
        <title>The Bear's Den | The Crazy Bear</title>
        <meta name="description" content="A quiet members' room at The Crazy Bear. Town and Country." />
      </Helmet>

      <main className="min-h-screen bg-black text-white font-cb-sans">
        <CBTopNav tone="light" />
        <section className="px-6 pt-32 pb-24 max-w-5xl mx-auto text-center">
          <img src={bearMark} alt="" className="h-16 w-auto mx-auto invert opacity-90" />
          <h1 className="mt-6 font-display uppercase text-5xl md:text-7xl tracking-tight">
            The Bear's Den
          </h1>
          <p className="mt-5 font-cb-mono text-[10px] md:text-xs tracking-[0.5em] uppercase opacity-70">
            Members &nbsp;/&nbsp; Quiet entrance
          </p>
          <p className="mt-8 font-cb-sans text-lg md:text-xl opacity-80 max-w-2xl mx-auto">
            Welcome in. Pull the door shut behind you. Here is what the bear keeps for the circle.
          </p>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-px bg-white/15">
            {tiles.map((t) => (
              <Link
                key={t.title}
                to={t.to}
                className="group bg-black p-10 md:p-14 text-left hover:bg-white/[0.04] transition-colors"
              >
                <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">
                  {t.sub}
                </p>
                <p className="mt-3 font-display uppercase text-3xl md:text-4xl tracking-tight">
                  {t.title}
                </p>
                <span className="mt-6 inline-block font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 group-hover:opacity-100">
                  Enter &rarr;
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
};

export default BearsDen;
