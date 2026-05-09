import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

interface VerifyResponse {
  ok: boolean;
  display_name?: string;
  membership_number?: string;
  member_since?: string;
  avatar_url?: string | null;
  error?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const DenVerify: React.FC = () => {
  const [params] = useSearchParams();
  const membershipNumber = (params.get('m') || '').trim().toUpperCase();
  const [state, setState] = useState<{ loading: boolean; data: VerifyResponse | null }>({
    loading: true,
    data: null,
  });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!membershipNumber) {
        setState({ loading: false, data: { ok: false, error: 'No membership number provided' } });
        return;
      }
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/verify-cb-member?m=${encodeURIComponent(membershipNumber)}`,
        );
        const json = (await res.json()) as VerifyResponse;
        if (!cancelled) setState({ loading: false, data: json });
      } catch (err: any) {
        if (!cancelled) {
          setState({ loading: false, data: { ok: false, error: 'Could not reach verification service' } });
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [membershipNumber]);

  const verified = state.data?.ok === true;

  return (
    <>
      <Helmet>
        <title>Verify Member | The Den</title>
        <meta name="description" content="Crazy Bear membership verification." />
      </Helmet>

      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Top brand bar */}
        <header className="border-b border-white/15 px-6 py-5 flex items-center gap-3">
          <img
            src="/brand/crazy-bear-mark.png"
            alt="Crazy Bear"
            className="w-8 h-8 invert"
          />
          <span className="font-display uppercase tracking-tight text-lg">The Den</span>
          <span className="ml-auto font-mono text-[10px] tracking-[0.4em] uppercase text-white/60">
            Member Verify
          </span>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-md">
            {state.loading && (
              <div className="text-center">
                <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/60">
                  Verifying
                </p>
              </div>
            )}

            {!state.loading && verified && (
              <div className="border-2 border-white p-8 bg-black">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-3 h-3 bg-white rounded-full" aria-hidden />
                  <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/80">
                    Verified Member
                  </p>
                </div>

                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white bg-white/5 flex items-center justify-center mb-6">
                    {state.data?.avatar_url ? (
                      <img
                        src={state.data.avatar_url}
                        alt={state.data?.display_name || 'Member'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-display uppercase text-3xl">
                        {(state.data?.display_name || 'M').trim().charAt(0)}
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-white/50 mb-2">
                    Member
                  </p>
                  <h1 className="font-display uppercase text-4xl md:text-5xl tracking-tight leading-none">
                    {state.data?.display_name}
                  </h1>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/15">
                  <div>
                    <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-white/50 mb-1">
                      Member No.
                    </p>
                    <p className="font-mono text-sm tracking-[0.2em]">{state.data?.membership_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-white/50 mb-1">
                      Member Since
                    </p>
                    <p className="font-mono text-sm tracking-[0.2em]">{state.data?.member_since}</p>
                  </div>
                </div>
              </div>
            )}

            {!state.loading && !verified && (
              <div className="border-2 border-white/40 p-8">
                <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/60 mb-4">
                  Not Verified
                </p>
                <h1 className="font-display uppercase text-3xl tracking-tight leading-none mb-3">
                  No member found
                </h1>
                <p className="font-sans text-sm text-white/70">
                  {state.data?.error || 'This card could not be verified.'}
                </p>
                {membershipNumber && (
                  <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/40 mt-6">
                    Reference: {membershipNumber}
                  </p>
                )}
              </div>
            )}

            <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-white/40 text-center mt-8">
              Crazy Bear / Stadhampton / Beaconsfield
            </p>
          </div>
        </main>
      </div>
    </>
  );
};

export default DenVerify;
