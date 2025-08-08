import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Copy as CopyIcon, Download as DownloadIcon } from "lucide-react";
import { getAllHeroImageUrls } from "@/data/heroImages";

const LOGO_URL = "/lovable-uploads/b1cbbce2-0748-4b16-8e27-eb9284992e55.png";

interface ColorToken {
  name: string;
  var: string; // CSS variable name e.g. --primary
  foregroundVar?: string; // optional contrasting text var
}

const colorTokens: ColorToken[] = [
  { name: "Primary", var: "--primary", foregroundVar: "--primary-foreground" },
  { name: "Secondary", var: "--secondary", foregroundVar: "--secondary-foreground" },
  { name: "Accent Pink", var: "--accent-pink" },
  { name: "Blood Red", var: "--accent-blood-red" },
  { name: "Vivid Purple", var: "--accent-vivid-purple" },
  { name: "Sage Green", var: "--accent-sage-green" },
  { name: "Background", var: "--background" },
  { name: "Foreground", var: "--foreground" },
  { name: "Border", var: "--border" },
  { name: "Muted", var: "--muted" },
  { name: "Ring", var: "--ring" },
];

const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="container mx-auto max-w-6xl px-6 py-10 animate-fade-in">
    <header className="mb-6">
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h2>
    </header>
    <div className="grid gap-6">{children}</div>
  </section>
);

const ApprovedImageryGrid = () => {
  const urls = getAllHeroImageUrls();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {urls.map((src, i) => (
        <figure key={src} className="group relative border border-border overflow-hidden bg-surface">
          <img src={src} alt={`Approved imagery ${i + 1}`} loading="lazy" className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          <figcaption className="absolute inset-0 flex items-end justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-background/70 to-transparent">
            <span className="text-xs text-foreground/90">Approved image {i + 1}</span>
            <a href={src} download>
              <Button size="sm" variant="secondary"><DownloadIcon className="mr-1 h-4 w-4" />Download</Button>
            </a>
          </figcaption>
        </figure>
      ))}
    </div>
  );
};

const CopyButton = ({ label, value, className }: { label?: string; value: string; className?: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("hover-scale", className)}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      aria-label={label ?? "Copy to clipboard"}
    >
      <CopyIcon className="mr-1 h-4 w-4" /> {copied ? "Copied" : label ?? "Copy"}
    </Button>
  );
};

