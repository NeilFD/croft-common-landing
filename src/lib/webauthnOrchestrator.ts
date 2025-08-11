// Global orchestrator to serialize WebAuthn flows across the app
// Prevents overlapping auth/register prompts which can invalidate challenges

import { ensureBiometricUnlockDetailed } from '@/lib/biometricAuth';

let locked = false as boolean;
const queue: Array<() => void> = [];

function acquire(): Promise<void> {
  return new Promise((resolve) => {
    if (!locked) {
      locked = true;
      resolve();
    } else {
      queue.push(resolve);
    }
  });
}

function release() {
  const next = queue.shift();
  if (next) {
    // Let the event loop breathe so UI can update between prompts
    setTimeout(next, 0);
  } else {
    locked = false;
  }
}

export async function runExclusive<T>(label: string, fn: () => Promise<T>): Promise<T> {
  await acquire();
  const start = Date.now();
  console.debug(`[webauthn-orchestrator] lock acquired: ${label}`);
  try {
    const result = await fn();
    return result;
  } finally {
    const dur = Date.now() - start;
    console.debug(`[webauthn-orchestrator] lock released: ${label} (${dur}ms)`);
    release();
  }
}

// Wrapper to serialize biometric unlock attempts everywhere
export function ensureBiometricUnlockSerialized(displayName?: string) {
  return runExclusive('ensureBiometricUnlock', () => ensureBiometricUnlockDetailed(displayName));
}
