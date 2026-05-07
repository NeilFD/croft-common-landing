import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Camera, User, ChartBar, Home, ChevronDown, LayoutDashboard } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMembershipGate } from '@/hooks/useMembershipGate';
import { useMembershipAuth } from '@/contexts/MembershipAuthContext';
import { useFullProfile } from '@/hooks/useFullProfile';
import BiometricUnlockModal from '@/components/BiometricUnlockModal';
import MembershipLinkModal from '@/components/MembershipLinkModal';
import { AuthModal } from '@/components/AuthModal';
import { useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const UserMenu = () => {
  const { user, signOut } = useAuth();
  const { isFullyAuthenticated, refreshMembershipStatus } = useMembershipAuth();
  const { profile } = useFullProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const membershipGate = useMembershipGate();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      membershipGate.reset();
      refreshMembershipStatus();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out.",
      });
    }
  };

  const handleMemberLogin = () => {
    console.log("🔐 UserMenu: Member Login clicked - explicitly triggered by user");
    membershipGate.startWithOtp();
  };

  const handleCloseAll = () => {
    membershipGate.reset();
  };

  const handleOtpAuthSuccess = () => {
    membershipGate.handleAuthSuccess();
    refreshMembershipStatus();
  };

  // Reset modals when navigating to home page
  useEffect(() => {
    if (location.pathname === '/') {
      console.log('🔐 UserMenu: On home page, ensuring modals are closed');
      membershipGate.reset();
    }
  }, [location.pathname, membershipGate.reset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🔐 UserMenu: Unmounting, cleaning up state');
      membershipGate.reset();
    };
  }, [membershipGate.reset]);
  const memberMenuItems = [
    { icon: Home, label: "My Home", path: "/den/member" },
    { icon: LayoutDashboard, label: "Dashboard", path: "/den/member/dashboard" },
    { icon: User, label: "Profile", path: "/den/member/profile" },
    { icon: ChartBar, label: "Ledger", path: "/den/member/ledger" },
    { icon: Camera, label: "Moments", path: "/den/member/moments" },
  ];

  // Show login button if not authenticated
  if (!user) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={handleMemberLogin}
          className="gap-1.5 text-xs font-industrial uppercase tracking-wide h-9 px-3 border-foreground/30 hover:border-accent-pink hover:text-accent-pink transition-colors"
        >
          <User className="h-4 w-4" />
          <span>Sign In</span>
        </Button>

        {/* Authentication Modals */}
        <AuthModal
          isOpen={membershipGate.authOpen}
          onClose={handleCloseAll}
          onSuccess={handleOtpAuthSuccess}
          requireAllowedDomain={false}
        />
      </>
    );
  }

  // Show member dropdown if authenticated
  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 text-xs ${isFullyAuthenticated() ? 'text-accent-pink' : 'text-foreground'}`}
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isFullyAuthenticated() 
                  ? `${profile?.first_name || 'Member'} ✓` 
                  : profile?.first_name || 'Member'}
              </span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-background border shadow-lg z-50">
            {memberMenuItems.map((item) => (
              <DropdownMenuItem
                key={item.path}
                onClick={() => navigate(item.path)}
                className="gap-2 cursor-pointer"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="gap-2 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Authentication Modals for re-linking */}
      <BiometricUnlockModal
        isOpen={membershipGate.bioOpen}
        onClose={handleCloseAll}
        onSuccess={membershipGate.handleBioSuccess}
        onFallback={membershipGate.handleBioFallback}
      />
      <MembershipLinkModal
        open={membershipGate.linkOpen}
        onClose={handleCloseAll}
        onSuccess={membershipGate.handleLinkSuccess}
      />
      <AuthModal
        isOpen={membershipGate.authOpen}
        onClose={handleCloseAll}
        onSuccess={handleOtpAuthSuccess}
        requireAllowedDomain={false}
      />
    </>
  );
};