import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CroftLogo from "@/components/CroftLogo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface SecretKitchensModalProps {
  open: boolean;
  onClose: () => void;
}

const Separator = () => (
  <div className="my-5 text-center select-none" aria-hidden="true">
    <span className="text-foreground/60">⸻</span>
  </div>
);

const SecretKitchensModal: React.FC<SecretKitchensModalProps> = ({ open, onClose }) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) {
      // Ensure we start at the top with no lingering text selection
      try { window.getSelection()?.removeAllRanges(); } catch {}
      contentRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [open]);

  type RecipeId =
    | 'cover'
    | 'sourdough'
    | 'margherita'
    | 'hot-honey-goat'
    | 'nduja-ricotta'
    | 'anchovy-olive-caper'
    | 'mushroom-sage-taleggio'
    | 'cauliflower'
    | 'porchetta'
    | 'chicken-thighs'
    | 'salmon-dill'
    | 'maple-pork-belly'
    | 'charred-corn'
    | 'roast-potatoes'
    | 'flatbread'
    | 'tenderstem'
    | 'leek-slaw'
    | 'beetroot-labneh';

  const [activeId, setActiveId] = React.useState<RecipeId>('cover');

  const pizzaItems: { id: RecipeId; title: string }[] = [
    { id: 'sourdough', title: 'COMMON SOURDOUGH PIZZA DOUGH' },
    { id: 'margherita', title: 'MARGHERITA' },
    { id: 'hot-honey-goat', title: 'HOT HONEY & GOAT CHEESE' },
    { id: 'nduja-ricotta', title: 'NDUJA & RICOTTA' },
    { id: 'anchovy-olive-caper', title: 'ANCHOVY, OLIVE, CAPER' },
    { id: 'mushroom-sage-taleggio', title: 'MUSHROOM, SAGE, TALEGGIO' },
  ];

  const mainsItems: { id: RecipeId; title: string }[] = [
    { id: 'cauliflower', title: 'WHOLE CAULIFLOWER, HARISSA & TAHINI' },
    { id: 'porchetta', title: 'PORCHETTA ROLL, SAGE APRICOTS' },
    { id: 'chicken-thighs', title: 'WOOD-ROASTED CHICKEN THIGHS, HERBS' },
    { id: 'salmon-dill', title: 'SMOKED SALMON FILLET, DILL CREAM' },
    { id: 'maple-pork-belly', title: 'MAPLE PORK BELLY, APPLE SLAW' },
    { id: 'charred-corn', title: 'CHARRED CORN, LIME MAYO' },
  ];

  const sidesItems: { id: RecipeId; title: string }[] = [
    { id: 'roast-potatoes', title: 'WOOD-FIRED ROAST POTATOES, GARLIC BUTTER' },
    { id: 'flatbread', title: 'FLATBREAD, OLIVE OIL & SALT' },
    { id: 'tenderstem', title: 'GRILLED TENDERSTEM, SESAME & CHILLI' },
    { id: 'leek-slaw', title: 'BURNT LEEK & HERB SLAW' },
    { id: 'beetroot-labneh', title: 'EMBER-BAKED BEETROOT, LABNEH' },
  ];

  React.useEffect(() => {
    // Scroll to top when switching pages
    contentRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeId]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        ref={contentRef}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="w-[92vw] sm:w-[86vw] md:max-w-3xl lg:max-w-5xl xl:max-w-6xl max-h-[85vh] overflow-y-auto border border-border bg-background"
      >
        <div className="space-y-6">
          {/* Brand + Back */}
          <div className="flex items-center gap-4">
            {activeId !== 'cover' && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setActiveId('cover')}
                aria-label="Back to cover"
                className="border-none bg-transparent hover:bg-transparent focus-visible:ring-0 text-[hsl(var(--accent-pink))] hover:text-[hsl(var(--accent-pink))]"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <CroftLogo className="w-10 h-10" />
            <span className="font-brutalist text-foreground tracking-wider text-xl md:text-2xl leading-none">CROFT COMMON</span>
          </div>


          {/* Layout */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
            {/* Main content */}
            <article className="space-y-4">
              {activeId === 'cover' && (
                <div className="flex flex-col items-center text-center py-8 select-none">
                  <CroftLogo size="lg" className="w-20 h-20 md:w-24 md:h-24" />
                  <div className="h-6" aria-hidden="true" />
                  <h3 className="font-brutalist text-foreground text-4xl md:text-5xl tracking-wider">Common Cook Book</h3>
                  <p className="font-industrial text-foreground/80 mt-2">Wood. Fire. Dough. Good Taste</p>
                </div>
              )}

              {activeId === 'sourdough' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">COMMON SOURDOUGH PIZZA DOUGH</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 6 pizzas</p>
                    <p>Time: 24 hours if you respect it, 6 if you don’t</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Chewy in the middle. Charred at the edge. A base that holds its own without stealing the show. Built for heat, whether it’s a backyard fire or your kitchen oven.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You’ll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1kg strong white bread flour</li>
                      <li>700ml cold water</li>
                      <li>25g salt</li>
                      <li>20g olive oil</li>
                      <li>200g active sourdough starter (or 7g dried yeast if you’re cheating)</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Day Before</h4>
                    <ol className="font-industrial text-foreground/90 leading-relaxed list-decimal pl-5 space-y-1">
                      <li>Mix – Flour, water, starter. Leave salt out for now. Bring together into a rough dough. Rest 30 mins.</li>
                      <li>Salt & Oil – Add salt and oil. Knead for 8–10 mins until smooth.</li>
                      <li>Bulk – Cover and leave at room temp for 4 hours, folding the dough over itself every hour.</li>
                      <li>Shape – Split into 250g balls. Flour lightly, store in a covered container, fridge overnight.</li>
                    </ol>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Bring dough to room temp for an hour. Preheat oven to max (250°C) with a pizza stone or baking tray inside for at least 45 mins. Stretch by hand to keep the air in the crust. Bake 5–7 mins until golden and blistered.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten</p>
                </div>
              )}

              {activeId === 'margherita' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">MARGHERITA</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 1</p>
                    <p>Time: 10 mins once dough’s ready</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Tomato. Mozzarella. Basil. The blueprint.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You’ll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1 dough ball</li>
                      <li>80g passata mixed with olive oil and salt</li>
                      <li>100g fresh mozzarella, torn</li>
                      <li>4 basil leaves</li>
                      <li>Olive oil</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Stretch dough. Spread sauce evenly, leaving a 2cm edge. Scatter mozzarella, lay basil leaves on top. Bake on preheated stone for 6–8 mins until crust is spotted and cheese is bubbling. Drizzle oil to finish.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten, milk</p>
                </div>
              )}

              {activeId === 'hot-honey-goat' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider text-center">HOT HONEY & GOAT CHEESE</h3>
                  <p className="font-industrial text-foreground/80 text-center">Sweet, sharp, heat.</p>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You’ll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1 dough ball</li>
                      <li>80g passata</li>
                      <li>80g soft goat cheese</li>
                      <li>40g mozzarella</li>
                      <li>Hot honey (chilli-infused)</li>
                      <li>1 red chilli, sliced thin</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Stretch dough. Spread passata, top with mozzarella and chilli slices. Bake until crust is golden. Crumble goat cheese on top straight from the oven and drizzle with hot honey.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten, milk</p>
                </div>
              )}

              {activeId === 'nduja-ricotta' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">NDUJA & RICOTTA</h3>
                  <p className="font-industrial text-foreground/80">Fire and cream.</p>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You’ll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1 dough ball</li>
                      <li>80g passata</li>
                      <li>60g nduja</li>
                      <li>60g ricotta</li>
                      <li>40g mozzarella</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Stretch dough, spread passata, scatter mozzarella and nduja. Bake until crust blisters. Add spoonfuls of ricotta after baking so it stays cool against the heat.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten, milk</p>
                </div>
              )}

              {activeId === 'anchovy-olive-caper' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">ANCHOVY, OLIVE, CAPER</h3>
                  <p className="font-industrial text-foreground/80">Salt and bite.</p>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You’ll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1 dough ball</li>
                      <li>80g passata</li>
                      <li>6 anchovy fillets</li>
                      <li>40g black olives, halved</li>
                      <li>20g capers</li>
                      <li>40g mozzarella</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Stretch dough, spread passata, add mozzarella, anchovies, olives and capers all at once. Bake until crust is crisp and toppings are sizzling.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten, milk, fish</p>
                </div>
              )}

              {activeId === 'mushroom-sage-taleggio' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">MUSHROOM, SAGE, TALEGGIO</h3>
                  <p className="font-industrial text-foreground/80">Earth and melt.</p>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You’ll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1 dough ball</li>
                      <li>100g mixed mushrooms, sliced</li>
                      <li>80g Taleggio, torn</li>
                      <li>4 sage leaves</li>
                      <li>Olive oil</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Pan-fry mushrooms in olive oil until golden. Stretch dough, brush base with oil (no tomato). Scatter mushrooms, cheese, and sage. Bake until edges are brown and cheese has pooled.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten, milk</p>
                </div>
              )}

              {activeId === 'cauliflower' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">WHOLE CAULIFLOWER, HARISSA & TAHINI</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 1.5 hours</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You’ll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1 whole cauliflower</li>
                      <li>3 tbsp rose harissa</li>
                      <li>3 tbsp olive oil</li>
                      <li>100g tahini</li>
                      <li>Juice of 1 lemon</li>
                      <li>Salt</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Preheat oven to 200°C. Remove cauliflower leaves, trim stalk slightly. Mix harissa, oil, and salt, rub all over. Wrap in foil, roast 1 hour until tender. Unwrap and roast another 15 mins for char. Whisk tahini, lemon juice, pinch of salt and water until pourable. Slice cauliflower, spoon sauce over.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: sesame</p>
                </div>
              )}

              {activeId === 'porchetta' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">PORCHETTA ROLL, SAGE APRICOTS</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves 6 hungry people</p>
                    <p>Two days if you’ve got them. Four hours if you don’t.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Pork that falls when you touch it. Skin that shatters. Sage for the ground. Apricots for the lift. All in a soft roll that barely holds it together.</p>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-brutalist text-foreground tracking-wider">You’ll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>2kg boneless pork belly, skin on</li>
                      <li>Sea salt — the good kind</li>
                      <li>Black pepper, cracked fresh</li>
                      <li>1 bunch sage, leaves only</li>
                      <li>6 garlic cloves, smashed</li>
                      <li>Zest of 1 lemon</li>
                      <li>Olive oil</li>
                      <li>200g dried apricots, chopped</li>
                      <li>100ml white wine</li>
                      <li>6 soft white rolls</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Day Before</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Score the skin fine. Salt deep. Flip it. Pepper, lemon zest, chopped sage, garlic — work it into the meat. Wrap. Chill overnight. Let the salt get to work.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Oven to 150°C. Roll the belly tight, skin out. Tie it like you mean it. Rack over tin. Three hours until the meat sighs. While it goes, warm a pan. Olive oil. Apricots. Wine. Simmer to sticky — your quiet ace. Last half hour, oven to 230°C. Let the skin turn to glass.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">To Serve</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Slice thick. Stack into rolls. Apricots on top. No sides, unless it’s a pint.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten, milk</p>
                </div>
              )}

              {activeId === 'chicken-thighs' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">WOOD-ROASTED CHICKEN THIGHS, HERBS</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 50 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You’ll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>8 chicken thighs, bone-in, skin on</li>
                      <li>4 sprigs rosemary</li>
                      <li>4 sprigs thyme</li>
                      <li>4 garlic cloves, smashed</li>
                      <li>Olive oil, salt, pepper</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Preheat oven to 220°C. Toss chicken with herbs, garlic, oil, salt, pepper. Arrange skin side up on a baking tray. Roast 40–45 mins until skin is crisp and juices run clear. Rest 5 mins before serving.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: none</p>
                </div>
              )}

              {activeId === 'salmon-dill' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">SMOKED SALMON FILLET, DILL CREAM</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 25 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You’ll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>4 salmon fillets</li>
                      <li>Olive oil, salt, pepper</li>
                      <li>150g crème fraîche</li>
                      <li>Small bunch dill, chopped</li>
                      <li>Juice of 1 lemon</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Preheat oven to 200°C. Rub salmon with oil, season. Roast 12–15 mins until just opaque. Mix crème fraîche, dill, and lemon. Serve salmon hot with a spoonful of dill cream on top.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: fish, milk</p>
                </div>
              )}

              {activeId === 'maple-pork-belly' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">MAPLE PORK BELLY, APPLE SLAW</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 3 hours</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You’ll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1.5kg pork belly, scored</li>
                      <li>3 tbsp maple syrup</li>
                      <li>Salt, pepper</li>
                      <li>For slaw: ¼ cabbage, shredded; 1 apple, grated; 2 tbsp cider vinegar; pinch sugar</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Preheat oven to 150°C. Season pork belly generously. Roast on a rack 2.5 hrs until tender. Brush with maple syrup, raise heat to 230°C for 20 mins until skin crackles. Rest 10 mins. Toss slaw ingredients. Slice pork thick, serve with slaw.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: none</p>
                </div>
              )}

              {activeId === 'charred-corn' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">CHARRED CORN, LIME MAYO</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 15 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You’ll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>4 corn cobs</li>
                      <li>3 tbsp mayonnaise</li>
                      <li>Juice of 1 lime</li>
                      <li>Salt</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Preheat grill or griddle. Char corn on all sides until blistered. Mix mayo, lime juice, pinch of salt. Brush over hot corn. Sprinkle chilli powder if you like.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: egg (in mayo)</p>
                </div>
              )}

              {activeId === 'roast-potatoes' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">WOOD-FIRED ROAST POTATOES, GARLIC BUTTER</h3>
                  <p className="font-industrial text-foreground/90 leading-relaxed">Parboil 500g halved potatoes 8 mins. Drain, steam dry. Melt 50g butter with 2 crushed garlic cloves. Toss potatoes in butter, season. Roast at 200°C for 35–40 mins until crisp.</p>
                  <p className="font-industrial text-steel text-sm">Allergens: milk</p>
                </div>
              )}

              {activeId === 'flatbread' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">FLATBREAD, OLIVE OIL & SALT</h3>
                  <p className="font-industrial text-foreground/90 leading-relaxed">Use pizza dough, roll thin. Heat dry frying pan or hot oven tray. Cook 1–2 mins each side until spotted. Brush with oil, sprinkle with sea salt.</p>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten</p>
                </div>
              )}

              {activeId === 'tenderstem' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">GRILLED TENDERSTEM, SESAME & CHILLI</h3>
                  <p className="font-industrial text-foreground/90 leading-relaxed">Blanch 200g tenderstem broccoli 2 mins, drain. Heat griddle pan until smoking, char broccoli. Toss with 1 tsp sesame oil, pinch of chilli flakes, toasted sesame seeds.</p>
                  <p className="font-industrial text-steel text-sm">Allergens: sesame</p>
                </div>
              )}

              {activeId === 'leek-slaw' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">BURNT LEEK & HERB SLAW</h3>
                  <p className="font-industrial text-foreground/90 leading-relaxed">Grill 2 whole leeks until blackened. Peel outer layer, slice fine. Mix with 150g shredded cabbage, 2 tbsp mayo, handful chopped parsley and chives.</p>
                  <p className="font-industrial text-steel text-sm">Allergens: egg (in mayo)</p>
                </div>
              )}

              {activeId === 'beetroot-labneh' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">EMBER-BAKED BEETROOT, LABNEH</h3>
                  <p className="font-industrial text-foreground/90 leading-relaxed">Wrap 4 beets in foil, roast at 200°C for 1 hour until tender. Peel, quarter. Dollop with 100g labneh, drizzle with olive oil.</p>
                  <p className="font-industrial text-steel text-sm">Allergens: milk</p>
                </div>
              )}
            </article>

            {/* Mobile divider before menu options */}
            <div className="md:hidden my-6 border-t-2 border-border" aria-hidden="true" />

            {/* Sidebar */}
            <aside className="md:border-l md:border-border md:pl-4">
              <nav className="space-y-4">
                <div>
                  <button
                    className={`w-full text-left font-industrial text-sm ${activeId === 'cover' ? 'text-[hsl(var(--accent-pink))] ring-1 ring-[hsl(var(--accent-pink))] rounded px-2 py-1' : 'text-foreground/90 hover:text-[hsl(var(--accent-pink))]'} transition-colors`}
                    onClick={() => setActiveId('cover')}
                    aria-selected={activeId === 'cover'}
                  >
                    Cover
                  </button>
                </div>
                <div>
                  <h5 className="font-brutalist text-foreground/80 tracking-wider mb-2">PIZZA</h5>
                  <ul className="space-y-1">
                    {pizzaItems.map((item) => (
                      <li key={item.id}>
                        <button
                          className={`w-full text-left font-industrial text-sm ${activeId === item.id ? 'text-[hsl(var(--accent-blood-red))]' : 'text-foreground/90 hover:text-[hsl(var(--accent-blood-red))]'} transition-colors`}
                          onClick={() => setActiveId(item.id)}
                          aria-selected={activeId === item.id}
                        >
                          {item.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-brutalist text-foreground/80 tracking-wider mb-2">WOOD-FIRED MAINS</h5>
                  <ul className="space-y-1">
                    {mainsItems.map((item) => (
                      <li key={item.id}>
                        <button
                          className={`w-full text-left font-industrial text-sm ${activeId === item.id ? 'text-[hsl(var(--accent-blood-red))]' : 'text-foreground/90 hover:text-[hsl(var(--accent-blood-red))]'} transition-colors`}
                          onClick={() => setActiveId(item.id)}
                          aria-selected={activeId === item.id}
                        >
                          {item.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-brutalist text-foreground/80 tracking-wider mb-2">SIDES</h5>
                  <ul className="space-y-1">
                    {sidesItems.map((item) => (
                      <li key={item.id}>
                        <button
                          className={`w-full text-left font-industrial text-sm ${activeId === item.id ? 'text-[hsl(var(--accent-blood-red))]' : 'text-foreground/90 hover:text-[hsl(var(--accent-blood-red))]'} transition-colors`}
                          onClick={() => setActiveId(item.id)}
                          aria-selected={activeId === item.id}
                        >
                          {item.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </nav>
            </aside>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SecretKitchensModal;
