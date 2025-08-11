import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import CroftLogo from '@/components/CroftLogo';
import { ensureBiometricUnlockDetailed, isPlatformAuthenticatorAvailable, isWebAuthnSupported } from '@/lib/biometricAuth';
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
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    async function checkSupport() {
      const supportedBrowser = isWebAuthnSupported();
      const platform = supportedBrowser ? await isPlatformAuthenticatorAvailable() : false;
      if (!mounted) return;
      setSupported(supportedBrowser && platform);
      if (!supportedBrowser) {
        setError('Passkeys are not supported in this browser.');
      } else if (!platform) {
        setError('No built-in authenticator available on this device.');
      } else {
        setError(null);
      }
    }
    if (isOpen) checkSupport();
    return () => { mounted = false; };
  }, [isOpen]);

  const messageFor = (code?: string, fallback?: string) => {
    switch (code) {
      case 'not_allowed':
        return 'Biometric prompt was closed or timed out. Please try again.';
      case 'security':
        return 'Security error. Check you are on croftcommon.co over HTTPS and not in Private Browsing.';
      case 'invalid_state':
        return 'This passkey is already registered. Try signing in instead.';
      case 'timeout':
        return 'Timed out waiting for Face ID / Passkey. Please try again.';
      case 'abort':
        return 'Authentication was cancelled. Please try again.';
      case 'no_user_handle':
      case 'no_credentials':
        return 'No passkey saved yet. We’ll create one now.';
      case 'auth_options_failed':
        return 'Couldn’t fetch passkey. We’ll create one now.';
      case 'platform_unavailable':
        return 'No built-in authenticator found on this device.';
      case 'unsupported':
        return 'Passkeys are not supported in this browser.';
      case 'server':
        return 'There was an issue contacting the server. Please try again.';
      default:
        return fallback || 'Biometric unlock failed. You can try again or use email.';
    }
  };

  const handleUnlock = async () => {
    setLoading(true);
    setError(null);
    const res = await ensureBiometricUnlockDetailed('Member');
    setLoading(false);
    if (res.ok) {
      onSuccess();
      return;
    }
    console.debug('[webauthn] ensureBiometricUnlockDetailed result', res);
    setError(messageFor(res.errorCode, res.error));
    if (res.stage === 'unsupported' && onFallback) {
      // Offer fallback path immediately in unsupported environments
      onFallback();
    }
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
            <Button className="flex-1" onClick={handleUnlock} disabled={loading || supported === false}>
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
