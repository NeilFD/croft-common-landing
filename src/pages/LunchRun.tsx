import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLunchRun } from '@/hooks/useLunchRun';
import { useCMSMode } from '@/contexts/CMSModeContext';
import Navigation from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ShoppingCart, CheckCircle, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import denBg from '@/assets/den-bg.jpg';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

interface OrderItem extends MenuItem {
  quantity: number;
}

export default function LunchRun() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isCMSMode } = useCMSMode();
  const { loading, menu, submitting, orderDate, submitOrder } = useLunchRun();

  const [cart, setCart] = useState<OrderItem[]>([]);
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [orderStep, setOrderStep] = useState<'menu' | 'details' | 'confirm'>('menu');
  const [orderComplete, setOrderComplete] = useState(false);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [orderStep]);

  React.useEffect(() => {
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
  }, [user?.id]);

  const addToCart = (item: MenuItem) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) setCart(cart.filter(c => c.id !== id));
    else setCart(cart.map(c => c.id === id ? { ...c, quantity: qty } : c));
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const canSubmit = memberName.trim() && memberPhone.trim() && address.trim() && cart.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const result = await submitOrder({
      orderDate,
      collectionTime: '00:00',
      items: cart,
      totalAmount: total,
      memberName: memberName.trim(),
      memberPhone: memberPhone.trim(),
      notes: `Delivery to: ${address.trim()}${notes ? ` — ${notes.trim()}` : ''}`,
    });
    if (result?.success) setOrderComplete(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {!isCMSMode && <Navigation />}
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const allItems = [...menu.sandwiches, ...menu.beverages];

  return (
    <div className="min-h-screen relative">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url(${denBg})`, filter: 'grayscale(1) contrast(1.05)' }}
      />
      <div className="fixed inset-0 bg-white/80 z-0" />

      <div className="relative z-10">
        {!isCMSMode && <Navigation />}
        <div className="container mx-auto px-4 py-6 max-w-5xl" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 140px)' }}>
          <button
            onClick={() => navigate('/den/member')}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to the Den
          </button>

          <div className="text-center mb-10">
            <p className="font-mono text-[10px] md:text-xs tracking-[0.5em] uppercase text-muted-foreground mb-3">Members Only</p>
            <h1 className="font-display uppercase text-4xl md:text-6xl tracking-tight leading-none mb-3">CB Home Delivery</h1>
            <p className="font-sans text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
              Thai, to your door. Order anytime.
            </p>
          </div>

          <div className="space-y-6">
            {orderStep === 'menu' && (
              <>
                {['starter', 'main', 'dessert'].map(cat => {
                  const items = allItems.filter(i => i.category === cat);
                  if (!items.length) return null;
                  const label = cat === 'main' ? 'Mains' : cat === 'starter' ? 'Starters' : 'Desserts';
                  return (
                    <Card key={cat} className="border-2 border-black bg-white">
                      <CardHeader>
                        <CardTitle className="font-display uppercase tracking-wide">{label}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {items.map(item => {
                            const inCart = cart.find(c => c.id === item.id);
                            const qty = inCart?.quantity || 0;
                            return (
                              <div key={item.id} className={`border-2 rounded-lg p-4 flex flex-col ${qty > 0 ? 'border-pink-500' : 'border-black'}`}>
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-semibold">{item.name}</h3>
                                  <Badge variant="secondary">£{item.price.toFixed(2)}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4 flex-grow">{item.description}</p>
                                {qty > 0 ? (
                                  <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" className="w-8 h-8 p-0" onClick={() => updateQty(item.id, qty - 1)}>-</Button>
                                    <span className="font-medium text-sm min-w-[3rem] text-center">{qty} in cart</span>
                                    <Button size="sm" variant="outline" className="w-8 h-8 p-0" onClick={() => updateQty(item.id, qty + 1)}>+</Button>
                                  </div>
                                ) : (
                                  <Button size="sm" onClick={() => addToCart(item)} className="w-full">Add to Order</Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                <Card className="border-2 border-black bg-white">
                  <CardHeader>
                    <CardTitle className="font-display uppercase tracking-wide">Drinks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {menu.beverages.map(b => {
                        const inCart = cart.find(c => c.id === b.id);
                        const qty = inCart?.quantity || 0;
                        return (
                          <div key={b.id} className={`border-2 rounded-lg p-3 text-center ${qty > 0 ? 'border-pink-500' : 'border-black'}`}>
                            <h4 className="font-medium mb-1 text-sm">{b.name}</h4>
                            <Badge variant="outline" className="mb-2 text-xs">£{b.price.toFixed(2)}</Badge>
                            {qty > 0 ? (
                              <div className="flex items-center gap-1 justify-center">
                                <Button size="sm" variant="outline" className="w-7 h-7 p-0" onClick={() => updateQty(b.id, qty - 1)}>-</Button>
                                <span className="font-medium text-xs px-1">{qty}</span>
                                <Button size="sm" variant="outline" className="w-7 h-7 p-0" onClick={() => updateQty(b.id, qty + 1)}>+</Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={() => addToCart(b)}>Add</Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {cart.length > 0 && (
                  <Card className="border-2 border-black bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Your Order</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        {cart.map(i => (
                          <div key={i.id} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                            <span className="text-sm font-medium">{i.quantity}x {i.name}</span>
                            <span className="font-medium">£{(i.price * i.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-3" />
                      <div className="flex justify-between font-semibold text-lg mb-4">
                        <span>Total</span>
                        <span>£{total.toFixed(2)}</span>
                      </div>
                      <Button onClick={() => setOrderStep('details')} className="w-full">Continue to Delivery Details</Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {orderStep === 'details' && (
              <Card className="border-2 border-black bg-white">
                <CardHeader>
                  <CardTitle>Delivery Details</CardTitle>
                  <CardDescription>Tell us where to send it.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="memberName">Full Name *</Label>
                    <Input id="memberName" value={memberName} onChange={(e) => setMemberName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="memberPhone">Phone *</Label>
                    <Input id="memberPhone" value={memberPhone} onChange={(e) => setMemberPhone(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="address">Delivery Address *</Label>
                    <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="Street, postcode" />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Buzzer, allergies, etc." />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => setOrderStep('menu')}>Back</Button>
                    <Button onClick={() => setOrderStep('confirm')} disabled={!canSubmit} className="flex-1">Review</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {orderStep === 'confirm' && (
              <Card className="border-2 border-black bg-white">
                <CardHeader>
                  <CardTitle>Confirm Order</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm space-y-1">
                    <p><strong>Name:</strong> {memberName}</p>
                    <p><strong>Phone:</strong> {memberPhone}</p>
                    <p><strong>Address:</strong> {address}</p>
                    {notes && <p><strong>Notes:</strong> {notes}</p>}
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    {cart.map(i => (
                      <div key={i.id} className="flex justify-between text-sm">
                        <span>{i.quantity}x {i.name}</span>
                        <span>£{(i.price * i.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>£{total.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setOrderStep('details')}>Back</Button>
                    <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                      {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Placing</> : 'Place Order'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Dialog open={orderComplete} onOpenChange={setOrderComplete}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" /> Order Placed
                  </DialogTitle>
                  <DialogDescription>
                    On its way. We'll be in touch on {memberPhone} when it leaves.
                  </DialogDescription>
                </DialogHeader>
                <Button onClick={() => navigate('/den/member')}>Back to the Den</Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
