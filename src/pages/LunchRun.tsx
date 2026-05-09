import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLunchRun, type Site, type MenuItem } from '@/hooks/useLunchRun';
import { useCMSMode } from '@/contexts/CMSModeContext';
import Navigation from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import heroThai from '@/assets/cb-hero-thai.jpg';
import townFood from '@/assets/cb-carousel-new/town-06.jpg';
import countryFood from '@/assets/cb-carousel-new/country-05.jpg';

interface OrderItem extends MenuItem {
  quantity: number;
}

const SITE_KEY = 'cb_thai_site';
const cartKey = (site: Site) => `cb_thai_cart_${site}`;

const SITE_INFO: Record<Site, { label: string; address: string; phone: string; image: string }> = {
  town: {
    label: 'Town — Beaconsfield',
    address: '75 Wycombe End, Beaconsfield HP9 1LX',
    phone: '01494 673 086',
    image: townFood,
  },
  country: {
    label: 'Country — Stadhampton',
    address: 'Bear Lane, Stadhampton OX44 7UR',
    phone: '01865 890 714',
    image: countryFood,
  },
};

const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="font-mono text-[10px] tracking-[0.5em] uppercase text-white/60 mb-3">{children}</p>
);

const SiteTag: React.FC<{ site: 'town' | 'country' | 'both' }> = ({ site }) => {
  const label = site === 'both' ? 'Both' : site === 'town' ? 'Town' : 'Country';
  return (
    <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/60 border border-white/30 px-2 py-0.5">
      {label}
    </span>
  );
};

