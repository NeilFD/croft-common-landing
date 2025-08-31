import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CroftLogo from "@/components/CroftLogo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SecretKitchensAuthModal } from "@/components/SecretKitchensAuthModal";
import BiometricUnlockModal from "@/components/BiometricUnlockModal";
import MembershipLinkModal from "@/components/MembershipLinkModal";
import { useMembershipGate } from "@/hooks/useMembershipGate";

interface SecretKitchensModalProps {
  open: boolean;
  onClose: () => void;
}

type RecipeId = 'pizza-margherita' | 'pizza-puttanesca' | 'pizza-sausage' | 'beef-ragu' | 'chili-crab' | 'chicken-piri' | 'chimichurri-lamb' | 'flatbread' | 'tenderstem' | 'leek-slaw' | 'beetroot-labneh';

export default function SecretKitchensModal({ open, onClose }: SecretKitchensModalProps) {
  const [activeId, setActiveId] = React.useState<RecipeId>('pizza-margherita');
  const contentRef = React.useRef<HTMLDivElement>(null);

  const {
    bioOpen,
    linkOpen,
    authOpen,
    allowed,
    checking,
    start,
    reset,
    handleBioSuccess,
    handleBioFallback,
    handleLinkSuccess,
    handleAuthSuccess
  } = useMembershipGate();

  const handleCloseAll = () => {
    reset();
    onClose();
  };

  React.useEffect(() => {
    if (open && !checking && !bioOpen && !linkOpen && !authOpen && !allowed) {
      start();
    }
  }, [open, checking, bioOpen, linkOpen, authOpen, allowed, start]);

  React.useEffect(() => {
    if (allowed) {
      // Continue...
    }
  }, [allowed]);

  const pizzaItems = [
    { id: 'pizza-margherita', title: 'PIZZA MARGHERITA' },
    { id: 'pizza-puttanesca', title: 'PIZZA PUTTANESCA' },
    { id: 'pizza-sausage', title: 'SAUSAGE & FENNEL PIZZA' },
  ];

  const mainsItems = [
    { id: 'beef-ragu', title: 'BEEF RAGU, PAPPARDELLE & PARMESAN' },
    { id: 'chili-crab', title: 'CHILLI CRAB & SWEET CORN LINGUINE' },
    { id: 'chicken-piri', title: 'PIRI PIRI CHICKEN' },
    { id: 'chimichurri-lamb', title: 'CHIMICHURRI LAMB' },
  ];

  const sidesItems = [
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
      />
      <Dialog open={open && allowed} onOpenChange={(v) => { if (!v) handleCloseAll(); }}>
        <DialogContent
        ref={contentRef}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="w-[92vw] sm:w-[86vw] md:max-w-3xl lg:max-w-5xl xl:max-w-6xl max-h-[85vh] overflow-y-auto border border-border bg-background"
      >
        <div className="space-y-6">
          {/* Header with back button and logo */}
          <div className="flex items-center justify-between relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseAll}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={16} />
              Back
            </Button>
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <CroftLogo className="h-8 text-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
            {/* Main Content */}
            <div className="order-2 lg:order-1">
              {activeId === 'pizza-margherita' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light text-foreground tracking-wide">PIZZA MARGHERITA</h1>
                  
                  <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                    <p><strong>For the dough:</strong></p>
                    <ul className="space-y-1 ml-4">
                      <li>• 500g strong white bread flour</li>
                      <li>• 325ml warm water</li>
                      <li>• 7g active dry yeast</li>
                      <li>• 1 tsp fine sea salt</li>
                      <li>• 2 tbsp extra virgin olive oil</li>
                    </ul>

                    <p><strong>For the topping:</strong></p>
                    <ul className="space-y-1 ml-4">
                      <li>• 200ml San Marzano tomatoes, crushed</li>
                      <li>• 200g fresh mozzarella, torn</li>
                      <li>• Fresh basil leaves</li>
                      <li>• Extra virgin olive oil</li>
                      <li>• Sea salt and black pepper</li>
                    </ul>

                    <p><strong>Method:</strong></p>
                    <ol className="space-y-2 ml-4">
                      <li>1. Dissolve yeast in warm water with a pinch of sugar. Let stand for 5 minutes until foamy.</li>
                      <li>2. In a large bowl, combine flour and salt. Make a well in the center and add the yeast mixture and olive oil.</li>
                      <li>3. Mix until a rough dough forms, then turn onto a floured surface and knead for 8-10 minutes until smooth and elastic.</li>
                      <li>4. Place in an oiled bowl, cover, and let rise for 1-2 hours until doubled in size.</li>
                      <li>5. Punch down dough and divide into 2-3 portions. Roll each into a thin circle.</li>
                      <li>6. Transfer to a pizza stone or baking sheet. Spread crushed tomatoes, leaving a border for the crust.</li>
                      <li>7. Top with torn mozzarella and season with salt and pepper.</li>
                      <li>8. Bake at 250°C (480°F) for 10-12 minutes until crust is golden and cheese is bubbling.</li>
                      <li>9. Remove from oven, top with fresh basil leaves and a drizzle of olive oil.</li>
                      <li>10. Slice and serve immediately while hot.</li>
                    </ol>
                  </div>
                </div>
              )}

              {activeId === 'pizza-puttanesca' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light text-foreground tracking-wide">PIZZA PUTTANESCA</h1>
                  
                  <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                    <p><strong>For the topping:</strong></p>
                    <ul className="space-y-1 ml-4">
                      <li>• Pizza dough (as above)</li>
                      <li>• 200ml San Marzano tomatoes, crushed</li>
                      <li>• 150g fresh mozzarella</li>
                      <li>• 50g anchovy fillets</li>
                      <li>• 100g Kalamata olives, pitted</li>
                      <li>• 2 tbsp capers</li>
                      <li>• 2 cloves garlic, thinly sliced</li>
                      <li>• Red chili flakes</li>
                      <li>• Fresh oregano</li>
                      <li>• Extra virgin olive oil</li>
                    </ul>

                    <p><strong>Method:</strong></p>
                    <ol className="space-y-2 ml-4">
                      <li>1. Prepare pizza dough as per margherita recipe.</li>
                      <li>2. Roll out dough and spread with crushed tomatoes.</li>
                      <li>3. Scatter torn mozzarella, anchovy fillets, olives, and capers.</li>
                      <li>4. Add thinly sliced garlic and a pinch of chili flakes.</li>
                      <li>5. Drizzle with olive oil and season with salt and pepper.</li>
                      <li>6. Bake at 250°C (480°F) for 10-12 minutes.</li>
                      <li>7. Finish with fresh oregano leaves before serving.</li>
                    </ol>
                  </div>
                </div>
              )}

              {activeId === 'pizza-sausage' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light text-foreground tracking-wide">SAUSAGE & FENNEL PIZZA</h1>
                  
                  <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                    <p><strong>For the topping:</strong></p>
                    <ul className="space-y-1 ml-4">
                      <li>• Pizza dough (as above)</li>
                      <li>• 200ml tomato sauce</li>
                      <li>• 150g fresh mozzarella</li>
                      <li>• 200g Italian sausage, casings removed</li>
                      <li>• 1 fennel bulb, thinly sliced</li>
                      <li>• 1 red onion, thinly sliced</li>
                      <li>• 50g Parmesan, grated</li>
                      <li>• Fennel seeds</li>
                      <li>• Fresh rosemary</li>
                      <li>• Extra virgin olive oil</li>
                    </ul>

                    <p><strong>Method:</strong></p>
                    <ol className="space-y-2 ml-4">
                      <li>1. Cook sausage in a pan, breaking into small pieces. Set aside.</li>
                      <li>2. Sauté fennel and red onion until softened.</li>
                      <li>3. Roll out dough and spread with tomato sauce.</li>
                      <li>4. Top with mozzarella, cooked sausage, fennel, and onion.</li>
                      <li>5. Sprinkle with Parmesan and fennel seeds.</li>
                      <li>6. Bake at 250°C (480°F) for 10-12 minutes.</li>
                      <li>7. Garnish with fresh rosemary before serving.</li>
                    </ol>
                  </div>
                </div>
              )}

              {activeId === 'beef-ragu' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light text-foreground tracking-wide">BEEF RAGU, PAPPARDELLE & PARMESAN</h1>
                  
                  <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                    <p><strong>Ingredients:</strong></p>
                    <ul className="space-y-1 ml-4">
                      <li>• 500g beef chuck, diced</li>
                      <li>• 400g pappardelle pasta</li>
                      <li>• 1 onion, finely chopped</li>
                      <li>• 2 carrots, finely chopped</li>
                      <li>• 2 celery stalks, finely chopped</li>
                      <li>• 3 cloves garlic, minced</li>
                      <li>• 800g crushed tomatoes</li>
                      <li>• 250ml red wine</li>
                      <li>• 500ml beef stock</li>
                      <li>• 2 bay leaves</li>
                      <li>• Fresh thyme</li>
                      <li>• Parmesan cheese, grated</li>
                      <li>• Extra virgin olive oil</li>
                    </ul>

                    <p><strong>Method:</strong></p>
                    <ol className="space-y-2 ml-4">
                      <li>1. Heat olive oil in a heavy-bottomed pot. Brown beef pieces on all sides.</li>
                      <li>2. Remove beef and sauté onion, carrots, and celery until softened.</li>
                      <li>3. Add garlic and cook for another minute.</li>
                      <li>4. Return beef to pot, add red wine and let it reduce.</li>
                      <li>5. Add crushed tomatoes, stock, bay leaves, and thyme.</li>
                      <li>6. Bring to a boil, then reduce heat and simmer for 2-3 hours until beef is tender.</li>
                      <li>7. Cook pappardelle according to package instructions.</li>
                      <li>8. Toss pasta with ragu and serve with grated Parmesan.</li>
                    </ol>
                  </div>
                </div>
              )}

              {activeId === 'chili-crab' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light text-foreground tracking-wide">CHILLI CRAB & SWEET CORN LINGUINE</h1>
                  
                  <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                    <p><strong>Ingredients:</strong></p>
                    <ul className="space-y-1 ml-4">
                      <li>• 400g linguine</li>
                      <li>• 300g fresh crab meat</li>
                      <li>• 2 corn cobs, kernels removed</li>
                      <li>• 2 red chilies, finely chopped</li>
                      <li>• 4 cloves garlic, sliced</li>
                      <li>• 1 lemon, zested and juiced</li>
                      <li>• Fresh parsley, chopped</li>
                      <li>• Extra virgin olive oil</li>
                      <li>• White wine</li>
                      <li>• Sea salt and pepper</li>
                    </ul>

                    <p><strong>Method:</strong></p>
                    <ol className="space-y-2 ml-4">
                      <li>1. Cook linguine according to package instructions until al dente.</li>
                      <li>2. Heat olive oil in a large pan and sauté corn kernels until lightly charred.</li>
                      <li>3. Add garlic and chili, cook for 1 minute.</li>
                      <li>4. Add white wine and let it reduce.</li>
                      <li>5. Gently fold in crab meat and warm through.</li>
                      <li>6. Drain pasta and add to the pan with a splash of pasta water.</li>
                      <li>7. Toss everything together with lemon zest, juice, and parsley.</li>
                      <li>8. Season with salt and pepper, serve immediately.</li>
                    </ol>
                  </div>
                </div>
              )}

              {activeId === 'chicken-piri' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light text-foreground tracking-wide">PIRI PIRI CHICKEN</h1>
                  
                  <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                    <p><strong>For the marinade:</strong></p>
                    <ul className="space-y-1 ml-4">
                      <li>• 4 chicken breasts or 1 whole chicken, spatchcocked</li>
                      <li>• 6 piri piri chilies (or 3 red chilies + 1 tsp hot sauce)</li>
                      <li>• 4 cloves garlic</li>
                      <li>• 1 red bell pepper, charred and peeled</li>
                      <li>• 2 tbsp red wine vinegar</li>
                      <li>• 60ml olive oil</li>
                      <li>• 1 tsp smoked paprika</li>
                      <li>• 1 tsp oregano</li>
                      <li>• Salt and pepper</li>
                      <li>• Juice of 1 lemon</li>
                    </ul>

                    <p><strong>Method:</strong></p>
                    <ol className="space-y-2 ml-4">
                      <li>1. Blend all marinade ingredients until smooth.</li>
                      <li>2. Score chicken skin and coat thoroughly with marinade.</li>
                      <li>3. Marinate for at least 2 hours, preferably overnight.</li>
                      <li>4. Preheat grill or oven to high heat.</li>
                      <li>5. Grill chicken for 6-8 minutes per side until cooked through.</li>
                      <li>6. Rest for 5 minutes before serving.</li>
                      <li>7. Serve with extra piri piri sauce on the side.</li>
                    </ol>
                  </div>
                </div>
              )}

              {activeId === 'chimichurri-lamb' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light text-foreground tracking-wide">CHIMICHURRI LAMB</h1>
                  
                  <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                    <p><strong>For the lamb:</strong></p>
                    <ul className="space-y-1 ml-4">
                      <li>• 1kg lamb leg steaks</li>
                      <li>• 2 tbsp olive oil</li>
                      <li>• Salt and pepper</li>
                    </ul>

                    <p><strong>For the chimichurri:</strong></p>
                    <ul className="space-y-1 ml-4">
                      <li>• 1 cup fresh parsley, chopped</li>
                      <li>• 3 cloves garlic, minced</li>
                      <li>• 2 tbsp red wine vinegar</li>
                      <li>• 1/3 cup olive oil</li>
                      <li>• 1 tsp red pepper flakes</li>
                      <li>• 1/2 tsp oregano</li>
                      <li>• Salt and pepper to taste</li>
                    </ul>

                    <p><strong>Method:</strong></p>
                    <ol className="space-y-2 ml-4">
                      <li>1. Mix all chimichurri ingredients in a bowl. Let stand for 30 minutes.</li>
                      <li>2. Season lamb with salt, pepper, and olive oil.</li>
                      <li>3. Heat a grill pan or BBQ to high heat.</li>
                      <li>4. Cook lamb for 3-4 minutes per side for medium-rare.</li>
                      <li>5. Rest meat for 5 minutes before slicing.</li>
                      <li>6. Serve sliced lamb with generous chimichurri spooned over.</li>
                    </ol>
                  </div>
                </div>
              )}

              {activeId === 'flatbread' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light text-foreground tracking-wide">FLATBREAD, OLIVE OIL & SALT</h1>
                  
                  <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                    <p><strong>Ingredients:</strong></p>
                    <ul className="space-y-1 ml-4">
                      <li>• 300g plain flour</li>
                      <li>• 1 tsp salt</li>
                      <li>• 180ml warm water</li>
                      <li>• 3 tbsp olive oil</li>
                      <li>• Extra olive oil for cooking</li>
                      <li>• Flaky sea salt</li>
                      <li>• Fresh herbs (optional)</li>
                    </ul>

                    <p><strong>Method:</strong></p>
                    <ol className="space-y-2 ml-4">
                      <li>1. Mix flour and salt in a bowl.</li>
                      <li>2. Add warm water and olive oil, mix to form a soft dough.</li>
                      <li>3. Knead for 2-3 minutes until smooth.</li>
                      <li>4. Rest for 30 minutes covered.</li>
                      <li>5. Divide into 6 portions and roll very thin.</li>
                      <li>6. Heat a dry pan and cook each flatbread for 1-2 minutes per side.</li>
                      <li>7. Brush with olive oil and sprinkle with sea salt while warm.</li>
                    </ol>
                  </div>
                </div>
              )}

              {activeId === 'tenderstem' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light text-foreground tracking-wide">GRILLED TENDERSTEM, SESAME & CHILLI</h1>
                  
                  <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                    <p><strong>Ingredients:</strong></p>
                    <ul className="space-y-1 ml-4">
                      <li>• 400g tenderstem broccoli</li>
                      <li>• 2 tbsp sesame oil</li>
                      <li>• 1 tbsp soy sauce</li>
                      <li>• 1 red chili, sliced</li>
                      <li>• 2 tbsp sesame seeds</li>
                      <li>• 2 cloves garlic, minced</li>
                      <li>• 1 tsp ginger, grated</li>
                      <li>• Lime juice</li>
                    </ul>

                    <p><strong>Method:</strong></p>
                    <ol className="space-y-2 ml-4">
                      <li>1. Heat grill pan to high heat.</li>
                      <li>2. Toss tenderstem with sesame oil, salt, and pepper.</li>
                      <li>3. Grill for 3-4 minutes until charred and tender.</li>
                      <li>4. Meanwhile, toast sesame seeds in a dry pan.</li>
                      <li>5. Mix soy sauce, garlic, ginger, and chili.</li>
                      <li>6. Toss hot broccoli with dressing and sesame seeds.</li>
                      <li>7. Finish with lime juice and serve immediately.</li>
                    </ol>
                  </div>
                </div>
              )}

              {activeId === 'leek-slaw' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light text-foreground tracking-wide">BURNT LEEK & HERB SLAW</h1>
                  
                  <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                    <p><strong>Ingredients:</strong></p>
                    <ul className="space-y-1 ml-4">
                      <li>• 3 large leeks, halved lengthwise</li>
                      <li>• 1/2 white cabbage, finely shredded</li>
                      <li>• 2 carrots, julienned</li>
                      <li>• 1 cup mixed herbs (parsley, dill, mint)</li>
                      <li>• 3 tbsp olive oil</li>
                      <li>• 2 tbsp lemon juice</li>
                      <li>• 1 tbsp honey</li>
                      <li>• 1 tsp Dijon mustard</li>
                      <li>• Salt and pepper</li>
                    </ul>

                    <p><strong>Method:</strong></p>
                    <ol className="space-y-2 ml-4">
                      <li>1. Char leeks on a grill until blackened outside but tender inside.</li>
                      <li>2. Cool and roughly chop, including some charred bits.</li>
                      <li>3. Combine cabbage, carrots, and herbs in a large bowl.</li>
                      <li>4. Whisk together olive oil, lemon juice, honey, and mustard.</li>
                      <li>5. Add charred leeks to the slaw mixture.</li>
                      <li>6. Toss with dressing and season with salt and pepper.</li>
                      <li>7. Let stand for 15 minutes before serving.</li>
                    </ol>
                  </div>
                </div>
              )}

              {activeId === 'beetroot-labneh' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-light text-foreground tracking-wide">EMBER-BAKED BEETROOT, LABNEH</h1>
                  
                  <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                    <p><strong>Ingredients:</strong></p>
                    <ul className="space-y-1 ml-4">
                      <li>• 6 medium beetroots</li>
                      <li>• 200g labneh or thick Greek yogurt</li>
                      <li>• 50g walnuts, roughly chopped</li>
                      <li>• 2 tbsp honey</li>
                      <li>• 1 tbsp balsamic vinegar</li>
                      <li>• Olive oil</li>
                      <li>• Fresh thyme</li>
                      <li>• Sea salt and pepper</li>
                    </ul>

                    <p><strong>Method:</strong></p>
                    <ol className="space-y-2 ml-4">
                      <li>1. Wrap whole beetroots in foil with olive oil and thyme.</li>
                      <li>2. Bake at 200°C for 1-1.5 hours until tender.</li>
                      <li>3. Cool and peel beetroots, then slice into wedges.</li>
                      <li>4. Spread labneh on serving plate.</li>
                      <li>5. Arrange beetroot wedges over labneh.</li>
                      <li>6. Drizzle with honey and balsamic vinegar.</li>
                      <li>7. Top with chopped walnuts and fresh thyme.</li>
                      <li>8. Season with salt and pepper, finish with olive oil.</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Navigation */}
            <div className="order-1 lg:order-2 lg:border-l lg:border-border lg:pl-8">
              <nav className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3 tracking-wide">PIZZA</h3>
                  <ul className="space-y-2">
                    {pizzaItems.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => setActiveId(item.id as RecipeId)}
                          className={`text-left text-sm transition-colors hover:text-foreground ${
                            activeId === item.id ? 'text-foreground font-medium' : 'text-muted-foreground'
                          }`}
                        >
                          {item.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3 tracking-wide">MAINS</h3>
                  <ul className="space-y-2">
                    {mainsItems.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => setActiveId(item.id as RecipeId)}
                          className={`text-left text-sm transition-colors hover:text-foreground ${
                            activeId === item.id ? 'text-foreground font-medium' : 'text-muted-foreground'
                          }`}
                        >
                          {item.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3 tracking-wide">SIDES</h3>
                  <ul className="space-y-2">
                    {sidesItems.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => setActiveId(item.id as RecipeId)}
                          className={`text-left text-sm transition-colors hover:text-foreground ${
                            activeId === item.id ? 'text-foreground font-medium' : 'text-muted-foreground'
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
          </div>
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
}