import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLunchRun } from '@/hooks/useLunchRun';
import { useCMSMode } from '@/contexts/CMSModeContext';
import OptimizedNavigation from '@/components/OptimizedNavigation';
import OptimizedFooter from '@/components/OptimizedFooter';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Clock, Users, ShoppingCart, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Sandwich images mapping
const getSandwichImage = (sandwichName: string) => {
  const imageMap: { [key: string]: string } = {
    'The Med': '/lovable-uploads/35ecafad-f268-4164-9069-284e858ea4d3.png',
    'The Reuben': '/lovable-uploads/d5333fba-f3da-4177-8a9c-ff249b061320.png',
    'The Capo': '/lovable-uploads/87a8b2d5-1d02-499b-8bfb-322d4b602944.png',
    'The Deli': '/lovable-uploads/464c5a05-161f-4732-b508-f8c7df8c7b7b.png'
  };
  return imageMap[sandwichName];
};

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
}

interface TimeSlot {
  id: string;
  time: string;
  displayTime: string;
  available: boolean;
  ordersCount: number;
  maxOrders: number;
  spotsLeft: number;
}

interface OrderItem extends MenuItem {
  quantity: number;
}

export default function LunchRun() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isCMSMode } = useCMSMode();
  const { loading, menu, availability, submitting, orderDate, submitOrder } = useLunchRun();

  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [orderStep, setOrderStep] = useState<'time' | 'menu' | 'details' | 'confirm'>('time');
  const [orderComplete, setOrderComplete] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Fetch user profile data when component mounts
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      
      setProfileLoading(true);
      try {
        const { data: profile, error } = await supabase
          .from('member_profiles_extended')
          .select('display_name')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        if (profile?.display_name && !memberName) {
          setMemberName(profile.display_name);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user?.id, memberName]);

  const addToCart = (item: MenuItem, quantity: number = 1) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + quantity }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity }]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      ));
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getSandwichCount = () => {
    return cart.filter(item => item.category === 'sandwich')
                .reduce((sum, item) => sum + item.quantity, 0);
  };

  const canProceedToMenu = () => {
    return selectedTimeSlot && availability?.available && availability?.userCanOrder;
  };

  const canProceedToDetails = () => {
    const sandwichCount = getSandwichCount();
    return cart.length > 0 && sandwichCount > 0 && sandwichCount <= 2;
  };

  const canSubmitOrder = () => {
    return memberName.trim() && memberPhone.trim() && cart.length > 0;
  };

  const handleSubmitOrder = async () => {
    if (!canSubmitOrder()) return;

    const orderData = {
      orderDate,
      collectionTime: selectedTimeSlot,
      items: cart,
      totalAmount: getCartTotal(),
      memberName: memberName.trim(),
      memberPhone: memberPhone.trim(),
      notes: notes.trim() || undefined
    };

    const result = await submitOrder(orderData);
    if (result?.success) {
      setOrderComplete(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        {!isCMSMode && <OptimizedNavigation />}
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        {!isCMSMode && <OptimizedFooter />}
      </div>
    );
  }

  if (!availability?.available) {
    return (
      <div className="min-h-screen">
        {!isCMSMode && <OptimizedNavigation />}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">The Lunch Run</h1>
            <Card>
              <CardContent className="p-8">
                <p className="text-lg mb-4">{availability?.reason || 'Lunch Run is not available'}</p>
                <p className="text-muted-foreground">
                  Monday to Friday. Sixty sandwiches. Four builds. Order by 11am. Collect from the counter. Easy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        {!isCMSMode && <OptimizedFooter />}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {!isCMSMode && <OptimizedNavigation />}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">The Lunch Run</h1>
            <p className="text-lg text-muted-foreground">
              Monday to Friday. Sixty sandwiches. Four builds. Order by 11am. Collect from the counter. Easy.
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <Badge variant="outline">
                <Users className="w-4 h-4 mr-1" />
                {availability.totalSandwichesLeft} left today
              </Badge>
              <Badge variant="outline">
                <ShoppingCart className="w-4 h-4 mr-1" />
                {availability.userSandwichCount}/2 ordered
              </Badge>
            </div>
          </div>

          {/* Order Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {['time', 'menu', 'details', 'confirm'].map((step, index) => (
                <React.Fragment key={step}>
                  <div className={`flex items-center space-x-2 ${
                    orderStep === step ? 'text-primary' : 
                    ['time', 'menu', 'details', 'confirm'].indexOf(orderStep) > index ? 'text-green-600' : 'text-muted-foreground'
                  }`}>
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                      orderStep === step ? 'border-primary bg-primary text-primary-foreground' :
                      ['time', 'menu', 'details', 'confirm'].indexOf(orderStep) > index ? 'border-green-600 bg-green-600 text-white' : 'border-muted-foreground'
                    }`}>
                      {['time', 'menu', 'details', 'confirm'].indexOf(orderStep) > index ? 
                        <CheckCircle className="w-4 h-4" /> : index + 1
                      }
                    </div>
                    <span className="capitalize font-medium">{step === 'time' ? 'Collection Time' : step}</span>
                  </div>
                  {index < 3 && <div className="w-8 h-px bg-muted-foreground"></div>}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step 1: Time Selection */}
          {orderStep === 'time' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Select Collection Time
                </CardTitle>
                <CardDescription>
                  Choose when you'd like to collect your order (12:00 PM - 1:30 PM)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {availability.timeSlots?.map((slot: TimeSlot) => (
                    <Button
                      key={slot.id}
                      variant={selectedTimeSlot === slot.time ? "default" : "outline"}
                      className="h-auto p-4 flex flex-col"
                      disabled={!slot.available}
                      onClick={() => setSelectedTimeSlot(slot.time)}
                    >
                      <div className="font-semibold">{slot.displayTime}</div>
                      <div className="text-xs mt-1">
                        {slot.spotsLeft} spots left
                      </div>
                    </Button>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <Button 
                    onClick={() => setOrderStep('menu')}
                    disabled={!canProceedToMenu()}
                  >
                    Continue to Menu
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Menu Selection */}
          {orderStep === 'menu' && (
            <div className="space-y-6">
              {/* Sandwiches */}
              <Card>
                <CardHeader>
                  <CardTitle>Sandwiches</CardTitle>
                  <CardDescription>Choose up to 2 sandwiches (you have {2 - getSandwichCount()} remaining)</CardDescription>
                </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {menu.sandwiches.map((sandwich) => {
                    const sandwichImage = getSandwichImage(sandwich.name);
                    return (
                      <div key={sandwich.id} className="border rounded-lg overflow-hidden">
                        {sandwichImage && (
                          <div className="aspect-video w-full">
                            <img
                              src={sandwichImage}
                              alt={sandwich.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg">{sandwich.name}</h3>
                            <Badge variant="secondary">£{sandwich.price.toFixed(2)}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">{sandwich.description}</p>
                          <Button
                            size="sm"
                            onClick={() => addToCart(sandwich)}
                            disabled={getSandwichCount() >= 2}
                            className="w-full"
                          >
                            Add to Order
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              </Card>

              {/* Beverages */}
              <Card>
                <CardHeader>
                  <CardTitle>Beverages</CardTitle>
                  <CardDescription>Add some drinks to your order</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {menu.beverages.map((beverage) => (
                      <div key={beverage.id} className="border rounded-lg p-3 text-center">
                        <h4 className="font-medium mb-1">{beverage.name}</h4>
                        <Badge variant="outline" className="mb-2">£{beverage.price.toFixed(2)}</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addToCart(beverage)}
                          className="w-full"
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Cart Summary */}
              {cart.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Order</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{item.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                              >
                                -
                              </Button>
                              <span>{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                disabled={item.category === 'sandwich' && getSandwichCount() >= 2}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                          <div className="text-right">
                            <div>£{(item.price * item.quantity).toFixed(2)}</div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-4" />
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total</span>
                      <span>£{getCartTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" onClick={() => setOrderStep('time')}>
                        Back
                      </Button>
                      <Button 
                        onClick={() => setOrderStep('details')}
                        disabled={!canProceedToDetails()}
                        className="flex-1"
                      >
                        Continue to Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 3: Member Details */}
          {orderStep === 'details' && (
            <Card>
              <CardHeader>
                <CardTitle>Member Details</CardTitle>
                <CardDescription>We need your details for order collection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="memberName">Full Name *</Label>
                  <Input
                    id="memberName"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="memberPhone">Phone Number *</Label>
                  <Input
                    id="memberPhone"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    placeholder="Your phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Special Instructions (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests or dietary requirements"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setOrderStep('menu')}>
                    Back to Menu
                  </Button>
                  <Button 
                    onClick={() => setOrderStep('confirm')}
                    disabled={!canSubmitOrder()}
                    className="flex-1"
                  >
                    Review Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Confirmation */}
          {orderStep === 'confirm' && (
            <Card>
              <CardHeader>
                <CardTitle>Confirm Your Order</CardTitle>
                <CardDescription>Please review your order before submitting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Collection Details</h3>
                  <p>Time: {availability.timeSlots?.find((slot: TimeSlot) => slot.time === selectedTimeSlot)?.displayTime}</p>
                  <p>Date: {new Date(orderDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Member Details</h3>
                  <p>Name: {memberName}</p>
                  <p>Phone: {memberPhone}</p>
                  {notes && <p>Notes: {notes}</p>}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Order Summary</h3>
                  <div className="space-y-1">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span>£{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>£{getCartTotal().toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setOrderStep('details')}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      'Place Order'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Complete Dialog */}
          <Dialog open={orderComplete} onOpenChange={setOrderComplete}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Order Confirmed!
                </DialogTitle>
                <DialogDescription className="space-y-2">
                  <p>Your lunch order has been placed successfully.</p>
                  <p>Collection: {availability.timeSlots?.find((slot: TimeSlot) => slot.time === selectedTimeSlot)?.displayTime}</p>
                  <p className="text-sm text-muted-foreground mt-4">
                    You will receive a confirmation and we'll have your order ready for collection at the counter.
                  </p>
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end">
                <Button onClick={() => window.history.back()}>
                  Back to Member Area
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {!isCMSMode && <OptimizedFooter />}
    </div>
  );
}