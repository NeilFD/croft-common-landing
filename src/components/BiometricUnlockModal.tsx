import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import CroftLogo from '@/components/CroftLogo';
import { ensureBiometricUnlock } from '@/lib/biometricAuth';
import { Button } from '@/components/ui/button';

interface BiometricUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
  onFallback?: () => void;
}

const BiometricUnlockModal: React.FC<BiometricUnlockModalProps> = ({ isOpen, onClose, onSuccess, title = 'Unlock with Face ID / Passkey', description = 'Use your device biometrics to unlock.', onFallback }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async () => {
    setLoading(true);
    setError(null);
    const ok = await ensureBiometricUnlock('Member');
    setLoading(false);
    if (ok) onSuccess();
    else setError('Biometric unlock failed. You can try again or use email.');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="w-[86vw] sm:w-auto max-w-[360px] sm:max-w-md border border-border bg-background">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <CroftLogo size="sm" />
            <span className="font-brutalist text-foreground tracking-wider">CROFT COMMON</span>
          </div>
          <h2 className="font-brutalist text-foreground text-xl tracking-wider">{title}</h2>
          <p className="font-industrial text-foreground/80">{description}</p>
          {error && <p className="font-industrial text-destructive text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={handleUnlock} disabled={loading}>
              {loading ? 'Checking…' : 'Use Face ID / Passkey'}
            </Button>
            {onFallback && (
              <Button variant="outline" onClick={onFallback} disabled={loading}>
                Email instead
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BiometricUnlockModal;
