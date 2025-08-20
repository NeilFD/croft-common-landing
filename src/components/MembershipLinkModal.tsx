import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CroftLogo from '@/components/CroftLogo';
import { supabase } from '@/integrations/supabase/client';
import { getStoredUserHandle } from '@/lib/biometricAuth';

interface MembershipLinkModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

const MembershipLinkModal: React.FC<MembershipLinkModalProps> = ({ open, onClose, onSuccess }) => {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userHandle = useMemo(() => getStoredUserHandle(), [open]);

  const startLink = async () => {
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('start-membership-link', {
      body: { userHandle: userHandle || null, email: email.trim().toLowerCase() }
    });
    setLoading(false);
    if (error) {
      const msg = String((error as any)?.message ?? '');
      if (msg.includes('not_subscribed')) setError('That email is not an active subscriber.');
      else if (msg.includes('invalid_email')) setError('Please enter a valid email.');
      else setError('Could not send code. Please try again.');
      return;
    }
    if ((data as any)?.error === 'not_subscribed') {
      setError('That email is not an active subscriber.');
      return;
    }
    setStep('code');
  };

  const verifyLink = async () => {
    setError(null);
    if (code.trim().length < 4) {
      setError('Enter the 6‑digit code from your email.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('verify-membership-link', {
      body: { userHandle: userHandle || null, email: email.trim().toLowerCase(), code: code.trim() }
    });
    setLoading(false);
    if (error || (data as any)?.error) {
      setError('Invalid or expired code. Please try again.');
      return;
    }
    onSuccess(email.trim().toLowerCase());
  };

  const reset = () => {
    setStep('email');
    setEmail('');
    setCode('');
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { 
      if (!v) { reset(); onClose(); } 
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <CroftLogo size="sm" />
            <span className="font-brutalist text-foreground tracking-wider">CROFT COMMON</span>
          </div>
          <DialogTitle className="font-brutalist text-foreground text-xl tracking-wider">
            Link your membership
          </DialogTitle>
          <DialogDescription className="font-industrial text-muted-foreground">
            {step === 'email' 
              ? 'Enter your subscription email to link your membership to this device.'
              : 'Enter the 6-digit code we sent to your email.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'email' ? (
            <>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              {error && <p className="font-industrial text-destructive text-sm">{error}</p>}
              <div className="flex gap-3">
                <Button 
                  className="flex-1" 
                  onClick={startLink} 
                  disabled={loading}
                >
                  {loading ? 'Sending…' : 'Send code'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => { reset(); onClose(); }} 
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <Input
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
                maxLength={6}
              />
              {error && <p className="font-industrial text-destructive text-sm">{error}</p>}
              <div className="flex gap-3">
                <Button 
                  className="flex-1" 
                  onClick={verifyLink} 
                  disabled={loading}
                >
                  {loading ? 'Verifying…' : 'Verify'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setStep('email')} 
                  disabled={loading}
                >
                  Back
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MembershipLinkModal;