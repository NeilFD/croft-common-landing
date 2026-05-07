import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { INTEREST_OPTIONS } from '@/data/interests';

const CBSubscriptionForm = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthdayDay, setBirthdayDay] = useState('');
  const [birthdayMonth, setBirthdayMonth] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const { toast } = useToast();

  const dayOptions = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !consent) {
      toast({
        title: 'A few details first',
        description: 'Please give us your name, email and consent to continue.',
        variant: 'destructive',
      });
      return;
    }
    if (showOptional && interests.length === 0) {
      toast({
        title: 'Pick an interest',
        description: 'Choose at least one so we can tailor what we send.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const birthday = birthdayDay && birthdayMonth ? `${birthdayDay}/${birthdayMonth}` : null;
      const { error } = await supabase.functions.invoke('subscribe-newsletter', {
        body: {
          email,
          name,
          consent,
          phone: phone || null,
          birthday,
          interests: interests.length > 0 ? interests : null,
        },
      });
      if (error) throw error;

      toast({
        title: 'Welcome to the den',
        description: 'Check your email to finish signing in.',
      });
      setEmail('');
      setName('');
      setPhone('');
      setBirthdayDay('');
      setBirthdayMonth('');
      setInterests([]);
      setConsent(false);
      setShowOptional(false);
    } catch (err: any) {
      toast({
        title: 'Sign up failed',
        description: err?.message || 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto text-white">
      <div className="text-center mb-8">
        <h3 className="font-display uppercase text-3xl md:text-4xl tracking-tight">
          The Bear's Den
        </h3>
        <p className="mt-3 font-cb-mono text-[10px] md:text-xs tracking-[0.4em] uppercase opacity-70">
          Town &nbsp;/&nbsp; Country
        </p>
        <p className="mt-5 font-cb-sans text-base md:text-lg leading-relaxed opacity-80">
          Quiet rooms. Loud nights. The odd surprise. Sign up and the bear remembers you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3">
          <Input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="font-cb-sans bg-transparent border-white/30 text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:border-white rounded-none h-12"
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="font-cb-sans bg-transparent border-white/30 text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:border-white rounded-none h-12"
          />
        </div>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setShowOptional((v) => !v)}
            className="font-cb-mono text-[10px] md:text-xs tracking-[0.4em] uppercase border border-white/40 px-5 py-3 hover:bg-white hover:text-black transition-colors"
          >
            {showOptional ? 'Less' : 'Tell the bear more'}
          </button>
        </div>

        {showOptional && (
          <div className="space-y-6 p-6 border border-white/20 bg-white/[0.03]">
            <Input
              type="tel"
              placeholder="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="font-cb-sans bg-transparent border-white/30 text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:border-white rounded-none h-12"
            />

            <div>
              <Label className="font-cb-mono text-[10px] tracking-[0.4em] uppercase mb-3 block opacity-80">
                Birthday (day &amp; month)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Select value={birthdayDay} onValueChange={setBirthdayDay}>
                  <SelectTrigger className="font-cb-sans bg-transparent border-white/30 text-white rounded-none h-12 focus:ring-0">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border border-white/30 text-white">
                    {dayOptions.map((d) => (
                      <SelectItem key={d} value={d} className="font-cb-sans focus:bg-white focus:text-black">
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={birthdayMonth} onValueChange={setBirthdayMonth}>
                  <SelectTrigger className="font-cb-sans bg-transparent border-white/30 text-white rounded-none h-12 focus:ring-0">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border border-white/30 text-white">
                    {monthOptions.map((m) => (
                      <SelectItem key={m} value={m} className="font-cb-sans focus:bg-white focus:text-black">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="font-cb-mono text-[10px] tracking-[0.4em] uppercase mb-3 block opacity-80">
                What pulls you in?
              </Label>
              <div className="space-y-2">
                {INTEREST_OPTIONS.map((option) => (
                  <div
                    key={option}
                    className="flex items-center gap-3 p-3 border border-white/15 hover:border-white/60 transition-colors"
                  >
                    <Checkbox
                      id={`cb-interest-${option}`}
                      checked={interests.includes(option)}
                      onCheckedChange={() => toggleInterest(option)}
                      className="border-white/60 data-[state=checked]:bg-white data-[state=checked]:text-black rounded-none"
                    />
                    <Label
                      htmlFor={`cb-interest-${option}`}
                      className="font-cb-sans text-sm cursor-pointer flex-1"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 pt-2">
          <Checkbox
            id="cb-consent"
            checked={consent}
            onCheckedChange={(v) => setConsent(v as boolean)}
            className="mt-1 border-white/60 data-[state=checked]:bg-white data-[state=checked]:text-black rounded-none"
          />
          <label htmlFor="cb-consent" className="font-cb-sans text-sm leading-relaxed opacity-80">
            I'm happy for The Crazy Bear to email me. See the{' '}
            <a href="/privacy" className="underline hover:text-white">privacy policy</a>.
          </label>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-none bg-white text-black hover:bg-white/90 font-cb-mono text-xs tracking-[0.4em] uppercase"
        >
          {isLoading ? 'Signing you in...' : 'Enter the den'}
        </Button>

        <p className="font-cb-mono text-[10px] tracking-[0.3em] uppercase text-center opacity-50 pt-2">
          Members hear first. Town and Country. No noise in between.
        </p>
      </form>
    </div>
  );
};

export default CBSubscriptionForm;
