import CBStaticPage from "@/components/crazybear/CBStaticPage";

interface Item {
  name: string;
  price: string;
  blurb: string;
}

const MERCH: Item[] = [
  { name: "Bear Tee", price: "£35", blurb: "Heavyweight cotton. Mark on the chest, mischief on the back." },
  { name: "Hoodie", price: "£75", blurb: "Brushed back. Bear print. The one you'll never give back." },
  { name: "Tote", price: "£18", blurb: "Carry your books, your wine, your secrets." },
  { name: "Enamel Mug", price: "£14", blurb: "Camp-fire ready. Crazy Bear stamped." },
  { name: "Candle", price: "£32", blurb: "Smoke, cedar, late nights. Burns for forty hours." },
  { name: "House Gin", price: "£42", blurb: "Distilled for the bar. Bottled for you." },
  { name: "Cap", price: "£28", blurb: "Six-panel, washed cotton. Bear patch front and centre." },
  { name: "Robe", price: "£120", blurb: "The bedroom robe. Wear it home." },
  { name: "Print Set", price: "£45", blurb: "Three signed prints. Pulled in small runs." },
];

const Merch = () => (
  <CBStaticPage
    title="Merch"
    intro={"Bits and pieces you'll want at home.\nGrab them in venue, or enquire to ship."}
    seoDescription="Crazy Bear merch. Tees, hoodies, candles, mugs and house spirits. Available in venue at Town and Country."
    path="/merch"
  >
    <ul className="grid grid-cols-2 md:grid-cols-3 gap-6">
      {MERCH.map((item) => (
        <li key={item.name} className="border border-foreground/15 p-5 flex flex-col">
          <div className="aspect-square bg-foreground/5 mb-4" aria-hidden="true" />
          <p className="font-serif text-xl uppercase">{item.name}</p>
          <p className="mt-1 font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-70">{item.price}</p>
          <p className="mt-3 font-cb-sans text-sm opacity-80 flex-1">{item.blurb}</p>
          <p className="mt-4 font-cb-mono text-[9px] tracking-[0.4em] uppercase opacity-60">Available in venue</p>
        </li>
      ))}
    </ul>
    <div className="text-center pt-12">
      <a
        href="/enquire"
        className="inline-block border border-foreground px-8 py-4 font-cb-mono text-[10px] tracking-[0.4em] uppercase hover:bg-foreground hover:text-background transition-colors"
      >
        Enquire to ship
      </a>
    </div>
  </CBStaticPage>
);

export default Merch;
