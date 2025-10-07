import { useEffect } from 'react';

// CanonicalDomainGuard
// - Unconditionally redirects apex domain to canonical www domain
// - Preserves pathname, query, and hash to avoid losing auth tokens
export const CanonicalDomainGuard = () => {
  useEffect(() => {
    try {
      const host = window.location.hostname;
      if (host === 'croftcommontest.com') {
        const newUrl = 'https://www.croftcommontest.com'
          + window.location.pathname
          + window.location.search
          + window.location.hash;
        window.location.replace(newUrl);
      }
    } catch {
      // no-op
    }
  }, []);

  return null;
};