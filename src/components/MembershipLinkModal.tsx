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
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'sent' | 'success'>('input');
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

      if (data?.success) {
        setStep('sent');
        toast.success('Verification email sent! Please check your inbox.');
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

  const handleClose = () => {
    setEmail('');
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
                      Send Verification
                    </>
                  )}
                </Button>
              </div>
            </form>
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
                Verification Email Sent!
              </h3>
              <p className="text-sm text-[hsl(var(--charcoal-light))] mb-4">
                We've sent a verification link to <strong>{email}</strong>. 
                Please check your inbox and click the link to verify your membership.
              </p>
              <p className="text-xs text-[hsl(var(--charcoal-light))]">
                The verification link will expire in 10 minutes.
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
              ? 'Enter your membership email to verify access to member features.'
              : 'Check your email for the verification link.'
            }
          </DialogDescription>
        </DialogHeader>
        
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default MembershipLinkModal;