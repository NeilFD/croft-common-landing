import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown } from 'lucide-react';
import { CMSText } from './cms/CMSText';
import { INTEREST_OPTIONS } from '@/data/interests';

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
        <CMSText
          page="global"
          section="subscription_form"
          contentKey="title"
          fallback="STEP CLOSER"
          className={`font-brutalist text-2xl md:text-3xl mb-4 ${variant === 'footer' ? 'text-background' : 'text-foreground'}`}
          as="h3"
        />
        <CMSText
          page="global"
          section="subscription_form"
          contentKey="description"
          fallback="Not everything gets broadcast. Cross the line. Stay in the know.<br /><br />The Common Room - for membership, not members."
          className={`font-industrial text-lg max-w-xl mx-auto ${variant === 'footer' ? 'text-background/70' : 'text-foreground/70'}`}
          as="p"
        />
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

        <CMSText
          page="global"
          section="subscription_form"
          contentKey="prompt_text"
          fallback="We need a little of your time to learn a bit about you, click below (mandatory, sorry)"
          className={`text-sm font-industrial text-center ${variant === 'footer' ? 'text-background/70' : 'text-foreground/70'}`}
          as="p"
        />

        {/* Optional fields toggle */}
        <div className="text-center">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className="font-brutalist text-sm uppercase tracking-wider border-2 border-accent-pink bg-accent-pink text-background hover:bg-background hover:text-foreground transition-all duration-300"
          >
            <ChevronDown className={`w-4 h-4 mr-2 transition-transform duration-300 ${showOptionalFields ? 'rotate-180' : ''}`} />
            <CMSText
              page="global"
              section="subscription_form"
              contentKey="personalize_button_text"
              fallback={showOptionalFields ? "FEWER OPTIONS" : "PERSONALISE YOUR EXPERIENCE"}
              className=""
              as="div"
            />
          </Button>
        </div>

        {/* Mandatory preferences */}
        {showOptionalFields && (
          <div className={`space-y-6 p-6 border-2 border-accent-pink bg-background ${
            variant === 'footer' ? 'bg-background/95' : 'bg-background'
          }`}>
            <div className="grid gap-4">
              <Input
                type="tel"
                placeholder="Phone number (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="font-industrial border border-foreground/30 bg-background text-foreground placeholder:text-foreground/50 focus:border-accent-pink"
              />
              
              {/* Birthday (day & month) */}
              <div>
                <Label className="text-sm font-brutalist uppercase tracking-wide mb-3 block text-foreground">
                  Birthday (day & month)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Select value={birthdayDay} onValueChange={setBirthdayDay}>
                    <SelectTrigger className="font-industrial border-2 border-foreground/30 bg-background text-foreground focus:border-accent-pink">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-2 border-accent-pink z-50">
                      {dayOptions.map((day) => (
                        <SelectItem key={day} value={day} className="font-industrial text-foreground hover:bg-accent-pink hover:text-background">
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={birthdayMonth} onValueChange={setBirthdayMonth}>
                    <SelectTrigger className="font-industrial border-2 border-foreground/30 bg-background text-foreground focus:border-accent-pink">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-2 border-accent-pink z-50">
                      {monthOptions.map((month) => (
                        <SelectItem key={month} value={month} className="font-industrial text-foreground hover:bg-accent-pink hover:text-background">
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
              <Label className="text-sm font-brutalist uppercase tracking-wide mb-3 block text-foreground">
                What interests you? <span className="text-accent-pink">*</span>
              </Label>
              <div className="space-y-2">
                {INTEREST_OPTIONS.map((option) => (
                  <div key={option} className="flex items-center space-x-3 p-2 border border-foreground/20 hover:border-accent-pink transition-colors bg-background">
                    <Checkbox
                      id={`interest-${option}`}
                      checked={interests.includes(option)}
                      onCheckedChange={() => toggleInterest(option)}
                      className="border-2 border-foreground data-[state=checked]:bg-accent-pink data-[state=checked]:text-background"
                    />
                    <Label 
                      htmlFor={`interest-${option}`} 
                      className="text-sm font-industrial cursor-pointer flex-1 text-foreground"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
              {interests.length === 0 && (
                <p className="text-xs font-industrial mt-2 text-foreground/70">
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
          disabled={isLoading || !showOptionalFields || interests.length === 0}
          className={`w-full font-industrial uppercase tracking-wide ${
            variant === 'footer' 
              ? 'bg-background text-void hover:bg-background/90' 
              : ''
          }`}
        >
          {isLoading ? (
            <CMSText
              page="global"
              section="subscription_form"
              contentKey="loading_text"
              fallback="JOINING..."
              className=""
              as="div"
            />
          ) : (
            <CMSText
              page="global"
              section="subscription_form"
              contentKey="submit_button_text"
              fallback="FOR COMMON PEOPLE"
              className=""
              as="div"
            />
          )}
        </Button>
        
        <CMSText
          page="global"
          section="subscription_form"
          contentKey="disclaimer_text"
          fallback="Subscribers receive exclusive access to The Common Room and community updates."
          className={`text-xs font-industrial text-center ${variant === 'footer' ? 'text-background/50' : 'text-foreground/50'}`}
          as="p"
        />
      </form>
    </div>
  );
};

export default SubscriptionForm;