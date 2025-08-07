import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionFormProps {
  variant?: 'footer' | 'homepage';
  className?: string;
}

const SubscriptionForm = ({ variant = 'footer', className = '' }: SubscriptionFormProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !consent) {
      toast({
        title: "Required fields missing",
        description: "Please provide your email and consent to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('subscribe-newsletter', {
        body: { email, name: name || undefined, consent }
      });

      if (error) throw error;

      toast({
        title: "You're in!",
        description: "Check your email for Common Room access instructions.",
      });

      // Reset form
      setEmail('');
      setName('');
      setConsent(false);
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
      {isHomepage && (
        <div className="text-center mb-8">
          <h3 className="font-brutalist text-2xl md:text-3xl mb-4 text-foreground">
            STEP CLOSER
          </h3>
          <p className="font-industrial text-lg text-foreground/70 max-w-xl mx-auto">
            Not everything gets broadcast. Cross the line. Stay in the know. The Common Room - membership, not members.
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <div className="grid gap-3">
          <Input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
        
        <div className="flex items-start space-x-3">
          <Checkbox
            id="consent"
            checked={consent}
            onCheckedChange={(checked) => setConsent(checked as boolean)}
            className="mt-1"
          />
          <label 
            htmlFor="consent" 
            className="text-sm font-industrial text-foreground/70 leading-relaxed"
          >
            I consent to receiving emails from Croft Common and agree to the{' '}
            <a href="/privacy" className="underline hover:text-foreground">
              privacy policy
            </a>
          </label>
        </div>
        
        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full font-industrial uppercase tracking-wide"
        >
          {isLoading ? 'JOINING...' : 'JOIN THE COMMON'}
        </Button>
        
        {isHomepage && (
          <p className="text-xs font-industrial text-foreground/50 text-center">
            Subscribers receive exclusive access to The Common Room and community updates.
          </p>
        )}
      </form>
    </div>
  );
};

export default SubscriptionForm;