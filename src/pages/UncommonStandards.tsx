import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { EnhancedMetaTags } from "@/components/SEO/EnhancedMetaTags";

const UncommonStandards = () => {
  return (
    <div className="min-h-screen">
      <EnhancedMetaTags
        title="Croft Common - Uncommon Standards"
        description="We believe hospitality should never hide behind slogans. It should be lived, every shift, every guest, every moment. Here are the standards we hold ourselves to."
        keywords={["hospitality standards", "Croft Common values", "restaurant standards", "uncommon hospitality"]}
        url="https://croftcommon.com/uncommon-standards"
        type="website"
      />
      
      <Navigation />
      
      <main className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <header className="text-left mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 whitespace-nowrap">
              Croft Common - Uncommon Standards
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed text-left">
              We believe hospitality should never hide behind slogans. It should be lived, every shift, every guest, every moment. So here are the standards we hold ourselves to, written as plainly as possible.
            </p>
          </header>

          <div className="space-y-12">
            <section className="bg-card rounded-lg p-8 border border-border">
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center">
                <span className="text-accent font-bold text-3xl mr-4">1.</span>
                It's a Vibe
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Hospitality is about feeling, not transactions. You will always leave remembering how we made you feel.
              </p>
            </section>

            <section className="bg-card rounded-lg p-8 border border-border">
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center">
                <span className="text-accent font-bold text-3xl mr-4">2.</span>
                We Back Each Other
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                A happy team means happy guests. If you see us looking out for one another, it's because we know that's how great hospitality begins.
              </p>
            </section>

            <section className="bg-card rounded-lg p-8 border border-border">
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center">
                <span className="text-accent font-bold text-3xl mr-4">3.</span>
                Only Ever Our Best
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Nothing leaves our hands unless we're proud of it. If it's not right, it doesn't go. Simple as that.
              </p>
            </section>

            <section className="bg-card rounded-lg p-8 border border-border">
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center">
                <span className="text-accent font-bold text-3xl mr-4">4.</span>
                Own the Atmosphere
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Lighting, music, energy, detail - we all take responsibility for the feel of the room. If something feels off, we'll fix it before you notice.
              </p>
            </section>

            <section className="bg-card rounded-lg p-8 border border-border">
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center">
                <span className="text-accent font-bold text-3xl mr-4">5.</span>
                5% More
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                The extra you weren't expecting. A little surprise. A touch of generosity. That's the part you'll remember.
              </p>
            </section>
          </div>

          <div className="mt-16 bg-accent/10 rounded-lg p-8 border border-accent/20">
            <p className="text-lg text-foreground font-medium mb-4">
              This is Uncommon Hospitality. It's our standard.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              If you ever feel we fall short, tell us. We mean it when we say we want you to hold us to account.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Croft Common is not just a place to eat or drink. It's somewhere to feel welcome, connected, and part of something bigger.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default UncommonStandards;