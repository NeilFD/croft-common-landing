import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown } from 'lucide-react';

interface SubscriptionFormProps {
  variant?: 'footer' | 'homepage';
  className?: string;
}

const SubscriptionForm = ({ variant = 'footer', className = '' }: SubscriptionFormProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthdayDay, setBirthdayDay] = useState('');
  const [birthdayMonth, setBirthdayMonth] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const { toast } = useToast();

  const interestOptions = [
    'Private Events & Bookings',
    'Corporate Hospitality',
    'Wine Tastings & Masterclasses',
    'Cocktail Masterclasses',
    'Beer & Brewing Events',
    'Cooking Classes',
    'Art & Creative Workshops',
    'Networking Events',
    'Live Music & Entertainment',
    'Special Occasions & Celebrations',
    'Wedding & Party Catering',
    'Business Meetings & Workspace'
  ];

  const dayOptions = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name || !consent) {
      toast({
        title: "Required fields missing",
        description: "Please provide your name, email and consent to continue.",
        variant: "destructive",
      });
      return;
    }

    if (showOptionalFields && interests.length === 0) {
      toast({
        title: "Interests required",
        description: "Please select at least one interest to help us personalise your experience.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('DEBUG: birthdayDay:', birthdayDay, 'birthdayMonth:', birthdayMonth);
      const birthday = birthdayDay && birthdayMonth ? `${birthdayDay}/${birthdayMonth}` : null;
      console.log('DEBUG: constructed birthday:', birthday);
      
      const profileData = {
        email, 
        name, 
        consent,
        phone: phone || null,
        birthday,
        interests: interests.length > 0 ? interests : null
      };

      const { data, error } = await supabase.functions.invoke('subscribe-newsletter', {
        body: profileData
      });

      if (error) throw error;

      toast({
        title: "You're in!",
        description: "Check your email to complete authentication and link your notifications.",
      });

      // Reset form
      setEmail('');
      setName('');
      setPhone('');
      setBirthdayDay('');
      setBirthdayMonth('');
      setInterests([]);
      setConsent(false);
      setShowOptionalFields(false);
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isHomepage = variant === 'homepage';

  return (
    <div className={className}>
      <div className="text-center mb-8">
        <h3 className={`font-brutalist text-2xl md:text-3xl mb-4 ${variant === 'footer' ? 'text-background' : 'text-foreground'}`}>
          STEP CLOSER
        </h3>
        <p className={`font-industrial text-lg max-w-xl mx-auto ${variant === 'footer' ? 'text-background/70' : 'text-foreground/70'}`}>
          Not everything gets broadcast. Cross the line. Stay in the know.
          <br /><br />
          The Common Room - for membership, not members.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <div className="grid gap-3">
          <Input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="font-industrial"
          />
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="font-industrial"
          />
        </div>

        {/* Optional fields toggle */}
        <div className="text-center">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className={`font-brutalist text-sm uppercase tracking-wider border-2 transition-all duration-300 ${
              variant === 'footer' 
                ? 'border-background text-background hover:bg-background hover:text-void' 
                : 'border-foreground text-foreground hover:bg-foreground hover:text-background'
            } ${showOptionalFields ? 'animate-pulse' : ''}`}
          >
            <ChevronDown className={`w-4 h-4 mr-2 transition-transform duration-300 ${showOptionalFields ? 'rotate-180' : ''}`} />
            {showOptionalFields ? 'FEWER OPTIONS' : 'PERSONALISE YOUR EXPERIENCE'}
          </Button>
        </div>

        {/* Mandatory preferences */}
        {showOptionalFields && (
          <div className={`space-y-6 p-6 border-2 ${
            variant === 'footer' 
              ? 'border-background bg-void/20' 
              : 'border-foreground bg-surface'
          }`}>
            <div className="grid gap-4">
              <Input
                type="tel"
                placeholder="Phone number (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`font-industrial border-2 ${
                  variant === 'footer' 
                    ? 'border-background/50 bg-transparent text-background placeholder:text-background/50' 
                    : 'border-foreground/50'
                }`}
              />
              
              {/* Birthday (day & month) */}
              <div>
                <Label className={`text-sm font-brutalist uppercase tracking-wide mb-3 block ${
                  variant === 'footer' ? 'text-background' : 'text-foreground'
                }`}>
                  Birthday (day & month)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Select value={birthdayDay} onValueChange={setBirthdayDay}>
                    <SelectTrigger className={`font-industrial border-2 ${
                      variant === 'footer' 
                        ? 'border-background/50 bg-transparent text-background' 
                        : 'border-foreground/50'
                    }`}>
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {dayOptions.map((day) => (
                        <SelectItem key={day} value={day} className="font-industrial">
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={birthdayMonth} onValueChange={setBirthdayMonth}>
                    <SelectTrigger className={`font-industrial border-2 ${
                      variant === 'footer' 
                        ? 'border-background/50 bg-transparent text-background' 
                        : 'border-foreground/50'
                    }`}>
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((month) => (
                        <SelectItem key={month} value={month} className="font-industrial">
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Interests - Now mandatory and multiple select */}
            <div>
              <Label className={`text-sm font-brutalist uppercase tracking-wide mb-3 block ${
                variant === 'footer' ? 'text-background' : 'text-foreground'
              }`}>
                What interests you? <span className="text-accent-pink">*</span>
              </Label>
              <div className="space-y-2">
                {interestOptions.map((option) => (
                  <div key={option} className={`flex items-center space-x-3 p-2 border ${
                    variant === 'footer' 
                      ? 'border-background/30 hover:border-background/60' 
                      : 'border-foreground/30 hover:border-foreground/60'
                  } transition-colors`}>
                    <Checkbox
                      id={`interest-${option}`}
                      checked={interests.includes(option)}
                      onCheckedChange={() => toggleInterest(option)}
                      className={`border-2 ${
                        variant === 'footer' 
                          ? 'border-background data-[state=checked]:bg-background data-[state=checked]:text-void' 
                          : 'border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background'
                      }`}
                    />
                    <Label 
                      htmlFor={`interest-${option}`} 
                      className={`text-sm font-industrial cursor-pointer flex-1 ${
                        variant === 'footer' ? 'text-background/90' : 'text-foreground/90'
                      }`}
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
              {interests.length === 0 && (
                <p className={`text-xs font-industrial mt-2 ${
                  variant === 'footer' ? 'text-background/50' : 'text-foreground/50'
                }`}>
                  Please select at least one area of interest.
                </p>
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-start space-x-3">
          <Checkbox
            id="consent"
            checked={consent}
            onCheckedChange={(checked) => setConsent(checked as boolean)}
            className={`mt-1 ${variant === 'footer' ? 'border-background data-[state=checked]:bg-background data-[state=checked]:text-void' : 'border-foreground data-[state=checked]:bg-background data-[state=checked]:text-foreground'}`}
          />
          <label 
            htmlFor="consent" 
            className={`text-sm font-industrial leading-relaxed ${variant === 'footer' ? 'text-background/70' : 'text-foreground/70'}`}
          >
            I consent to receiving emails from Croft Common and agree to the{' '}
            <a href="/privacy" className={`underline ${variant === 'footer' ? 'hover:text-background' : 'hover:text-foreground'}`}>
              privacy policy
            </a>
          </label>
        </div>
        
        <Button 
          type="submit" 
          disabled={isLoading}
          className={`w-full font-industrial uppercase tracking-wide ${
            variant === 'footer' 
              ? 'bg-background text-void hover:bg-background/90' 
              : ''
          }`}
        >
          {isLoading ? 'JOINING...' : 'FOR COMMON PEOPLE'}
        </Button>
        
        <p className={`text-xs font-industrial text-center ${variant === 'footer' ? 'text-background/50' : 'text-foreground/50'}`}>
          Subscribers receive exclusive access to The Common Room and community updates.
        </p>
      </form>
    </div>
  );
};

export default SubscriptionForm;