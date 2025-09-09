import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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

  // Scroll to top when order step changes
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [orderStep]);

  // Fetch user profile data when component mounts
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      
      setProfileLoading(true);
      try {
        // Try to get display name from profile
        const { data: profile, error } = await supabase
          .from('member_profiles_extended')
          .select('display_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          // Fallback to auth user metadata if profile query fails
          if (user?.user_metadata) {
            const firstName = user.user_metadata.first_name || '';
            const lastName = user.user_metadata.last_name || '';
            if (firstName && lastName) {
              setMemberName(`${firstName} ${lastName}`);
            } else if (firstName) {
              setMemberName(firstName);
            }
          }
          setProfileLoading(false);
          return;
        }

        if (profile?.display_name) {
          setMemberName(profile.display_name);
        } else if (user?.user_metadata) {
          // Use first_name + last_name from auth metadata
          const firstName = user.user_metadata.first_name || '';
          const lastName = user.user_metadata.last_name || '';
          if (firstName && lastName) {
            setMemberName(`${firstName} ${lastName}`);
          } else if (firstName) {
            setMemberName(firstName);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    // Only fetch if we don't already have a name and user exists
    if (!memberName && user?.id) {
      fetchUserProfile();
    }
  }, [user?.id]); // Only depend on user.id, not memberName

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
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">The Lunch Run</h1>
            <Card>
              <CardContent className="p-6 md:p-8">
                <p className="text-base md:text-lg mb-4">{availability?.reason || 'Lunch Run is not available'}</p>
                <p className="text-sm md:text-base text-muted-foreground">
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
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">The Lunch Run</h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Monday to Friday. Sixty sandwiches. Four builds. Order by 11am. Collect from the counter. Easy.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Badge variant="outline" className="text-xs md:text-sm">
              <Users className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              {availability.totalSandwichesLeft} left today
            </Badge>
            <Badge variant="outline" className="text-xs md:text-sm">
              <ShoppingCart className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              {availability.userSandwichCount}/2 ordered
            </Badge>
          </div>
        </div>

        {/* Mobile-Optimized Order Steps */}
        <div className="mb-6">
          {/* Desktop Progress Steps */}
          <div className="hidden md:flex items-center justify-center space-x-4">
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

          {/* Mobile Progress Dots */}
          <div className="md:hidden flex items-center justify-center space-x-2">
            {['time', 'menu', 'details', 'confirm'].map((step, index) => (
              <div key={step} className={`w-3 h-3 rounded-full ${
                orderStep === step ? 'bg-primary' : 
                ['time', 'menu', 'details', 'confirm'].indexOf(orderStep) > index ? 'bg-green-600' : 'bg-muted-foreground'
              }`}>
              </div>
            ))}
          </div>
          
          {/* Mobile Step Title */}
          <div className="md:hidden text-center mt-2">
            <span className="text-sm font-medium text-primary capitalize">
              Step {['time', 'menu', 'details', 'confirm'].indexOf(orderStep) + 1}: {
                orderStep === 'time' ? 'Collection Time' : 
                orderStep === 'menu' ? 'Menu Selection' :
                orderStep === 'details' ? 'Your Details' : 'Confirm Order'
              }
            </span>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {availability.timeSlots?.map((slot: TimeSlot) => (
                    <Button
                      key={slot.id}
                      variant={selectedTimeSlot === slot.time ? "default" : "outline"}
                      className="h-auto p-3 flex flex-col text-center"
                      disabled={!slot.available}
                      onClick={() => setSelectedTimeSlot(slot.time)}
                    >
                      <span className="font-semibold text-sm md:text-base">{slot.displayTime}</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {slot.available ? `${slot.spotsLeft} spots left` : 'Full'}
                      </span>
                    </Button>
                  ))}
                </div>
                <div className="flex justify-end mt-6">
                  <Button 
                    onClick={() => setOrderStep('menu')}
                    disabled={!canProceedToMenu()}
                    className="w-full sm:w-auto"
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {menu.sandwiches.map((sandwich) => {
                    const sandwichImage = getSandwichImage(sandwich.name);
                    const inCart = cart.find(item => item.id === sandwich.id);
                    const quantity = inCart?.quantity || 0;
                    
                    return (
                      <div key={sandwich.id} className={`border rounded-lg overflow-hidden flex flex-col ${quantity > 0 ? 'ring-2 ring-primary' : ''}`}>
                        {sandwichImage && (
                          <div className="aspect-[4/3] w-full relative">
                            <img
                              src={sandwichImage}
                              alt={sandwich.name}
                              className="w-full h-full object-cover"
                            />
                            {quantity > 0 && (
                              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm">
                                {quantity}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="p-4 flex flex-col flex-grow">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-base md:text-lg">{sandwich.name}</h3>
                            <Badge variant="secondary" className="ml-2 shrink-0">£{sandwich.price.toFixed(2)}</Badge>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground mb-4 flex-grow leading-relaxed">{sandwich.description}</p>
                          
                          {quantity > 0 ? (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCartQuantity(sandwich.id, quantity - 1)}
                                className="flex-shrink-0 w-8 h-8 p-0"
                              >
                                -
                              </Button>
                              <span className="font-medium text-center text-sm min-w-[4rem]">
                                {quantity} in cart
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCartQuantity(sandwich.id, quantity + 1)}
                                disabled={getSandwichCount() >= 2}
                                className="flex-shrink-0 w-8 h-8 p-0"
                              >
                                +
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => addToCart(sandwich)}
                              disabled={getSandwichCount() >= 2}
                              className="w-full"
                            >
                              Add to Order
                            </Button>
                          )}
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {menu.beverages.map((beverage) => {
                      const inCart = cart.find(item => item.id === beverage.id);
                      const quantity = inCart?.quantity || 0;
                      
                      return (
                        <div key={beverage.id} className={`border rounded-lg p-3 text-center relative ${quantity > 0 ? 'ring-2 ring-primary' : ''}`}>
                          {quantity > 0 && (
                            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center font-bold text-xs">
                              {quantity}
                            </div>
                          )}
                          <h4 className="font-medium mb-1 text-sm">{beverage.name}</h4>
                          <Badge variant="outline" className="mb-2 text-xs">£{beverage.price.toFixed(2)}</Badge>
                          
                          {quantity > 0 ? (
                            <div className="flex items-center gap-1 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCartQuantity(beverage.id, quantity - 1)}
                                className="w-7 h-7 p-0 text-xs"
                              >
                                -
                              </Button>
                              <span className="font-medium text-xs px-1 min-w-[1.5rem]">{quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCartQuantity(beverage.id, quantity + 1)}
                                className="w-7 h-7 p-0 text-xs"
                              >
                                +
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addToCart(beverage)}
                              className="w-full text-xs h-7"
                            >
                              Add
                            </Button>
                          )}
                        </div>
                      );
                    })}
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
                    <div className="space-y-3 mb-4">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <span className="font-medium text-sm md:text-base">{item.name}</span>
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                className="w-7 h-7 p-0"
                              >
                                -
                              </Button>
                              <span className="text-sm min-w-[1.5rem] text-center">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                disabled={item.category === 'sandwich' && getSandwichCount() >= 2}
                                className="w-7 h-7 p-0"
                              >
                                +
                              </Button>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-medium">£{(item.price * item.quantity).toFixed(2)}</div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(item.id)}
                              className="text-destructive hover:text-destructive text-xs h-6 mt-1 p-1"
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
                    <div className="flex flex-col sm:flex-row gap-2 mt-4">
                      <Button variant="outline" onClick={() => setOrderStep('time')} className="w-full sm:w-auto">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button variant="outline" onClick={() => setOrderStep('menu')} className="w-full sm:w-auto">
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
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2 text-sm md:text-base">Collection Details</h3>
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Time:</span> {availability.timeSlots?.find((slot: TimeSlot) => slot.time === selectedTimeSlot)?.displayTime}</p>
                      <p><span className="font-medium">Date:</span> {new Date(orderDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2 text-sm md:text-base">Member Details</h3>
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Name:</span> {memberName}</p>
                      <p><span className="font-medium">Phone:</span> {memberPhone}</p>
                      {notes && <p><span className="font-medium">Notes:</span> {notes}</p>}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 text-sm md:text-base">Order Summary</h3>
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="font-medium">£{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between font-semibold text-base md:text-lg">
                      <span>Total</span>
                      <span>£{getCartTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => setOrderStep('details')} className="w-full sm:w-auto">
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
            <DialogContent className="mx-4 max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Order Confirmed!
                </DialogTitle>
                <DialogDescription className="space-y-2 text-sm">
                  <p>Your lunch order has been placed successfully.</p>
                  <p><span className="font-medium">Collection:</span> {availability.timeSlots?.find((slot: TimeSlot) => slot.time === selectedTimeSlot)?.displayTime}</p>
                  <p className="text-xs text-muted-foreground mt-4">
                    You will receive a confirmation and we'll have your order ready for collection at the counter.
                  </p>
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end">
                <Button onClick={() => navigate('/common-room/member')} className="w-full sm:w-auto">
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

// Mobile optimized lunch run interface - v2