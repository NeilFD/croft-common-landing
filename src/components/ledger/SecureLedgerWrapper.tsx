import React, { useEffect } from 'react';
import { useLedgerPassword } from '@/hooks/useLedgerPassword';
import { LedgerPasswordSetup } from './LedgerPasswordSetup';
import { LedgerPasswordPrompt } from './LedgerPasswordPrompt';
import { Loader2 } from 'lucide-react';

interface SecureLedgerWrapperProps {
  children: React.ReactNode;
}

export const SecureLedgerWrapper: React.FC<SecureLedgerWrapperProps> = ({ children }) => {
  const {
    state,
    loading,
    initialCheckComplete,
    checkPasswordStatus,
    setPassword,
    validatePassword
  } = useLedgerPassword();

  useEffect(() => {
    checkPasswordStatus();
  }, []);

  // Show loading state while initial password status check is in progress
  if (!initialCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If no password is set, show setup form
  if (!state.hasPassword) {
    return (
      <LedgerPasswordSetup
        onPasswordSet={setPassword}
        loading={loading}
      />
    );
  }

  // If password is set but not validated, show password prompt
  if (!state.isValidated) {
    return (
      <LedgerPasswordPrompt
        onPasswordSubmit={validatePassword}
        loading={loading}
        isLocked={state.isLocked}
        lockedUntil={state.lockedUntil}
      />
    );
  }

  // Password is validated, show the ledger content
  return <>{children}</>;
};