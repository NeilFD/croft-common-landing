import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BRAND_LOGO } from '@/data/brand';

interface CardData {
  first_name: string | null;
  last_name: string | null;
  created_at: string | null;
}

const formatNumber = (uuid: string | undefined) => {
  if (!uuid) return 'CB-XXXX-XXXX';
  const hex = uuid.replace(/-/g, '').toUpperCase();
  return `CB-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
};

const formatSince = (iso: string | null | undefined) => {
  if (!iso) return '— / —';
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm} / ${yy}`;
};

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full max-w-md mx-auto">
    <div className="aspect-[1.586/1] w-full">
      <div className="relative h-full w-full bg-black text-white border border-white/20 rounded-xl overflow-hidden">
        {/* Bear watermark — visible, white-on-black */}
        <img
          src="/brand/crazy-bear-mark.png"
          alt=""
          aria-hidden
          className="absolute -right-4 -bottom-4 w-44 h-44 md:w-52 md:h-52 object-contain pointer-events-none invert opacity-25"
        />
        {/* Bear logo top-right corner — small, crisp */}
        <img
          src="/brand/crazy-bear-mark.png"
          alt="Crazy Bear"
          className="absolute top-4 right-4 w-10 h-10 object-contain invert opacity-90 pointer-events-none"
        />
        {children}
      </div>
    </div>
  </div>
);

export const MembershipCard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      const { data: row } = await (supabase as any)
        .from('cb_members')
        .select('first_name, last_name, created_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      setData(row ?? { first_name: null, last_name: null, created_at: null });
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  if (loading) {
    return (
      <Frame>
        <div className="absolute inset-0 p-6 flex items-center justify-center">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/40">Loading</p>
        </div>
      </Frame>
    );
  }

  const first = data?.first_name || (user as any)?.user_metadata?.first_name || '';
  const last = data?.last_name || (user as any)?.user_metadata?.last_name || '';
  const fullName = [first, last].filter(Boolean).join(' ') || (user?.email ?? 'Member');
  const number = formatNumber(user?.id);
  const since = formatSince(data?.created_at ?? (user as any)?.created_at);

  return (
    <Frame>
      <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-between">
        {/* Top */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[9px] md:text-[10px] tracking-[0.4em] uppercase text-white/60">The Den</p>
            <p className="font-mono text-[9px] md:text-[10px] tracking-[0.4em] uppercase text-white/40 mt-1">Member</p>
            <p className="font-mono text-[9px] md:text-[10px] tracking-[0.4em] uppercase text-white/60 mt-1">Crazy Bear</p>
          </div>
        </div>

        {/* Name */}
        <div>
          <h2
            className={`font-display uppercase leading-none tracking-tight break-words ${
              fullName.length > 22
                ? 'text-lg md:text-xl'
                : fullName.length > 16
                ? 'text-xl md:text-2xl'
                : 'text-2xl md:text-3xl'
            }`}
          >
            {fullName}
          </h2>
        </div>

        {/* Bottom */}
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-white/40 mb-1">Member No.</p>
            <p className="font-mono text-sm md:text-base tracking-[0.2em]">{number}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-white/40 mb-1">Member Since</p>
            <p className="font-mono text-sm md:text-base tracking-[0.2em]">{since}</p>
          </div>
        </div>
      </div>
    </Frame>
  );
};
