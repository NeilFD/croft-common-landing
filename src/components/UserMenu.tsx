import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useMembershipAuth } from '@/hooks/useMembershipAuth';
import { LogOut, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const UserMenu = () => {
  const { user } = useAuth();
  const { isMember, showMemberLogin, signOutMember } = useMembershipAuth();
  const [memberName, setMemberName] = useState<string>('');

  // Fetch member profile when user is authenticated
  useEffect(() => {
    const fetchMemberProfile = async () => {
      if (!user || !isMember) {
        setMemberName('');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .single();

        if (data && !error) {
          const name = [data.first_name, data.last_name].filter(Boolean).join(' ');
          setMemberName(name);
        }
      } catch (error) {
        console.debug('Profile fetch failed:', error);
      }
    };

    fetchMemberProfile();
  }, [user, isMember]);

  const handleSignOut = async () => {
    await signOutMember();
  };

  return (
    <div className="flex items-center gap-2">
      {!isMember ? (
        <Button
          variant="frameNeutral"
          shape="pill"
          size="sm"
          onClick={showMemberLogin}
          className="h-8 px-3 text-xs font-industrial tracking-wide text-[hsl(var(--charcoal))] transition-all duration-200 hover:scale-105 hover:bg-transparent focus:bg-transparent active:bg-transparent hover:border-[hsl(var(--accent-sage-green))] active:border-[hsl(var(--accent-sage-green))] focus:border-[hsl(var(--accent-sage-green))]"
        >
          <Shield className="h-3 w-3 mr-1" />
          Member Login
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          {memberName && (
            <span className="text-xs font-industrial text-[hsl(var(--charcoal))] opacity-70">
              {memberName}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-1 h-8 px-2 text-xs font-industrial text-[hsl(var(--charcoal))] hover:text-[hsl(var(--accent-pink))]"
          >
            <LogOut className="h-3 w-3" />
            Sign out
          </Button>
        </div>
      )}
    </div>
  );
};