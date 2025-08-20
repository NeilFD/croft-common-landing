import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MembershipLinkModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

const MembershipLinkModal: React.FC<MembershipLinkModalProps> = ({ open, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'sent' | 'code' | 'success'>('input');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('start-membership-link', {
        body: { email: email.trim() }
      });

      if (error) {
        setError(error.message || 'Failed to send verification email');
        return;
      }

      if (data?.ok) {
        setStep('code');
        toast.success('Verification code sent! Please check your inbox.');
      } else {
        setError(data?.error || 'Email not found in our membership records');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Membership link error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('verify-membership-link', {
        body: { 
          email: email.trim(),
          code: code.trim(),
          userHandle: `user_${Date.now()}` // Generate a unique handle
        }
      });

      if (error) {
        setError(error.message || 'Failed to verify code');
        return;
      }

      if (data?.ok) {
        setStep('success');
        onSuccess(email);
        toast.success('Membership verified successfully!');
        // Auto-close modal after a brief delay
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        const errorMsg = data?.error || 'Invalid verification code';
        if (errorMsg.includes('expired')) {
          setError('Verification code has expired. Please request a new one.');
        } else if (errorMsg.includes('already_used') || errorMsg.includes('consumed')) {
          setError('This code has already been used. Please request a new one.');
        } else if (errorMsg.includes('invalid')) {
          setError('Invalid verification code. Please check and try again.');
        } else {
          setError(errorMsg);
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Code verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setCode('');
    setStep('input');
    setError('');
    onClose();
  };

  const renderContent = () => {
    switch (step) {
      case 'input':
        return (
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[hsl(var(--charcoal))] font-industrial">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your membership email"
                  className="border-[hsl(var(--sage-green))] focus:border-[hsl(var(--accent-sage-green))]"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="flex-1 bg-[hsl(var(--sage-green))] hover:bg-[hsl(var(--accent-sage-green))] text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Code
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        );

      case 'code':
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-[hsl(var(--charcoal-light))]">
                We've sent a 6-digit code to <strong>{email}</strong>
              </p>
            </div>
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-[hsl(var(--charcoal))] font-industrial">
                  Verification Code
                </Label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="border-[hsl(var(--sage-green))] focus:border-[hsl(var(--accent-sage-green))] text-center text-lg tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('input')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="flex-1 bg-[hsl(var(--sage-green))] hover:bg-[hsl(var(--accent-sage-green))] text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </Button>
              </div>
            </form>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <div>
              <h3 className="font-industrial text-lg text-[hsl(var(--charcoal))] mb-2">
                Membership Verified!
              </h3>
              <p className="text-sm text-[hsl(var(--charcoal-light))] mb-4">
                Welcome back! Your membership has been successfully verified.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Continue
            </Button>
          </div>
        );

      case 'sent':
        return (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <div>
              <h3 className="font-industrial text-lg text-[hsl(var(--charcoal))] mb-2">
                Verification Code Sent!
              </h3>
              <p className="text-sm text-[hsl(var(--charcoal-light))] mb-4">
                We've sent a 6-digit code to <strong>{email}</strong>. 
                Please check your inbox and enter the code below.
              </p>
              <p className="text-xs text-[hsl(var(--charcoal-light))]">
                The code will expire in 10 minutes.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[hsl(var(--charcoal))] font-industrial">
            Member Access Verification
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--charcoal-light))]">
            {step === 'input' 
              ? 'Enter your membership email to receive a verification code.'
              : step === 'code'
              ? 'Enter the 6-digit code sent to your email.'
              : step === 'success'
              ? 'Your membership has been verified successfully.'
              : 'Check your email for the verification code.'
            }
          </DialogDescription>
        </DialogHeader>
        
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default MembershipLinkModal;