export default function LunchRun() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isCMSMode } = useCMSMode();

  const [site, setSite] = useState<Site | null>(() => {
    try {
      const s = localStorage.getItem(SITE_KEY);
      return s === 'town' || s === 'country' ? s : null;
    } catch {
      return null;
    }
  });

  const { loading, menu, submitting, submitOrder } = useLunchRun(site);

  const [cart, setCart] = useState<OrderItem[]>([]);
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'menu' | 'details' | 'confirm'>('menu');
  const [orderRef, setOrderRef] = useState<string | null>(null);

  // Persist site
  useEffect(() => {
    if (site) localStorage.setItem(SITE_KEY, site);
  }, [site]);

  // Hydrate cart per site
  useEffect(() => {
    if (!site) return;
    try {
      const raw = localStorage.getItem(cartKey(site));
      setCart(raw ? JSON.parse(raw) : []);
    } catch {
      setCart([]);
    }
    setStep('menu');
  }, [site]);

  // Persist cart
  useEffect(() => {
    if (!site) return;
    try {
      localStorage.setItem(cartKey(site), JSON.stringify(cart));
    } catch {
      /* noop */
    }
  }, [cart, site]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Prefill from cb_members
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id || memberName) return;
      const { data: cb } = await (supabase as any)
        .from('cb_members')
        .select('first_name, last_name, phone')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cb) {
        const name = [cb.first_name, cb.last_name].filter(Boolean).join(' ');
        if (name) setMemberName(name);
        if (cb.phone) setMemberPhone(cb.phone);
      }
    };
    fetchProfile();
  }, [user?.id, memberName]);

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const addToCart = (item: MenuItem) => {
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      setCart(cart.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };
  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) setCart(cart.filter((c) => c.id !== id));
    else setCart(cart.map((c) => (c.id === id ? { ...c, quantity: qty } : c)));
  };

  const handleSwitchSite = (next: Site) => {
    if (cart.length > 0 && site && next !== site) {
      const ok = window.confirm('Switching site will clear your basket. Continue?');
      if (!ok) return;
      try {
        localStorage.removeItem(cartKey(site));
      } catch {
        /* noop */
      }
      setCart([]);
    }
    setSite(next);
  };

  const canSubmit = !!site && memberName.trim() && memberPhone.trim() && cart.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || !site) return;
    const result = await submitOrder({
      site,
      items: cart,
      totalAmount: total,
      memberName: memberName.trim(),
      memberPhone: memberPhone.trim(),
      notes: notes.trim() || undefined,
    });
    if (result?.success) {
      setOrderRef(result.orderRef || null);
      setCart([]);
      try {
        localStorage.removeItem(cartKey(site));
      } catch {
        /* noop */
      }
    }
  };

  // ===== Site picker =====
  if (!site) {
    return (
      <div className="min-h-screen bg-black text-white">
        {!isCMSMode && <Navigation />}
        <div
          className="container mx-auto px-6 pb-20 max-w-5xl"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 140px)' }}
        >
          <button
            onClick={() => navigate('/den/member')}
            className="inline-flex items-center font-mono text-[10px] tracking-[0.4em] uppercase text-white/60 hover:text-white transition-colors mb-10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to the Den
          </button>

          <div className="text-center mb-12">
            <Eyebrow>Members Only / Collection</Eyebrow>
            <h1 className="font-display uppercase text-4xl sm:text-5xl md:text-6xl tracking-tight leading-none mb-4">
              Thai Takeaway
            </h1>
            <p className="font-sans text-base md:text-lg text-white/75 max-w-md mx-auto">
              Pick your bear. Order in. Collect when it's bagged.
            </p>
          </div>

          <div className="relative h-40 md:h-56 mb-10 overflow-hidden border border-white/15">
            <img src={heroThai} alt="Thai food" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/15">
            {(['town', 'country'] as Site[]).map((s) => {
              const info = SITE_INFO[s];
              return (
                <button
                  key={s}
                  onClick={() => setSite(s)}
                  className="group relative bg-black p-8 md:p-10 text-left hover:bg-white/[0.04] transition-colors min-h-[260px] overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity">
                    <img src={info.image} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
                  </div>
                  <div className="relative">
                    <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/60">
                      Collect from
                    </p>
                    <p className="mt-3 font-display uppercase text-3xl md:text-4xl tracking-tight">
                      {s === 'town' ? 'Town' : 'Country'}
                    </p>
                    <p className="mt-2 font-sans text-sm text-white/75">{info.address}</p>
                    <span className="mt-6 inline-block font-mono text-[10px] tracking-[0.4em] uppercase text-white/60 group-hover:text-white">
                      Order &rarr;
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const info = SITE_INFO[site];

  // ===== Loading =====
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin opacity-60" />
      </div>
    );
  }

  // ===== Menu / Details / Confirm =====
  return (
    <div className="min-h-screen bg-black text-white">
      {!isCMSMode && <Navigation />}

      <div
        className="container mx-auto px-6 pb-32 max-w-4xl"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 140px)' }}
      >
        <button
          onClick={() => navigate('/den/member')}
          className="inline-flex items-center font-mono text-[10px] tracking-[0.4em] uppercase text-white/60 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to the Den
        </button>

        {/* Header */}
        <div className="mb-10">
          <Eyebrow>Members Only / Collection</Eyebrow>
          <h1 className="font-display uppercase text-4xl md:text-5xl tracking-tight leading-none">
            Thai Takeaway
          </h1>

          {/* Site switcher */}
          <div className="mt-6 inline-flex border border-white/25">
            {(['town', 'country'] as Site[]).map((s) => (
              <button
                key={s}
                onClick={() => handleSwitchSite(s)}
                className={`font-mono text-[10px] tracking-[0.4em] uppercase px-4 py-2 transition-colors ${
                  site === s ? 'bg-white text-black' : 'bg-transparent text-white/70 hover:text-white'
                }`}
              >
                {s === 'town' ? 'Town' : 'Country'}
              </button>
            ))}
          </div>
          <p className="mt-3 font-sans text-sm text-white/65">
            Collect from {info.address}.
          </p>
        </div>

        {/* MENU STEP */}
        {step === 'menu' && (
          <>
            {/* Banner */}
            <div className="relative h-32 md:h-40 mb-10 overflow-hidden border border-white/15">
              <img
                src={info.image}
                alt={`${info.label} kitchen`}
                className="w-full h-full object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-white/70">
                  Hot. Fast. Fragrant.
                </p>
                <p className="font-display uppercase text-2xl md:text-3xl tracking-tight">
                  Thailand via {site === 'town' ? 'Beaconsfield' : 'Stadhampton'}
                </p>
              </div>
            </div>

            {(
              [
                ['smallPlates', 'Small Plates'],
                ['largePlates', 'Large Plates'],
                ['curries', 'Curries'],
                ['sides', 'Sides'],
                ['desserts', 'Puddings'],
              ] as const
            ).map(([key, label]) => {
              const items = menu[key];
              if (!items.length) return null;
              return (
                <section key={key} className="mb-12">
                  <div className="flex items-baseline justify-between mb-4 border-b border-white/15 pb-3">
                    <h2 className="font-display uppercase text-2xl tracking-tight">{label}</h2>
                    <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-white/50">
                      {items.length} {items.length === 1 ? 'dish' : 'dishes'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((item) => {
                      const inCart = cart.find((c) => c.id === item.id);
                      const qty = inCart?.quantity || 0;
                      const selected = qty > 0;
                      return (
                        <div
                          key={item.id}
                          className={`p-5 border transition-colors ${
                            selected
                              ? 'bg-white text-black border-white'
                              : 'bg-black text-white border-white/20 hover:border-white/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="font-display uppercase text-lg tracking-tight leading-tight">
                              {item.name}
                            </h3>
                            <span className="font-mono text-sm whitespace-nowrap">
                              £{item.price.toFixed(2)}
                            </span>
                          </div>
                          {item.description && (
                            <p
                              className={`font-sans text-sm leading-relaxed mb-4 ${
                                selected ? 'text-black/70' : 'text-white/70'
                              }`}
                            >
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between gap-3">
                            <SiteTag site={item.site} />
                            {selected ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateQty(item.id, qty - 1)}
                                  className="w-8 h-8 border border-black/40 hover:bg-black hover:text-white transition-colors font-mono"
                                  aria-label="Decrease quantity"
                                >
                                  −
                                </button>
                                <span className="font-mono text-sm min-w-[2.5rem] text-center">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => updateQty(item.id, qty + 1)}
                                  className="w-8 h-8 border border-black/40 hover:bg-black hover:text-white transition-colors font-mono"
                                  aria-label="Increase quantity"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                className="font-mono text-[10px] tracking-[0.4em] uppercase border border-white/40 px-4 py-2 hover:bg-white hover:text-black transition-colors"
                              >
                                Add
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}

            {!menu.starters.length && !menu.mains.length && !menu.desserts.length && (
              <div className="border border-white/15 p-8 text-center">
                <p className="font-sans text-white/70">Nothing available at {info.label} right now.</p>
              </div>
            )}
          </>
        )}

        {/* DETAILS STEP */}
        {step === 'details' && (
          <div className="border border-white/20 p-6 md:p-8">
            <Eyebrow>Step 2 / Your details</Eyebrow>
            <h2 className="font-display uppercase text-3xl tracking-tight mb-6">Who's collecting?</h2>
            <div className="space-y-5">
              <div>
                <label className="block font-mono text-[10px] tracking-[0.4em] uppercase text-white/60 mb-2">
                  Name *
                </label>
                <input
                  className="w-full bg-transparent border border-white/30 px-4 py-3 font-sans text-white placeholder:text-white/30 focus:outline-none focus:border-white"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="First and last"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] tracking-[0.4em] uppercase text-white/60 mb-2">
                  Phone *
                </label>
                <input
                  className="w-full bg-transparent border border-white/30 px-4 py-3 font-sans text-white placeholder:text-white/30 focus:outline-none focus:border-white"
                  value={memberPhone}
                  onChange={(e) => setMemberPhone(e.target.value)}
                  placeholder="So we can call when it's ready"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] tracking-[0.4em] uppercase text-white/60 mb-2">
                  Notes
                </label>
                <textarea
                  className="w-full bg-transparent border border-white/30 px-4 py-3 font-sans text-white placeholder:text-white/30 focus:outline-none focus:border-white min-h-[100px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Allergies, heat level, anything else"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep('menu')}
                  className="font-mono text-[10px] tracking-[0.4em] uppercase border border-white/40 px-5 py-3 hover:bg-white hover:text-black transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  disabled={!canSubmit}
                  className="flex-1 font-mono text-[10px] tracking-[0.4em] uppercase border border-white bg-white text-black px-5 py-3 hover:bg-black hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Review
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRM STEP */}
        {step === 'confirm' && (
          <div className="border border-white/20 p-6 md:p-8">
            <Eyebrow>Step 3 / Confirm</Eyebrow>
            <h2 className="font-display uppercase text-3xl tracking-tight mb-6">Ready?</h2>

            <div className="space-y-2 font-sans text-sm text-white/80 mb-6">
              <p>
                <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/50">
                  Collect at
                </span>{' '}
                {info.address}
              </p>
              <p>
                <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/50">
                  Name
                </span>{' '}
                {memberName}
              </p>
              <p>
                <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/50">
                  Phone
                </span>{' '}
                {memberPhone}
              </p>
              {notes && (
                <p>
                  <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/50">
                    Notes
                  </span>{' '}
                  {notes}
                </p>
              )}
            </div>

            <div className="border-t border-white/15 pt-4 mb-6 space-y-2">
              {cart.map((i) => (
                <div key={i.id} className="flex justify-between font-sans text-sm">
                  <span>
                    {i.quantity} × {i.name}
                  </span>
                  <span className="font-mono">£{(i.price * i.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-baseline border-t border-white/15 pt-4 mb-6">
              <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/60">
                Total
              </span>
              <span className="font-display text-3xl tracking-tight">£{total.toFixed(2)}</span>
            </div>

            <p className="font-sans text-xs text-white/50 mb-6 leading-relaxed">
              Pay on collection. We'll call when it's bagged — usually about 30 minutes.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('details')}
                className="font-mono text-[10px] tracking-[0.4em] uppercase border border-white/40 px-5 py-3 hover:bg-white hover:text-black transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 font-mono text-[10px] tracking-[0.4em] uppercase border border-white bg-white text-black px-5 py-3 hover:bg-black hover:text-white transition-colors disabled:opacity-40 inline-flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Placing
                  </>
                ) : (
                  'Place Order'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sticky basket bar */}
      {step === 'menu' && cart.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white text-black border-t border-black z-40">
          <div className="container mx-auto max-w-4xl px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <ShoppingBag className="h-5 w-5 shrink-0" />
              <div className="min-w-0">
                <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-black/60">
                  Basket / {cart.reduce((s, i) => s + i.quantity, 0)} items
                </p>
                <p className="font-display text-xl tracking-tight">£{total.toFixed(2)}</p>
              </div>
            </div>
            <button
              onClick={() => setStep('details')}
              className="font-mono text-[10px] tracking-[0.4em] uppercase bg-black text-white px-5 py-3 hover:bg-white hover:text-black border border-black transition-colors"
            >
              Continue &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      <Dialog open={!!orderRef} onOpenChange={(o) => !o && (setOrderRef(null), navigate('/den/member'))}>
        <DialogContent className="bg-black text-white border border-white/20 max-w-md">
          <div className="text-center py-4">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-4 opacity-90" />
            <Eyebrow>Order placed</Eyebrow>
            <h2 className="font-display uppercase text-3xl tracking-tight mb-3">It's in.</h2>
            <p className="font-sans text-sm text-white/75 mb-6 leading-relaxed">
              We'll call {memberPhone} when it's bagged. Usually about 30 minutes.
            </p>
            <div className="border border-white/20 p-4 mb-6 text-left space-y-1">
              <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-white/50">
                Reference
              </p>
              <p className="font-mono text-lg tracking-wider">#{orderRef}</p>
              <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-white/50 pt-2">
                Collect from
              </p>
              <p className="font-sans text-sm">{info.address}</p>
            </div>
            <button
              onClick={() => {
                setOrderRef(null);
                navigate('/den/member');
              }}
              className="w-full font-mono text-[10px] tracking-[0.4em] uppercase border border-white bg-white text-black px-5 py-3 hover:bg-black hover:text-white transition-colors"
            >
              Back to the Den
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