const Branding = () => {
  // SEO and meta tags
  useEffect(() => {
    document.title = "Croft Common Brand Book – Branding & Design";
    const metaDesc = document.querySelector('meta[name="description"]');
    const robots = document.querySelector('meta[name="robots"]');
    const canonical = document.querySelector('link[rel="canonical"]');

    const descContent = "Croft Common brand book: logos, colors, typography, tone of voice, and usage guidelines.";

    if (metaDesc) metaDesc.setAttribute("content", descContent);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = descContent;
      document.head.appendChild(m);
    }

    if (robots) robots.setAttribute("content", "noindex, nofollow");
    else {
      const m = document.createElement("meta");
      m.name = "robots";
      m.content = "noindex, nofollow";
      document.head.appendChild(m);
    }

    if (canonical) canonical.setAttribute("href", window.location.href);
    else {
      const l = document.createElement("link");
      l.rel = "canonical";
      l.href = window.location.href;
      document.head.appendChild(l);
    }
  }, []);

  const computed = useMemo(() => getComputedStyle(document.documentElement), []);
  const getHsl = (cssVar: string) => computed.getPropertyValue(cssVar).trim();

  const toneOfVoiceBlocks = [
    {
      title: "The Voice",
      body:
        "Confident. Understated. Rooted. We don’t shout. We don’t sell. We speak like we mean it. Every word should feel considered, minimal, and grounded in the real world — like the space itself.\n\nWe avoid fluff, filler, or buzzwords. Instead, we lean on rhythm, brevity, and weight. Our voice is shaped by our place — Stokes Croft — and by our values: real hospitality, community built quietly, and doing things properly.",
    },
    {
      title: "Writing Style",
      list: [
        "Short sentences. Two words is fine. So is one.",
        "Use structure and rhythm instead of decoration.",
        "Let silence do some of the talking — not everything needs explaining.",
        "Honour the reader’s intelligence — don’t oversell or overexplain.",
        "Keep it conversational, not casual.",
        "Use specificity over hype. ‘Charred corn, lime mayo’ > ‘Delicious sides’.",
      ],
    },
  ];

  const fonts = [
    { key: "brutalist", name: "Oswald", label: "Display – Oswald", className: "font-brutalist", stack: "'Oswald', 'Arial Black', Helvetica, sans-serif", weights: ["400 Regular", "500 Medium", "600 Semibold", "700 Bold"] },
    { key: "industrial", name: "Work Sans", label: "Body – Work Sans", className: "font-industrial", stack: "'Work Sans', Arial, Helvetica, sans-serif", weights: ["300 Light", "400 Regular", "500 Medium", "600 Semibold"] },
  ];

  return (
    <>
      <header className="border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={LOGO_URL} alt="Croft Common logo" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-xl md:text-2xl font-semibold leading-tight">Croft Common Brand Book</h1>
              <p className="text-sm text-muted-foreground">Brand, design, and voice guidelines</p>
            </div>
          </div>
          <div className="hidden md:flex gap-2">
            <a href={LOGO_URL} download>
              <Button variant="secondary" size="sm"><DownloadIcon className="mr-1 h-4 w-4" /> Download Logo</Button>
            </a>
          </div>
        </div>
      </header>

      <main className="bg-background">
        {/* Logos */}
        <Section id="logos" title="Logo & Watermark">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <figure className="p-6 border border-border bg-card/30 transition-transform hover:scale-[1.01]">
              <img src={LOGO_URL} alt="Croft Common logo" className="w-full h-40 object-contain" loading="lazy" />
              <figcaption className="mt-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">Primary Logo</p>
                  <p className="text-sm text-muted-foreground">PNG, transparent</p>
                </div>
                <a href={LOGO_URL} download>
                  <Button variant="outline" size="sm"><DownloadIcon className="mr-1 h-4 w-4" /> Download</Button>
                </a>
              </figcaption>
            </figure>

            <figure className="p-6 border border-border bg-card/30 transition-transform hover:scale-[1.01]">
              <div className="relative h-40 overflow-hidden border border-border">
                <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, hsl(var(--background)), hsl(var(--surface)))" }} />
                <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 opacity-30 hover:opacity-70">
                  <img src={LOGO_URL} alt="Watermark demonstration" className="h-32 w-32 object-contain" />
                </div>
              </div>
              <figcaption className="mt-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">Watermark Demonstration</p>
                  <p className="text-sm text-muted-foreground">30% opacity steady; 70% on hover</p>
                </div>
                <CopyButton value="Use watermark at 30% opacity; hover to ~70% for emphasis." label="Copy note" />
              </figcaption>
            </figure>
          </div>
        </Section>

        {/* Colors */}
        <Section id="colors" title="Color System">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {colorTokens.map((c) => {
              const hsl = getHsl(c.var);
              const fg = c.foregroundVar ? getHsl(c.foregroundVar) : undefined;
              return (
                <div key={c.name} className="border border-border">
                  <div
                    className="h-28 flex items-end p-4"
                    style={{ backgroundColor: `hsl(${hsl})`, color: fg ? `hsl(${fg})` : undefined }}
                  >
                    <span className="text-sm font-medium">{c.name}</span>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="text-sm">
                      <p className="font-medium">{c.var}</p>
                      <p className="text-muted-foreground">hsl({hsl || "…"})</p>
                    </div>
                    <div className="flex gap-2">
                      <CopyButton value={`${c.var}`} label="Copy var" />
                      <CopyButton value={`hsl(var(${c.var}))`} label="Copy HSL" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section id="typography" title="Typography">
          <div className="grid gap-6">
            {fonts.map((f) => (
              <div key={f.key} className="border border-border p-6 transition-transform hover:scale-[1.01]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{f.name}</p>
                    <h3 className={cn(f.className, "text-2xl md:text-4xl leading-tight")}>Croft Common</h3>
                    
                  </div>
                  <CopyButton value={`font-family: ${f.stack};`} label="Copy stack" />
                </div>
                <div className={cn(f.className, "mt-5 space-y-2 text-base md:text-lg leading-relaxed") }>
                  <p>ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                  <p>abcdefghijklmnopqrstuvwxyz</p>
                  <p>0123456789</p>
                  <p>.,;:!?—–‘’“”@&()[]{}/*+-=#%</p>
                  <p className="mt-2 text-sm text-muted-foreground not-italic">The quick brown fox jumps over the lazy dog.</p>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">Weights: {f.weights.join(", ")}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Voice */}
        <Section id="voice" title="Tone of Voice">
          <div className="grid gap-6">
            {toneOfVoiceBlocks.map((b) => (
              <article key={b.title} className="border border-border p-6 bg-popover/10">
                <h3 className="text-lg font-semibold mb-3">{b.title}</h3>
                {b.body && (
                  <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base text-foreground/90">{b.body}</p>
                )}
                {Array.isArray(b.list) && (
                  <ul className="list-disc pl-5 space-y-1 text-sm md:text-base">
                    {b.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-4">
                  <CopyButton value={`${b.title}\n\n${b.body ?? b.list?.join("\n") ?? ""}`} label="Copy section" />
                </div>
              </article>
            ))}

            {/* Do / Don't examples */}
            <article className="border border-border p-6">
              <h3 className="text-lg font-semibold mb-4">Examples</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 border border-border">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Instead of</p>
                  <p className="mt-2 text-foreground/80">Join us for a night of delicious cocktails, live music, and good vibes!</p>
                </div>
                <div className="p-4 border border-border bg-muted/30">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Say</p>
                  <p className="mt-2 font-medium">Cocktails from five. Music from eight. Stay late.</p>
                </div>
                <div className="p-4 border border-border">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Instead of</p>
                  <p className="mt-2 text-foreground/80">We’re proud to support our local community with events and donations.</p>
                </div>
                <div className="p-4 border border-border bg-muted/30">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Say</p>
                  <p className="mt-2 font-medium">We’re here because of this place. So we give back.</p>
                </div>
              </div>
            </article>
          </div>
        </Section>

        {/* Components */}
        <Section id="components" title="Components & States">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-border p-6 space-y-3">
              <p className="text-sm text-muted-foreground">Buttons</p>
              <div className="flex flex-wrap gap-2">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
              <div className="pt-3">
                <CopyButton
                  value={`<Button>Default</Button>\n<Button variant=\"secondary\">Secondary</Button>\n<Button variant=\"outline\">Outline</Button>`}
                  label="Copy JSX"
                />
              </div>
            </div>

            <div className="border border-border p-6 space-y-3">
              <p className="text-sm text-muted-foreground">Watermark Guidance</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Use at 30% opacity over neutral surfaces; increase to ~70% on hover.</li>
                <li>Avoid placing over high-detail imagery unless contrast is clear.</li>
                <li>Prefer white on dark, black on light; test contrast.</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* Downloads */}
        <Section id="downloads" title="Downloads & Assets">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-border p-6 flex items-center justify-between">
              <div>
                <p className="font-medium">Logo (PNG)</p>
                <p className="text-sm text-muted-foreground">Transparent background</p>
              </div>
              <a href={LOGO_URL} download>
                <Button variant="secondary">Download</Button>
              </a>
            </div>
            <div className="border border-border p-6 flex items-center justify-between">
              <div>
                <p className="font-medium">CSS Variables (Copy)</p>
                <p className="text-sm text-muted-foreground">Design tokens – HSL values</p>
              </div>
              <CopyButton
                label="Copy tokens"
                value={JSON.stringify(
                  Object.fromEntries(colorTokens.map((t) => [t.name, `hsl(${getHsl(t.var)})`])),
                  null,
                  2
                )}
              />
            </div>
          </div>
        </Section>

        <Section id="approved-imagery" title="Approved Imagery">
          <ApprovedImageryGrid />
        </Section>
       </main>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto max-w-6xl px-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Croft Common — Internal brand book</p>
          <a href="#logos" className="story-link text-sm">Back to top</a>
        </div>
      </footer>
    </>
  );
};

export default Branding;
