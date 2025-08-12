import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionFormProps {
  variant?: 'footer' | 'homepage';
  className?: string;
}

const SubscriptionForm = ({ variant = 'footer', className = '' }: SubscriptionFormProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const { toast } = useToast();

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 
    'Nut-free', 'Halal', 'Kosher', 'Keto', 'Pescatarian'
  ];

  const interestOptions = [
    'Beer', 'Cocktails', 'Wine', 'Coffee', 'Live Music', 
    'Comedy', 'Cinema', 'Cooking', 'Art', 'Networking',
    'Community Events', 'Private Dining'
  ];

  const toggleDietaryPreference = (preference: string) => {
    setDietaryPreferences(prev => 
      prev.includes(preference) 
        ? prev.filter(p => p !== preference)
        : [...prev, preference]
    );
  };

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

    setIsLoading(true);
    
    try {
      const profileData = {
        email, 
        name, 
        consent,
        phone: phone || null,
        birthday: birthday || null,
        dietaryPreferences: dietaryPreferences.length > 0 ? dietaryPreferences : null,
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
      setBirthday('');
      setDietaryPreferences([]);
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
            variant="ghost"
            size="sm"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className={`font-industrial text-sm ${variant === 'footer' ? 'text-background/70 hover:text-background' : 'text-foreground/70 hover:text-foreground'}`}
          >
            {showOptionalFields ? '− Less options' : '+ Help us personalize your experience'}
          </Button>
        </div>

        {/* Optional fields */}
        {showOptionalFields && (
          <div className="space-y-4 p-4 rounded-lg bg-muted/20">
            <div className="grid gap-3">
              <Input
                type="tel"
                placeholder="Phone number (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="font-industrial"
              />
              <Input
                type="date"
                placeholder="Birthday (optional)"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="font-industrial"
              />
            </div>

            {/* Dietary preferences */}
            <div>
              <Label className={`text-sm font-industrial ${variant === 'footer' ? 'text-background/90' : 'text-foreground/90'}`}>
                Dietary Preferences (optional)
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {dietaryOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dietary-${option}`}
                      checked={dietaryPreferences.includes(option)}
                      onCheckedChange={() => toggleDietaryPreference(option)}
                      className={variant === 'footer' ? 'border-background data-[state=checked]:bg-background data-[state=checked]:text-void' : ''}
                    />
                    <Label 
                      htmlFor={`dietary-${option}`} 
                      className={`text-xs font-industrial ${variant === 'footer' ? 'text-background/70' : 'text-foreground/70'}`}
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div>
              <Label className={`text-sm font-industrial ${variant === 'footer' ? 'text-background/90' : 'text-foreground/90'}`}>
                Interests (optional)
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {interestOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`interest-${option}`}
                      checked={interests.includes(option)}
                      onCheckedChange={() => toggleInterest(option)}
                      className={variant === 'footer' ? 'border-background data-[state=checked]:bg-background data-[state=checked]:text-void' : ''}
                    />
                    <Label 
                      htmlFor={`interest-${option}`} 
                      className={`text-xs font-industrial ${variant === 'footer' ? 'text-background/70' : 'text-foreground/70'}`}
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
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