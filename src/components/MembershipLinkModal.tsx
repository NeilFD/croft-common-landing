import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
  console.log('🔗 MembershipLinkModal rendered with open:', open);
  console.log('🔗 Dialog should be', open ? 'VISIBLE' : 'HIDDEN');
  
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Temporarily remove Supabase dependency for debugging
  // const userHandle = useMemo(() => getStoredUserHandle(), [open]);
  const userHandle = 'debug-user';

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
      console.log('🔗 Dialog onOpenChange called with:', v);
      if (!v) { reset(); onClose(); } 
    }}>
      <DialogContent className="border-4 border-red-500 bg-yellow-400 z-[9999] fixed top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-[500px] max-w-[90vw]">
        <div className="space-y-4 p-4">
          <div className="text-black text-2xl font-bold bg-red-500 p-2 rounded text-center">
            🚨 DEBUG MODAL - Should be VERY visible! 🚨
          </div>
          <div className="text-black text-lg">
            Open state: {open ? 'TRUE' : 'FALSE'}
          </div>
          <div className="text-black text-lg">
            Step: {step}
          </div>
          <Button onClick={() => { 
            console.log('🔗 Close button clicked'); 
            onClose(); 
          }} className="w-full bg-red-600 hover:bg-red-700 text-white">
            Close Modal (DEBUG)
          </Button>
          
          {/* Simplified original content */}
          <div className="space-y-2 bg-white p-4 rounded">
            <div className="flex items-center gap-3">
              <CroftLogo size="sm" />
              <span className="font-brutalist text-black tracking-wider">CROFT COMMON</span>
            </div>
            {step === 'email' && (
              <>
                <h2 className="font-brutalist text-black text-xl tracking-wider">Link your membership</h2>
                <p className="font-industrial text-black">Enter the email (DEBUG - simplified):</p>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="bg-white text-black border-2 border-gray-500"
                />
                {error && <p className="font-industrial text-red-600 text-sm">{error}</p>}
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => {
                    console.log('🔗 Send code clicked (SIMPLIFIED - will just show success)');
                    onSuccess('debug@test.com');
                  }} disabled={loading}>
                    {loading ? 'Sending…' : 'Send code (DEBUG)'}
                  </Button>
                  <Button variant="outline" onClick={() => { reset(); onClose(); }} disabled={loading}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MembershipLinkModal;