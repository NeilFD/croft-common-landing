import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CBStaticPage from "@/components/crazybear/CBStaticPage";
import { cbFaqs } from "@/data/cbFaqs";

interface FaqRow {
  question: string;
  answer: string;
  source: string; // page slug like "/country/rooms"
}

/** Map page slugs to a friendly group label. */
const groupFor = (slug: string): string => {
  if (slug.includes("rooms") || slug.includes("pool") || slug.includes("/town") && !slug.includes("/food")) {
    if (slug.includes("rooms") || slug === "/town" || slug === "/country" || slug.endsWith("/pool")) return "Stay";
  }
  if (slug.includes("food") || slug.includes("pub") || slug.includes("drink") || slug.includes("bar")) return "Eat & Drink";
  if (slug.includes("events") || slug.includes("parties") || slug.includes("birthdays") || slug.includes("weddings") || slug.includes("karaoke") || slug.includes("pool-party")) return "Celebrate";
  if (slug.includes("members") || slug.includes("gold") || slug.includes("bears-den") || slug.includes("curious")) return "Membership";
  if (slug.includes("culture") || slug.includes("playlist") || slug.includes("stories") || slug.includes("about") || slug.includes("house-rules")) return "Discover";
  return "Practical";
};

const FAQHub = () => {
  const [q, setQ] = useState("");

  const grouped = useMemo(() => {
    const rows: FaqRow[] = [];
    for (const [source, entry] of Object.entries(cbFaqs)) {
      for (const f of entry.faqs) rows.push({ question: f.question, answer: f.answer, source });
    }
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? rows.filter((r) => r.question.toLowerCase().includes(needle) || r.answer.toLowerCase().includes(needle))
      : rows;
    const groups: Record<string, FaqRow[]> = {};
    for (const r of filtered) {
      const g = groupFor(r.source);
      (groups[g] ??= []).push(r);
    }
    return groups;
  }, [q]);

  const order = ["Stay", "Eat & Drink", "Celebrate", "Discover", "Membership", "Practical"];

  return (
    <CBStaticPage
      title="FAQ"
      intro={"Every question we've been asked.\nAll in one place. Use the search."}
      seoDescription="FAQs for The Crazy Bear: rooms, food, parties, weddings, membership and practical questions across Town and Country."
      path="/faq"
    >
      <div className="mb-10">
        <label className="sr-only" htmlFor="faq-search">Search</label>
        <input
          id="faq-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search the FAQs…"
          className="w-full border border-foreground/30 bg-transparent px-4 py-4 font-cb-sans text-lg placeholder:opacity-50 focus:outline-none focus:border-foreground"
        />
      </div>

      <div className="space-y-12">
        {order.map((g) => {
          const items = grouped[g];
          if (!items || items.length === 0) return null;
          return (
            <section key={g}>
              <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-70">{g}</p>
              <ul className="mt-4 divide-y divide-foreground/15 border-t border-b border-foreground/15">
                {items.map((r, i) => (
                  <li key={`${g}-${i}`} className="py-5">
                    <details className="group">
                      <summary className="cursor-pointer list-none font-serif text-xl uppercase flex items-start justify-between gap-4">
                        <span>{r.q}</span>
                        <span className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 mt-1 shrink-0 group-open:rotate-45 transition-transform">+</span>
                      </summary>
                      <p className="mt-3 font-cb-sans text-base opacity-85 leading-relaxed">{r.a}</p>
                      <Link
                        to={r.source}
                        className="mt-3 inline-block font-cb-mono text-[9px] tracking-[0.4em] uppercase opacity-60 hover:opacity-100 underline-offset-4 hover:underline"
                      >
                        From {r.source}
                      </Link>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        {Object.keys(grouped).length === 0 && (
          <p className="text-center font-cb-sans text-lg opacity-70">
            Nothing matched. Try a different word, or <Link to="/contact" className="underline underline-offset-4">ask us directly</Link>.
          </p>
        )}
      </div>
    </CBStaticPage>
  );
};

export default FAQHub;
