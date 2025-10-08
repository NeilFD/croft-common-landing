// Minimal boot logger to capture early console logs and persist for diagnostics
export function initBootLogger() {
  try {
    const w = window as any;
    if (w.__bootLoggerInitialised) return;
    w.__bootLoggerInitialised = true;

    const buffer: Array<{ t: number; level: string; args: string[] }> = [];

    const original = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      info: console.info.bind(console),
    } as const;

    function serialise(x: unknown): string {
      try {
        if (typeof x === 'string') return x;
        return JSON.stringify(x);
      } catch {
        try { return String(x); } catch { return '[unserialisable]'; }
      }
    }

    (['log', 'warn', 'error', 'info'] as const).forEach((level) => {
      (console as any)[level] = (...args: unknown[]) => {
        try {
          buffer.push({ t: Date.now(), level, args: args.map(serialise) });
        } catch {}
        (original as any)[level](...args);
      };
    });

    w.__BOOT_LOGS__ = buffer;
    w.__flushBootLogsToLocalStorage = () => {
      try {
        localStorage.setItem('cc_boot_logs', JSON.stringify(buffer));
      } catch {}
    };

    // Auto-flush after 10s in case app never fully mounts
    setTimeout(() => {
      try { w.__flushBootLogsToLocalStorage?.(); } catch {}
    }, 10_000);
  } catch {
    // do nothing - never block boot
  }
}
