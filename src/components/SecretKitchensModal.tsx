import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CroftLogo from "@/components/CroftLogo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SecretKitchensAuthModal } from "@/components/SecretKitchensAuthModal";
import BiometricUnlockModal from "@/components/BiometricUnlockModal";
import MembershipLinkModal from "@/components/MembershipLinkModal";
import { useMembershipGate } from "@/hooks/useMembershipGate";
import { forceRelease } from "@/lib/webauthnOrchestrator";
import { clearRecentBio } from "@/hooks/useRecentBiometric";

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
const { bioOpen, linkOpen, authOpen, allowed, start, reset, handleBioSuccess, handleBioFallback, handleLinkSuccess, handleAuthSuccess } = useMembershipGate();
const contentRef = React.useRef<HTMLDivElement>(null);

  const handleCloseAll = () => {
    // Force release any stuck WebAuthn processes
    forceRelease();
    // Clear recent biometric state to allow fresh attempts
    clearRecentBio();
    reset();
    onClose();
  };

  React.useEffect(() => {
    if (open) {
      // Ensure we start at the top with no lingering text selection
      try { window.getSelection()?.removeAllRanges(); } catch {}
      contentRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [open]);

React.useEffect(() => {
  if (!open) {
    reset();
    return;
  }
  start();
}, [open]);


  type RecipeId =
    | 'cover'
    // Bites
    | 'marinated-gordal-olives'
    | 'wood-oven-flatbread'
    | 'padron-peppers'
    | 'jamon-croquetas'
    | 'crispy-chickpeas'
    | 'whipped-cod-roe'
    | 'smoked-almonds'
    | 'edamame-chilli-salt'
    // Small Plates
    | 'charred-octopus'
    | 'beef-short-rib-croquettes'
    | 'wood-roast-aubergine'
    | 'chorizo-al-vino'
    | 'grilled-sardines'
    | 'lamb-sweetbreads'
    | 'duck-leg-confit-salad'
    | 'scallops-cauliflower-pancetta'
    | 'beetroot-goats-cheese-walnut'
    | 'korean-fried-chicken-wings'
    | 'pork-belly-kimchi'
    | 'smoked-bone-marrow'
    | 'king-oyster-mushroom'
    | 'crispy-squid'
    | 'thai-spiced-fishcakes'
    | 'cauliflower-harissa'
    | 'sticky-pork-belly'
    | 'welsh-salt-marsh-lamb-chops'
    | 'seared-scallop'
    | 'karaage-fried-chicken'
    // Wood-Fired Pizzas
    | 'margherita'
    | 'nduja'
    | 'bianca'
    | 'prosciutto'
    | 'four-cheese'
    | 'korean-bbq-beef'
    | 'clam-pizza'
    | 'vegetale'
    | 'carne'
    | 'truffle-mushroom'
    // Large Plates
    | 'braised-beef-short-rib'
    | 'confit-duck-leg'
    | 'roast-cod'
    | 'monkfish-tail'
    | 'wood-oven-gnocchi'
    | 'charred-aubergine'
    | 'katsu-cauliflower'
    // Charcoal Grill
    | 'flat-iron-steak'
    | 'iberico-pork-chop'
    | 'half-chicken'
    | 'whole-seabass'
    | 'charred-hispi-cabbage'
    | 'ribeye'
    | 'miso-glazed-salmon'
    | 'welsh-salt-marsh-lamb-rump'
    | 't-bone';

  const [activeId, setActiveId] = React.useState<RecipeId>('cover');
  const [activeCategory, setActiveCategory] = React.useState<string>('');

  // Helper function to get category for a recipe
  const getCategoryForRecipe = (recipeId: RecipeId): string => {
    if (bitesItems.some(item => item.id === recipeId)) return 'bites';
    if (smallPlatesItems.some(item => item.id === recipeId)) return 'small-plates';
    if (pizzaItems.some(item => item.id === recipeId)) return 'pizzas';
    if (largePlatesItems.some(item => item.id === recipeId)) return 'large-plates';
    if (charcoalGrillItems.some(item => item.id === recipeId)) return 'charcoal-grill';
    return '';
  };

  // Update active category when activeId changes
  React.useEffect(() => {
    if (activeId !== 'cover') {
      setActiveCategory(getCategoryForRecipe(activeId));
    }
  }, [activeId]);

  const bitesItems: { id: RecipeId; title: string }[] = [
    { id: 'marinated-gordal-olives', title: 'MARINATED GORDAL OLIVES, ORANGE ZEST' },
    { id: 'wood-oven-flatbread', title: 'WOOD OVEN FLATBREAD, SMOKED BUTTER' },
    { id: 'padron-peppers', title: 'PADRON PEPPERS, SEA SALT, NDUJA' },
    { id: 'jamon-croquetas', title: 'JAMÓN CROQUETAS' },
    { id: 'crispy-chickpeas', title: 'CRISPY CHICKPEAS, CHILLI & LIME' },
    { id: 'whipped-cod-roe', title: 'WHIPPED COD ROE, TOASTED FLATBREAD' },
    { id: 'smoked-almonds', title: 'SMOKED ALMONDS' },
    { id: 'edamame-chilli-salt', title: 'EDAMAME, CHILLI SALT' },
  ];

  const smallPlatesItems: { id: RecipeId; title: string }[] = [
    { id: 'charred-octopus', title: 'CHARRED OCTOPUS, POTATO, AIOLI' },
    { id: 'beef-short-rib-croquettes', title: 'BEEF SHORT RIB CROQUETTES' },
    { id: 'wood-roast-aubergine', title: 'WOOD-ROAST AUBERGINE, WHITE MISO GLAZE, SESAME' },
    { id: 'chorizo-al-vino', title: 'CHORIZO AL VINO' },
    { id: 'smoked-bone-marrow', title: 'SMOKED BONE MARROW, TOAST, PARSLEY' },
    { id: 'king-oyster-mushroom', title: 'KING OYSTER MUSHROOM, CHIMICHURRI' },
    { id: 'crispy-squid', title: 'CRISPY SQUID, LEMON, SEAWEED SALT' },
    { id: 'thai-spiced-fishcakes', title: 'THAI SPICED FISHCAKES, SWEET CHILLI DIP' },
    { id: 'cauliflower-harissa', title: 'CAULIFLOWER, HARISSA YOGHURT, ALMOND' },
    { id: 'sticky-pork-belly', title: 'STICKY PORK BELLY, BURNT PINEAPPLE' },
    { id: 'welsh-salt-marsh-lamb-chops', title: 'WELSH SALT MARSH LAMB CHOPS, MINT, SMOKED SALT' },
    { id: 'seared-scallop', title: 'SEARED SCALLOP, BROWN BUTTER, GARLIC CRUMB' },
    { id: 'karaage-fried-chicken', title: 'KARAAGE FRIED CHICKEN, YUZU MAYO' },
  ];

  const pizzaItems: { id: RecipeId; title: string }[] = [
    { id: 'margherita', title: 'MARGHERITA' },
    { id: 'nduja', title: 'NDUJA' },
    { id: 'bianca', title: 'BIANCA' },
    { id: 'prosciutto', title: 'PROSCIUTTO' },
    { id: 'four-cheese', title: 'FOUR CHEESE' },
    { id: 'korean-bbq-beef', title: 'KOREAN BBQ BEEF' },
    { id: 'clam-pizza', title: 'CLAM PIZZA' },
    { id: 'vegetale', title: 'VEGETALE' },
    { id: 'carne', title: 'CARNE' },
    { id: 'truffle-mushroom', title: 'TRUFFLE MUSHROOM' },
  ];

  const largePlatesItems: { id: RecipeId; title: string }[] = [
    { id: 'braised-beef-short-rib', title: 'BRAISED BEEF SHORT RIB, RED WINE, MASH, CHARRED CARROT' },
    { id: 'confit-duck-leg', title: 'CONFIT DUCK LEG, WHITE BEANS, SMOKED SAUSAGE, GREMOLATA' },
    { id: 'roast-cod', title: 'ROAST COD, BROWN SHRIMP BUTTER, SPINACH, POTATO' },
    { id: 'monkfish-tail', title: 'MONKFISH TAIL, TOMATO & SAFFRON STEW, AIOLI' },
    { id: 'wood-oven-gnocchi', title: 'WOOD OVEN GNOCCHI, WILD MUSHROOMS, AGED PARMESAN' },
    { id: 'charred-aubergine', title: 'CHARRED AUBERGINE, TAHINI, POMEGRANATE, FLATBREAD' },
    { id: 'katsu-cauliflower', title: 'KATSU CAULIFLOWER, CURRY SAUCE, PICKLES, RICE' },
  ];

  const charcoalGrillItems: { id: RecipeId; title: string }[] = [
    { id: 'flat-iron-steak', title: 'FLAT IRON STEAK, CHIMICHURRI' },
    { id: 'iberico-pork-chop', title: 'IBERICO PORK CHOP, APPLE & MUSTARD' },
    { id: 'half-chicken', title: 'HALF CHICKEN, GARLIC & LEMON' },
    { id: 'whole-seabass', title: 'WHOLE SEABASS, CHILLI & HERB' },
    { id: 'charred-hispi-cabbage', title: 'CHARRED HISPI CABBAGE, BLACK GARLIC BUTTER' },
    { id: 'ribeye', title: 'RIBEYE, SMOKED SHALLOT' },
    { id: 'miso-glazed-salmon', title: 'MISO GLAZED SALMON, SESAME GREENS' },
    { id: 'welsh-salt-marsh-lamb-rump', title: 'WELSH SALT MARSH LAMB RUMP, HARISSA & MINT' },
    { id: 't-bone', title: 'T-BONE, AS IS' },
  ];


  return (
    <>
<BiometricUnlockModal
        isOpen={bioOpen}
        onClose={() => { reset(); }}
        onSuccess={handleBioSuccess}
        onFallback={handleBioFallback}
        title="Unlock Common Cook Book"
        email=""
        description="Use Face ID / Passkey to access."
      />
      <MembershipLinkModal
        open={linkOpen}
        onClose={() => { reset(); }}
        onSuccess={(email) => { handleLinkSuccess(email); }}
      />
      <SecretKitchensAuthModal
        isOpen={authOpen}
        onClose={() => { reset(); }}
        onSuccess={handleAuthSuccess}
        title="Unlock Secret Kitchens"
        description="We'll email you a 6-digit verification code to confirm."
      />
      <Dialog open={open && allowed} onOpenChange={(v) => { if (!v) handleCloseAll(); }}>
        <DialogContent
        ref={contentRef}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="w-[92vw] sm:w-[86vw] md:max-w-3xl lg:max-w-5xl xl:max-w-6xl max-h-[85vh] overflow-y-auto border border-border bg-background"
      >
        <div className="space-y-6 p-6">

          {/* Navigation buttons */}
          <div className="flex items-center gap-4">
            {activeId !== 'cover' && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setActiveId('cover')}
                aria-label="Back to cover"
                className="border border-[hsl(var(--accent-pink))]/30 bg-[hsl(var(--accent-pink))]/10 hover:bg-[hsl(var(--accent-pink))]/20 focus-visible:ring-1 focus-visible:ring-[hsl(var(--accent-pink))] text-[hsl(var(--accent-pink))] hover:text-[hsl(var(--accent-pink))]"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
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
                  <p className="font-industrial text-foreground/80 mt-2">Fire. Smoke. Salt. Good Taste.</p>
                </div>
              )}

              {/* BITES SECTION */}
              {activeId === 'marinated-gordal-olives' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">MARINATED GORDAL OLIVES, ORANGE ZEST</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 10 mins (plus 2 hrs marinating if you want depth)</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Plump, green, briny. A citrus lift that cuts through the salt.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>300g Gordal olives, drained</li>
                      <li>Zest of 1 orange</li>
                      <li>2 tbsp olive oil</li>
                      <li>1 garlic clove, lightly crushed</li>
                      <li>1 tsp chilli flakes (optional)</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Toss olives with zest, oil, garlic, and chilli. Leave at room temp 2 hrs if you can, or serve straight away.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: none</p>
                </div>
              )}

              {activeId === 'wood-oven-flatbread' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">WOOD OVEN FLATBREAD, SMOKED BUTTER</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 1 hr plus proving</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Soft, blistered flatbread. Butter from Somerset, kissed with smoke.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>250g strong white bread flour</li>
                      <li>160ml warm water</li>
                      <li>5g dried yeast</li>
                      <li>5g salt</li>
                      <li>20g olive oil</li>
                      <li>100g unsalted butter, best quality</li>
                      <li>Pinch smoked sea salt</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Mix flour, yeast, water, oil, salt. Knead 8 mins until smooth. Rest 1 hr. Divide into 4 balls, roll thin. Heat pan or oven tray until smoking. Cook each flatbread 2 mins per side until spotted. Beat butter soft, stir in smoked salt. Serve flatbreads hot, butter melting.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten, milk</p>
                </div>
              )}

              {activeId === 'padron-peppers' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">PADRON PEPPERS, SEA SALT, NDUJA</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 10 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Charred, salted, with hidden heat. Classic padron — with a Calabrian kick.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>200g padrón peppers</li>
                      <li>1 tbsp olive oil</li>
                      <li>Sea salt flakes</li>
                      <li>60g nduja</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Heat frying pan until smoking. Toss peppers in oil. Char until blistered. Scatter with salt. Warm nduja separately until spreadable, dollop over peppers.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: none</p>
                </div>
              )}

              {activeId === 'jamon-croquetas' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">JAMÓN CROQUETAS</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 6 (12 croquetas)</p>
                    <p>Time: 1 hr plus chilling</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Crisp shell. Molten béchamel. Jamón that melts through.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>60g butter</li>
                      <li>60g plain flour</li>
                      <li>500ml whole milk, warm</li>
                      <li>100g Jamón Ibérico, finely chopped</li>
                      <li>1 tsp nutmeg</li>
                      <li>2 eggs, beaten</li>
                      <li>100g plain flour (for coating)</li>
                      <li>150g breadcrumbs</li>
                      <li>Oil for frying</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Melt butter, stir in flour, cook 2 mins. Slowly whisk in milk for thick béchamel. Stir through jamón, nutmeg. Chill until firm. Shape into balls. Coat in flour, egg, breadcrumbs. Chill again. Fry at 180°C until golden.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten, milk, egg</p>
                </div>
              )}

              {activeId === 'crispy-chickpeas' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">CRISPY CHICKPEAS, CHILLI & LIME</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 35 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">A crunch that carries chilli and lime. Beer's best mate.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>400g tin chickpeas, drained, dried well</li>
                      <li>2 tbsp olive oil</li>
                      <li>1 tsp smoked paprika</li>
                      <li>1 tsp chilli flakes</li>
                      <li>Zest of 1 lime</li>
                      <li>Sea salt</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Heat oven to 200°C. Toss chickpeas with oil, paprika, chilli. Roast 25–30 mins until crisp, shaking tray halfway. Toss with lime zest and salt.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: none</p>
                </div>
              )}

              {activeId === 'whipped-cod-roe' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">WHIPPED COD ROE, TOASTED FLATBREAD</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 15 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Smoky, salty, whipped light. Flatbread as the vehicle.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>150g smoked cod roe</li>
                      <li>1 slice white bread, crusts off</li>
                      <li>Juice of 1 lemon</li>
                      <li>100ml olive oil</li>
                      <li>2 flatbreads</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Blend cod roe with bread, lemon juice. Slowly add oil until smooth, pale, whipped. Toast flatbread, cut into wedges, serve with dip.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: fish, gluten</p>
                </div>
              )}

              {activeId === 'smoked-almonds' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">SMOKED ALMONDS</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 10 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Deep roast. Smoke. Sea salt.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>200g blanched almonds</li>
                      <li>1 tbsp olive oil</li>
                      <li>1 tsp smoked paprika</li>
                      <li>Sea salt</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Heat oven to 180°C. Toss almonds with oil and paprika. Roast 8–10 mins until golden. Scatter with salt.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: nuts</p>
                </div>
              )}

              {activeId === 'edamame-chilli-salt' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">EDAMAME, CHILLI SALT</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 10 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Simple. Steamed. Tossed hot with chilli salt.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>300g frozen edamame pods</li>
                      <li>1 tbsp sea salt</li>
                      <li>1 tsp chilli flakes</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Boil edamame 4 mins. Drain. Toss with salt and chilli while hot.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: soy</p>
                </div>
              )}

              {/* Continue with all other recipe sections - this is getting very long, so I'll add a few more key ones */}
              
              {/* SMALL PLATES SECTION */}
              {activeId === 'charred-octopus' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">CHARRED OCTOPUS, POTATO, AIOLI</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 1 hr</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Galician style. Tender octopus. Potato base. Garlic aioli to lift.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1 octopus, 1–1.5kg, cleaned</li>
                      <li>2 bay leaves</li>
                      <li>1 onion, halved</li>
                      <li>4 medium waxy potatoes</li>
                      <li>3 tbsp olive oil</li>
                      <li>2 tsp smoked paprika</li>
                      <li>Sea salt</li>
                      <li>For aioli: 1 egg yolk, 1 garlic clove, 150ml olive oil, 1 tsp lemon juice, pinch salt</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Simmer octopus with bay and onion in salted water for 40–45 mins until tender. Cool slightly. Slice into chunks. Boil potatoes 15 mins, slice thick. Whisk egg yolk, garlic, lemon, then drizzle in oil to make aioli. Heat griddle pan, char octopus and potatoes in oil. Scatter with paprika, serve with aioli.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: egg, mollusc</p>
                </div>
              )}

              {activeId === 'beef-short-rib-croquettes' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">BEEF SHORT RIB CROQUETTES, HORSERADISH</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 2 hrs plus chilling</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Slow-cooked rib meat. Crisp shell. Sharp horseradish kick.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>400g cooked beef short rib, shredded</li>
                      <li>60g butter</li>
                      <li>60g plain flour</li>
                      <li>400ml beef stock</li>
                      <li>2 eggs, beaten</li>
                      <li>100g flour (coating)</li>
                      <li>150g breadcrumbs</li>
                      <li>2 tbsp fresh horseradish, grated</li>
                      <li>Oil for frying</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Make thick roux with butter, flour, stock. Fold in shredded beef. Chill until firm. Shape into balls, coat in flour, egg, breadcrumbs. Fry until golden. Serve with horseradish cream.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten, egg, milk</p>
                </div>
              )}

              {activeId === 'wood-roast-aubergine' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">WOOD ROAST AUBERGINE, POMEGRANATE, TAHINI</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 45 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Smoky aubergine. Creamy tahini. Jewel-bright pomegranate.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>2 large aubergines</li>
                      <li>3 tbsp tahini</li>
                      <li>Juice of 1 lemon</li>
                      <li>2 garlic cloves, crushed</li>
                      <li>Seeds of 1 pomegranate</li>
                      <li>Olive oil, salt</li>
                      <li>Fresh mint leaves</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Roast whole aubergines at 220°C for 35 mins until collapsed. Scoop flesh, mash roughly. Mix tahini, lemon, garlic with water until smooth. Fold through aubergine. Top with pomegranate seeds, mint, oil drizzle.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: sesame</p>
                </div>
              )}

              {activeId === 'chorizo-al-vino' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">CHORIZO AL VINO</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 15 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Spanish chorizo. Red wine reduction. Simple perfection.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>300g cooking chorizo, sliced</li>
                      <li>200ml red wine</li>
                      <li>1 bay leaf</li>
                      <li>Crusty bread to serve</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Fry chorizo slices until oils release. Add wine and bay, simmer until wine reduces and glazes chorizo. Serve with bread.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten</p>
                </div>
              )}

              {activeId === 'grilled-sardines' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">GRILLED SARDINES, SALSA VERDE</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 20 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Fresh sardines. Char-grilled. Bright green herb sauce.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>8 fresh sardines, cleaned</li>
                      <li>Olive oil, salt, pepper</li>
                      <li>For salsa verde: parsley, mint, basil, capers, anchovies, garlic, olive oil, lemon juice</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Blend herbs, capers, anchovies, garlic with oil and lemon for salsa verde. Brush sardines with oil, season. Grill 3 mins each side. Spoon salsa verde over.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: fish</p>
                </div>
              )}

              {activeId === 'lamb-sweetbreads' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">LAMB SWEETBREADS, PANCETTA, PEA PUREE</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 1 hr</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Crispy sweetbreads. Salty pancetta. Sweet pea base.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>400g lamb sweetbreads, cleaned</li>
                      <li>100g pancetta, diced</li>
                      <li>300g frozen peas</li>
                      <li>50g butter</li>
                      <li>100ml chicken stock</li>
                      <li>Flour for dusting</li>
                      <li>Olive oil</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Blanch sweetbreads 3 mins, cool, slice thick. Cook peas in stock, blend with butter for puree. Crisp pancetta. Dust sweetbreads in flour, fry until golden. Serve on pea puree with crispy pancetta.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten, milk</p>
                </div>
              )}

              {activeId === 'duck-leg-confit-salad' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">DUCK LEG CONFIT SALAD, CHERRY, HAZELNUT</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 30 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Rich duck. Sweet cherries. Crunchy hazelnuts. Fresh leaves.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>2 duck leg confits, shredded</li>
                      <li>Mixed salad leaves</li>
                      <li>100g fresh cherries, pitted</li>
                      <li>50g toasted hazelnuts</li>
                      <li>2 tbsp sherry vinegar</li>
                      <li>3 tbsp olive oil</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Crisp duck confit in pan until golden. Whisk vinegar and oil for dressing. Toss leaves with dressing, top with warm duck, cherries, hazelnuts.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: nuts</p>
                </div>
              )}

              {activeId === 'scallops-cauliflower-pancetta' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">SCALLOPS, CAULIFLOWER PUREE, CRISPY PANCETTA</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 30 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Seared scallops. Silky cauliflower. Crisp pancetta contrast.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>8 large scallops</li>
                      <li>1 cauliflower head, chopped</li>
                      <li>100g pancetta, diced</li>
                      <li>100ml double cream</li>
                      <li>50g butter</li>
                      <li>Olive oil</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Boil cauliflower until soft, blend with cream and butter until smooth. Crisp pancetta. Pat scallops dry, sear 2 mins each side in hot oil. Serve on cauliflower puree with crispy pancetta.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: milk, mollusc</p>
                </div>
              )}

              {activeId === 'beetroot-goats-cheese-walnut' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">BEETROOT, GOAT'S CHEESE, CANDIED WALNUT</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 1 hr</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Earthy beetroot. Creamy goat's cheese. Sweet candied walnuts.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>4 beetroots, different colors</li>
                      <li>150g soft goat's cheese</li>
                      <li>50g walnuts</li>
                      <li>2 tbsp honey</li>
                      <li>Rocket leaves</li>
                      <li>Balsamic vinegar</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Roast beetroots wrapped in foil 45 mins until tender. Cool, peel, slice. Toss walnuts with honey, roast until caramelized. Arrange beetroot with goat's cheese, rocket, candied walnuts. Drizzle balsamic.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: milk, nuts</p>
                </div>
              )}

              {activeId === 'korean-fried-chicken-wings' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">KOREAN FRIED CHICKEN WINGS</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 45 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Double-fried wings. Sweet and spicy Korean glaze.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>12 chicken wings</li>
                      <li>100g cornstarch</li>
                      <li>3 tbsp gochujang</li>
                      <li>2 tbsp soy sauce</li>
                      <li>2 tbsp honey</li>
                      <li>1 tbsp rice vinegar</li>
                      <li>2 garlic cloves, minced</li>
                      <li>Oil for frying</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Coat wings in cornstarch. Fry at 160°C for 10 mins, then 180°C for 5 mins until crispy. Mix gochujang, soy, honey, vinegar, garlic for glaze. Toss hot wings in glaze.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten, soy</p>
                </div>
              )}

              {activeId === 'pork-belly-kimchi' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">PORK BELLY, KIMCHI, SESAME</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 2 hrs</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Slow-cooked pork belly. Fermented kimchi heat. Nutty sesame.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>600g pork belly, skin on</li>
                      <li>150g kimchi</li>
                      <li>2 tbsp sesame oil</li>
                      <li>1 tbsp sesame seeds</li>
                      <li>2 spring onions, sliced</li>
                      <li>Steamed rice to serve</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Slow roast pork belly at 140°C for 1.5 hrs until tender. Crisp skin under grill. Slice thick. Serve with kimchi, drizzle sesame oil, scatter sesame seeds and spring onions.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: sesame, soy</p>
                </div>
              )}

              {activeId === 'smoked-bone-marrow' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">SMOKED BONE MARROW, TOAST, PARSLEY</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 20 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Rich marrow, smoke and salt. Crisp toast. Fresh herb to cut.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>4 beef marrow bones, split lengthways</li>
                      <li>2 tbsp olive oil</li>
                      <li>Sea salt</li>
                      <li>4 slices sourdough bread</li>
                      <li>1 bunch flat-leaf parsley, chopped</li>
                      <li>1 shallot, finely diced</li>
                      <li>1 tsp capers, chopped</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Heat oven to 220°C. Roast marrow bones 15 mins until soft inside. Toast bread. Mix parsley, shallot, capers. Scoop marrow onto toast, sprinkle parsley mix.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten</p>
                </div>
              )}

              {activeId === 'king-oyster-mushroom' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">KING OYSTER MUSHROOM, CHIMICHURRI</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 2</p>
                    <p>Time: 20 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Meaty mushroom, green herb sharpness.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>2 large king oyster mushrooms, sliced lengthways</li>
                      <li>2 tbsp olive oil</li>
                      <li>Sea salt</li>
                      <li>For chimichurri: 1 bunch parsley, 2 garlic cloves, 1 red chilli, 100ml olive oil, 2 tbsp red wine vinegar, salt</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Blitz parsley, garlic, chilli, oil, vinegar to chimichurri. Heat griddle pan, brush mushrooms with oil. Char 3–4 mins each side. Salt, then spoon chimichurri over.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: none</p>
                </div>
              )}

              {activeId === 'crispy-squid' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">CRISPY SQUID, LEMON, SEAWEED SALT</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 25 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Light fry. Squeeze of lemon. Umami salt.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>400g squid, cleaned, cut into rings</li>
                      <li>100g plain flour</li>
                      <li>50g cornflour</li>
                      <li>1 tsp seaweed flakes (nori or wakame), crushed</li>
                      <li>1 lemon, quartered</li>
                      <li>Oil for frying</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Mix flours and seaweed with pinch salt. Toss squid to coat. Fry at 180°C until golden and crisp. Drain. Serve with lemon wedges.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten, mollusc</p>
                </div>
              )}

              {activeId === 'thai-spiced-fishcakes' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">THAI SPICED FISHCAKES, SWEET CHILLI DIP</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4 (8 cakes)</p>
                    <p>Time: 35 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Aromatic, punchy, bright. Thai street corner in your kitchen.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>400g white fish fillet, skin off</li>
                      <li>2 tbsp Thai red curry paste</li>
                      <li>1 egg</li>
                      <li>1 tbsp fish sauce</li>
                      <li>4 kaffir lime leaves, shredded</li>
                      <li>2 tbsp green beans, finely chopped</li>
                      <li>Oil for frying</li>
                      <li>Sweet chilli sauce to serve</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Blend fish with curry paste, egg, fish sauce. Stir in lime leaves and beans. Shape patties. Fry in shallow oil 2–3 mins each side until golden. Serve hot with sweet chilli dip.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: fish, egg, soy</p>
                </div>
              )}

              {activeId === 'cauliflower-harissa' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">CAULIFLOWER, HARISSA YOGHURT, ALMOND</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 40 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Scorched edges. Sweet heat. Cream cool. Crunch of almond.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1 medium cauliflower, cut into florets</li>
                      <li>2 tbsp olive oil</li>
                      <li>2 tbsp rose harissa</li>
                      <li>150g Greek yoghurt</li>
                      <li>40g flaked almonds, toasted</li>
                      <li>Juice of ½ lemon</li>
                      <li>Salt</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Heat oven to 200°C. Toss cauliflower with oil, salt. Roast 30 mins until charred. Mix yoghurt with harissa, lemon. Spoon onto plate, pile cauliflower on top. Scatter almonds.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: milk, nuts</p>
                </div>
              )}

              {activeId === 'sticky-pork-belly' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">STICKY PORK BELLY, BURNT PINEAPPLE</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 2.5 hrs</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Sweet fat. Pineapple acid. Char to balance.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>800g pork belly, cut into 4cm cubes</li>
                      <li>3 tbsp soy sauce</li>
                      <li>2 tbsp honey</li>
                      <li>2 tbsp rice vinegar</li>
                      <li>1 pineapple, peeled, sliced thick</li>
                      <li>1 tbsp brown sugar</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Roast pork belly at 160°C for 2 hrs until tender. Mix soy, honey, vinegar. Toss pork, roast again 20 mins at 200°C to glaze. Grill pineapple slices until black lines appear, dust with sugar to caramelise. Serve pork with pineapple.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: soy</p>
                </div>
              )}

              {activeId === 'welsh-salt-marsh-lamb-chops' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">WELSH SALT MARSH LAMB CHOPS, MINT, SMOKED SALT</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 20 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Tender lamb. Flame lick. Mint to freshen, smoked salt to finish.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>8 lamb chops</li>
                      <li>2 tbsp olive oil</li>
                      <li>1 tsp smoked sea salt</li>
                      <li>1 bunch mint leaves, chopped</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Heat grill or barbecue. Rub lamb with oil. Cook 3–4 mins each side for pink. Rest 5 mins. Scatter with mint and smoked salt.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: none</p>
                </div>
              )}

              {activeId === 'seared-scallop' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">SEARED SCALLOP, BROWN BUTTER, GARLIC CRUMB</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 2 (4 scallops)</p>
                    <p>Time: 15 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">West Country scallops. Caramelised butter. Crunch crumb.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>4 large scallops, roe removed</li>
                      <li>40g butter</li>
                      <li>1 garlic clove, minced</li>
                      <li>40g panko breadcrumbs</li>
                      <li>1 tbsp olive oil</li>
                      <li>Squeeze of lemon</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Fry breadcrumbs in oil with garlic until golden. Dry scallops, season. Sear in hot pan with butter 1–2 mins each side until caramelised. Add lemon. Serve with crumb scattered over.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: mollusc, milk, gluten</p>
                </div>
              )}

              {activeId === 'karaage-fried-chicken' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">KARAAGE FRIED CHICKEN, YUZU MAYO</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 45 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Japanese-style fried chicken. Citrus mayo lift.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>500g boneless chicken thigh, cut bite-size</li>
                      <li>2 tbsp soy sauce</li>
                      <li>1 tbsp sake (or dry sherry)</li>
                      <li>1 tsp grated ginger</li>
                      <li>1 clove garlic, grated</li>
                      <li>100g potato starch or cornflour</li>
                      <li>Oil for frying</li>
                      <li>For mayo: 100g mayonnaise, 1 tsp yuzu juice</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Marinate chicken in soy, sake, ginger, garlic 20 mins. Toss in starch. Fry at 180°C until golden and crisp. Mix mayo with yuzu. Serve hot chicken with dip.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: soy, egg</p>
                </div>
              )}

              {/* WOOD-FIRED PIZZAS SECTION */}
              {activeId === 'margherita' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">MARGHERITA</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 1</p>
                    <p>Time: 10 mins once dough is ready</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">San Marzano tomato. Fior di Latte. Basil. The blueprint.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1 dough ball (250g)</li>
                      <li>80g San Marzano tomato passata</li>
                      <li>100g Fior di Latte mozzarella, torn</li>
                      <li>4 basil leaves</li>
                      <li>Olive oil</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Stretch dough. Spread tomato lightly, leaving a 2cm edge. Scatter mozzarella, basil leaves. Bake 6–8 mins until blistered. Drizzle oil.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten, milk</p>
                </div>
              )}

              {activeId === 'nduja' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">NDUJA</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 1</p>
                    <p>Time: 10 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Calabrian fire. Ricotta cool. Honey for sting.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1 dough ball</li>
                      <li>80g tomato passata</li>
                      <li>60g nduja</li>
                      <li>60g ricotta</li>
                      <li>40g mozzarella</li>
                      <li>1 tsp hot honey</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Spread passata, scatter mozzarella and nduja. Bake until blistered. Dot ricotta after cooking. Drizzle honey.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten, milk</p>
                </div>
              )}

              {activeId === 'bianca' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">BIANCA</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 1</p>
                    <p>Time: 8 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">No tomato. White base. Ricotta, mozzarella, garlic oil.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1 dough ball</li>
                      <li>80g ricotta</li>
                      <li>80g mozzarella, torn</li>
                      <li>2 garlic cloves, sliced thin</li>
                      <li>3 tbsp olive oil</li>
                      <li>Fresh thyme</li>
                      <li>Black pepper</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Brush dough with garlic oil. Dot ricotta and mozzarella. Scatter thyme. Bake until golden. Crack black pepper over.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten, milk</p>
                </div>
              )}

              {activeId === 'prosciutto' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">PROSCIUTTO</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 1</p>
                    <p>Time: 10 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">San Daniele ham. Rocket peppery bite. Simple elegance.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1 dough ball</li>
                      <li>80g tomato passata</li>
                      <li>100g mozzarella</li>
                      <li>60g prosciutto San Daniele</li>
                      <li>Rocket leaves</li>
                      <li>Parmesan shavings</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Base with tomato and mozzarella. Bake until crisp. Top with prosciutto, rocket, parmesan shavings after cooking.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten, milk</p>
                </div>
              )}

              {activeId === 'four-cheese' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">FOUR CHEESE</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 1</p>
                    <p>Time: 10 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Mozzarella base. Gorgonzola punch. Parmesan sharp. Ricotta smooth.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1 dough ball</li>
                      <li>60g mozzarella</li>
                      <li>40g gorgonzola, crumbled</li>
                      <li>30g parmesan, grated</li>
                      <li>40g ricotta</li>
                      <li>Fresh thyme</li>
                      <li>Honey drizzle</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Scatter all cheeses evenly. Add thyme. Bake until melted and bubbling. Drizzle honey over gorgonzola areas.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten, milk</p>
                </div>
              )}

              {activeId === 'korean-bbq-beef' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">KOREAN BBQ BEEF</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 1</p>
                    <p>Time: 15 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Marinated beef. Gochujang heat. Sesame finish. East meets wood fire.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1 dough ball</li>
                      <li>2 tbsp gochujang</li>
                      <li>120g ribeye, thinly sliced</li>
                      <li>80g mozzarella</li>
                      <li>1 spring onion, sliced</li>
                      <li>1 tsp sesame seeds</li>
                      <li>Sesame oil drizzle</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Brush base with gochujang. Add mozzarella, raw beef slices. Bake until beef cooks through. Top with spring onions, sesame seeds, sesame oil.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten, milk, sesame, soy</p>
                </div>
              )}

              {activeId === 'clam-pizza' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">CLAM PIZZA</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 1</p>
                    <p>Time: 15 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Garlic butter base. Fresh clams. Chilli and lemon bite.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1 dough ball</li>
                      <li>40g butter</li>
                      <li>2 garlic cloves, minced</li>
                      <li>200g fresh clams, scrubbed</li>
                      <li>1 red chilli, sliced</li>
                      <li>Zest of ½ lemon</li>
                      <li>Handful parsley, chopped</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Steam clams in splash of water 3–4 mins until open. Remove meat. Melt butter with garlic. Spread on dough. Scatter clams, chilli, parsley. Bake 6–7 mins. Finish with lemon zest.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten, milk, mollusc</p>
                </div>
              )}

              {activeId === 'vegetale' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">VEGETALE</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 1</p>
                    <p>Time: 15 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Charred vegetables. Tomato base. Simple, bright.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1 dough ball</li>
                      <li>80g tomato passata</li>
                      <li>40g mozzarella</li>
                      <li>½ aubergine, diced and roasted</li>
                      <li>½ courgette, sliced and roasted</li>
                      <li>½ red pepper, roasted, sliced</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Spread passata, scatter mozzarella. Add roasted veg. Bake until crust crisp and cheese bubbling.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten, milk</p>
                </div>
              )}

              {activeId === 'carne' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">CARNE</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 1</p>
                    <p>Time: 15 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Meat feast, Croft style. Beef rib, smoke, heat.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1 dough ball</li>
                      <li>80g tomato passata</li>
                      <li>40g mozzarella</li>
                      <li>100g cooked beef short rib, shredded</li>
                      <li>½ red onion, thinly sliced</li>
                      <li>1 tsp smoked chilli flakes</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Spread passata, scatter mozzarella, beef, onion, chilli. Bake 7–8 mins until crust blisters.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten, milk</p>
                </div>
              )}

              {activeId === 'truffle-mushroom' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">TRUFFLE MUSHROOM</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 1</p>
                    <p>Time: 12 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Porcini depth. Garlic cream. Truffle scent rising from heat.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1 dough ball</li>
                      <li>60ml double cream</li>
                      <li>1 garlic clove, grated</li>
                      <li>40g porcini mushrooms, rehydrated, chopped</li>
                      <li>40g mozzarella</li>
                      <li>20g Parmesan, grated</li>
                      <li>1 tsp truffle oil</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Spread garlic cream on dough. Scatter porcini, mozzarella, Parmesan. Bake until bubbling. Drizzle truffle oil after cooking.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten, milk</p>
                </div>
              )}

              {/* LARGE PLATES SECTION */}
              {activeId === 'braised-beef-short-rib' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">BRAISED BEEF SHORT RIB, RED WINE, MASH, CHARRED CARROT</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 4 hrs</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Slow cook. Deep wine sauce. Meat that falls. Soft mash and sweet char to hold it.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1.5kg beef short rib, bone in</li>
                      <li>2 onions, quartered</li>
                      <li>2 carrots, chopped</li>
                      <li>2 celery sticks, chopped</li>
                      <li>4 garlic cloves, smashed</li>
                      <li>500ml red wine</li>
                      <li>500ml beef stock</li>
                      <li>2 bay leaves</li>
                      <li>1 sprig rosemary</li>
                      <li>800g potatoes, peeled</li>
                      <li>100g butter</li>
                      <li>100ml whole milk</li>
                      <li>4 carrots, halved lengthways</li>
                      <li>Olive oil, salt, pepper</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Brown ribs in oil, remove. Add veg, garlic, cook 10 mins. Deglaze with wine, reduce by half. Add ribs, stock, herbs. Cover, braise at 160°C for 3 hrs until falling apart. Boil potatoes, mash with butter and milk. Toss carrots in oil, char under grill until blistered. Serve rib with mash, carrots, spoon of sauce.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: milk</p>
                </div>
              )}

              {activeId === 'confit-duck-leg' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">CONFIT DUCK LEG, LENTILS, PANCETTA</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 3 hrs plus overnight salt</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Duck legs slow-cooked in their own fat. Earthy lentils. Crispy pancetta contrast.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>4 duck legs</li>
                      <li>4 tbsp sea salt</li>
                      <li>2 bay leaves</li>
                      <li>4 thyme sprigs</li>
                      <li>Duck fat to cover</li>
                      <li>250g Puy lentils</li>
                      <li>100g pancetta, diced</li>
                      <li>1 carrot, diced</li>
                      <li>1 celery stick, diced</li>
                      <li>500ml chicken stock</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Salt duck legs overnight. Rinse, pat dry. Submerge in duck fat with herbs. Cook at 90°C for 2.5 hrs. Fry pancetta until crisp. Cook lentils with veg in stock 25 mins. Crisp duck skin under grill. Serve on lentils with pancetta.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: none</p>
                </div>
              )}

              {activeId === 'roast-cod' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">ROAST COD, JERUSALEM ARTICHOKE, BROWN BUTTER</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 45 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Thick cod fillet. Sweet Jerusalem artichoke. Nutty brown butter finish.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>4 cod fillets, 150g each</li>
                      <li>600g Jerusalem artichokes</li>
                      <li>100g butter</li>
                      <li>2 tbsp capers</li>
                      <li>Lemon juice</li>
                      <li>Fresh parsley</li>
                      <li>Olive oil, salt, pepper</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Roast artichokes at 200°C for 30 mins until tender. Season cod, sear skin-down 4 mins, flip 2 mins. Heat butter until foaming and brown, add capers. Serve cod on artichokes, spoon brown butter over, finish with parsley and lemon.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: fish, milk</p>
                </div>
              )}

              {activeId === 'monkfish-tail' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">MONKFISH TAIL, CHORIZO, CHICKPEA STEW</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 1 hr</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Meaty monkfish. Smoky chorizo. Comforting chickpea base.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>600g monkfish tail, skinned</li>
                      <li>150g cooking chorizo, sliced</li>
                      <li>400g tin chickpeas, drained</li>
                      <li>1 onion, diced</li>
                      <li>3 garlic cloves</li>
                      <li>400g tin tomatoes</li>
                      <li>200ml white wine</li>
                      <li>1 tsp smoked paprika</li>
                      <li>Fresh parsley</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Fry chorizo until crisp, remove. Cook onion, garlic in chorizo oil. Add tomatoes, wine, paprika, chickpeas. Simmer 20 mins. Nestle monkfish pieces in stew, cover, cook 15 mins. Scatter chorizo and parsley.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: fish</p>
                </div>
              )}

              {activeId === 'wood-oven-gnocchi' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">WOOD OVEN GNOCCHI, WILD MUSHROOM, SAGE</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 2 hrs plus chilling</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Hand-made gnocchi. Wood oven char. Earthy mushrooms. Crispy sage.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>800g floury potatoes</li>
                      <li>200g 00 flour</li>
                      <li>1 egg yolk</li>
                      <li>300g mixed wild mushrooms</li>
                      <li>100g butter</li>
                      <li>12 sage leaves</li>
                      <li>50g parmesan, grated</li>
                      <li>Olive oil, salt, pepper</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Boil potatoes until tender, pass through ricer. Mix with flour, egg yolk, season. Roll into sausages, cut gnocchi, mark with fork. Boil until they float. Sear mushrooms in hot oil. Crisp sage in butter until golden. Toss gnocchi with mushrooms, sage butter, parmesan.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: gluten, egg, milk</p>
                </div>
              )}

              {/* CHARCOAL GRILL SECTION */}
              {activeId === 'flat-iron-steak' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">FLAT IRON STEAK, CHIMICHURRI</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 2</p>
                    <p>Time: 25 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Rare breed beef. Seared hot. Green herb punch.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>400g flat iron steak</li>
                      <li>Olive oil, salt, black pepper</li>
                      <li>For chimichurri: 1 bunch parsley, 3 garlic cloves, 1 red chilli, 100ml olive oil, 2 tbsp red wine vinegar, pinch salt</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Blend parsley, garlic, chilli, oil, vinegar for chimichurri. Rub steak with oil, salt, pepper. Grill 3–4 mins each side for medium rare. Rest 5 mins. Slice against grain. Spoon chimichurri over.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: none</p>
                </div>
              )}

              {activeId === 'iberico-pork-chop' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">IBERICO PORK CHOP, APPLE SAUCE, CRACKLING</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 2</p>
                    <p>Time: 45 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Spanish black pig. Sweet apple contrast. Crispy crackling crunch.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>2 Iberico pork chops, bone-in</li>
                      <li>3 Bramley apples, peeled, chopped</li>
                      <li>2 tbsp sugar</li>
                      <li>1 tbsp butter</li>
                      <li>Pork skin for crackling</li>
                      <li>Sea salt, olive oil</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Score pork skin, rub with salt, roast at 220°C until crackling. Cook apples with sugar and butter until soft sauce. Season chops, grill 6 mins each side. Rest 5 mins. Serve with apple sauce and crackling pieces.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: milk</p>
                </div>
              )}

              {activeId === 'half-chicken' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">HALF CHICKEN, LEMON, HERBS</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 2</p>
                    <p>Time: 1 hr</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Free range bird. Charcoal smoke. Fresh herb marinade. Lemon brightness.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1 free range chicken, halved</li>
                      <li>2 lemons, zested and juiced</li>
                      <li>4 garlic cloves, crushed</li>
                      <li>Fresh thyme, rosemary, oregano</li>
                      <li>4 tbsp olive oil</li>
                      <li>Sea salt, black pepper</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Marinate chicken halves in lemon, herbs, garlic, oil for 2 hrs. Grill skin-side down 20 mins until crispy. Flip, cook 15 mins more until cooked through. Rest 10 mins. Serve with lemon wedges.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: none</p>
                </div>
              )}

              {activeId === 'whole-seabass' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">WHOLE SEABASS, SEA SALT, FENNEL</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 2–3</p>
                    <p>Time: 45 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Whole fish. Sea salt crust. Wild fennel aromatics. Simple perfection.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1 whole seabass, 1.2kg, scaled, gutted</li>
                      <li>500g coarse sea salt</li>
                      <li>3 egg whites</li>
                      <li>Fresh fennel fronds</li>
                      <li>1 lemon, sliced</li>
                      <li>Olive oil</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Stuff fish cavity with fennel and lemon. Mix salt with egg whites. Cover fish completely with salt mix. Bake at 200°C for 35 mins. Crack salt crust to serve. Drizzle with oil.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: fish, egg</p>
                </div>
              )}

              {activeId === 'ribeye' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">RIBEYE, BONE MARROW BUTTER</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 2</p>
                    <p>Time: 30 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Prime ribeye. Rich marrow butter. Charcoal char. Pure indulgence.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1 ribeye steak, 600g, 2 inches thick</li>
                      <li>100g soft butter</li>
                      <li>2 tbsp roasted bone marrow, chopped</li>
                      <li>1 garlic clove, minced</li>
                      <li>Fresh thyme</li>
                      <li>Sea salt, cracked black pepper</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Mix butter with marrow, garlic, thyme. Season steak generously. Grill 4–5 mins each side for medium rare. Rest 10 mins. Slice thick, top with marrow butter melting over.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: milk</p>
                </div>
              )}

              {activeId === 't-bone' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">T-BONE, AS IS</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 2–3</p>
                    <p>Time: 30 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Prime British beef. Nothing else. Let fire do the work.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>1 T-bone steak, 800g</li>
                      <li>Olive oil, sea salt, black pepper</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Rub with oil, salt, pepper. Grill 6–7 mins each side for medium rare. Rest 10 mins. Carve at table.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: none</p>
                </div>
              )}

              {activeId === 'miso-glazed-salmon' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">MISO GLAZED SALMON, SESAME GREENS</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 2</p>
                    <p>Time: 25 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Sweet-savoury glaze. Salmon char. Greens bright.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>2 salmon fillets, skin on</li>
                      <li>2 tbsp white miso paste</li>
                      <li>1 tbsp honey</li>
                      <li>1 tbsp soy sauce</li>
                      <li>200g tenderstem broccoli</li>
                      <li>1 tsp sesame oil</li>
                      <li>1 tsp sesame seeds, toasted</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Mix miso, honey, soy. Brush salmon. Grill skin-side down 4–5 mins, flip 2–3 mins. Blanch broccoli, toss with sesame oil. Serve salmon with greens, sprinkle sesame seeds.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: fish, soy, sesame</p>
                </div>
              )}

              {activeId === 'welsh-salt-marsh-lamb-rump' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">WELSH SALT MARSH LAMB RUMP, HARISSA & MINT</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 2</p>
                    <p>Time: 35 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Sweet lamb. Fire heat. Fresh mint.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>2 lamb rumps</li>
                      <li>2 tbsp rose harissa</li>
                      <li>2 tbsp olive oil</li>
                      <li>Handful mint leaves, chopped</li>
                      <li>Salt, pepper</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Rub lamb with harissa, oil, salt. Grill 6–8 mins each side until medium rare. Rest 10 mins. Slice, scatter mint.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: none</p>
                </div>
              )}

              {activeId === 'charred-hispi-cabbage' && (
                <div className="space-y-3">
                  <h3 className="font-brutalist text-foreground text-xl tracking-wider">CHARRED HISPI CABBAGE, BLACK GARLIC BUTTER</h3>
                  <div className="font-industrial text-foreground/80">
                    <p>Serves: 4</p>
                    <p>Time: 20 mins</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Caramelised layers. Deep umami. Butter to coat.</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">You'll Need</h4>
                    <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
                      <li>2 hispi (pointed) cabbages, halved</li>
                      <li>50g butter, softened</li>
                      <li>2 cloves black garlic, mashed</li>
                      <li>Olive oil, salt</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
                    <p className="font-industrial text-foreground/90 leading-relaxed">Mix butter with black garlic. Rub cabbage halves with oil, salt. Grill cut-side down until charred, 6–8 mins. Turn, cook until tender. Spread with garlic butter while hot.</p>
                  </div>
                  <p className="font-industrial text-steel text-sm">Allergens: milk</p>
                </div>
              )}

            </article>

            {/* Navigation sidebar */}
            <aside className="flex flex-col">
              {/* Recipe Book Cover Button - Sticky at top */}
              <div className="sticky top-0 z-30 bg-background border-b border-border py-3">
                <button
                  onClick={() => setActiveId('cover')}
                  className={`text-left font-brutalist text-lg w-full hover:text-foreground transition-colors tracking-wider ${
                    activeId === 'cover' ? 'text-foreground' : 'text-foreground/70'
                  }`}
                >
                  RECIPE BOOK COVER
                </button>
              </div>

              {/* Scrollable navigation content */}
              <div className="flex-1 overflow-y-auto">
                <nav className="space-y-2 pt-4">
                {/* BITES Section */}
                <div>
                  <h2 className="font-brutalist text-foreground text-lg tracking-wider">BITES</h2>
                  <ul className="space-y-1 mt-2">
                      {bitesItems.map((item) => (
                        <li key={item.id}>
                          <button
                            onClick={() => setActiveId(item.id)}
                            className={`text-left font-industrial text-sm w-full hover:text-foreground transition-colors ${
                              activeId === item.id ? 'text-foreground' : 'text-foreground/60'
                            }`}
                          >
                            {item.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                </div>

                {/* SMALL PLATES Section */}
                <div className="pt-4">
                  <h2 className="font-brutalist text-foreground text-lg tracking-wider">SMALL PLATES</h2>
                  <ul className="space-y-1 mt-2">
                      {smallPlatesItems.map((item) => (
                        <li key={item.id}>
                          <button
                            onClick={() => setActiveId(item.id)}
                            className={`text-left font-industrial text-sm w-full hover:text-foreground transition-colors ${
                              activeId === item.id ? 'text-foreground' : 'text-foreground/60'
                            }`}
                          >
                            {item.title}
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* WOOD-FIRED PIZZAS Section */}
                <div className="pt-4">
                  <h2 className="font-brutalist text-foreground text-lg tracking-wider">WOOD-FIRED PIZZAS</h2>
                  <ul className="space-y-1 mt-2">
                      {pizzaItems.map((item) => (
                        <li key={item.id}>
                          <button
                            onClick={() => setActiveId(item.id)}
                            className={`text-left font-industrial text-sm w-full hover:text-foreground transition-colors ${
                              activeId === item.id ? 'text-foreground' : 'text-foreground/60'
                            }`}
                          >
                            {item.title}
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* LARGE PLATES Section */}
                <div className="pt-4">
                  <h2 className="font-brutalist text-foreground text-lg tracking-wider">LARGE PLATES</h2>
                  <ul className="space-y-1 mt-2">
                      {largePlatesItems.map((item) => (
                        <li key={item.id}>
                          <button
                            onClick={() => setActiveId(item.id)}
                            className={`text-left font-industrial text-sm w-full hover:text-foreground transition-colors ${
                              activeId === item.id ? 'text-foreground' : 'text-foreground/60'
                            }`}
                          >
                            {item.title}
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* CHARCOAL GRILL Section */}
                <div className="pt-4">
                  <h2 className="font-brutalist text-foreground text-lg tracking-wider">CHARCOAL GRILL</h2>
                  <ul className="space-y-1 mt-2">
                      {charcoalGrillItems.map((item) => (
                        <li key={item.id}>
                          <button
                            onClick={() => setActiveId(item.id)}
                            className={`text-left font-industrial text-sm w-full hover:text-foreground transition-colors ${
                              activeId === item.id ? 'text-foreground' : 'text-foreground/60'
                            }`}
                          >
                            {item.title}
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              </nav>
              </div>
            </aside>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default SecretKitchensModal;