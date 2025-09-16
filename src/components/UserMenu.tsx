import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Camera, User, ChartBar, Home, ChevronDown, LayoutDashboard } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useMembershipGate } from '@/hooks/useMembershipGate';
import { useMembershipAuth } from '@/contexts/MembershipAuthContext';
import BiometricUnlockModal from '@/components/BiometricUnlockModal';
import MembershipLinkModal from '@/components/MembershipLinkModal';
import { AuthModal } from '@/components/AuthModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const UserMenu = () => {
  const { user, signOut } = useAuth();
  const { isFullyAuthenticated } = useMembershipAuth();
  const navigate = useNavigate();
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
      toast({
        title: "Signed out successfully",
        description: "You have been signed out.",
      });
    }
  };

  const handleMemberLogin = () => {
    membershipGate.start();
  };

  const handleCloseAll = () => {
    membershipGate.reset();
  };

  const memberMenuItems = [
    { icon: Home, label: "My Home", path: "/common-room/member" },
    { icon: LayoutDashboard, label: "Dashboard", path: "/common-room/member/dashboard" },
    { icon: User, label: "Profile", path: "/common-room/member/profile" },
    { icon: ChartBar, label: "Ledger", path: "/common-room/member/ledger" },
    { icon: Camera, label: "Moments", path: "/common-room/member/moments" },
  ];

  // Show login button if not authenticated
  if (!user) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMemberLogin}
          className="gap-2 text-xs"
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Member Login</span>
        </Button>

        {/* Authentication Modals */}
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
          onSuccess={membershipGate.handleAuthSuccess}
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
              className={`gap-2 text-xs ${isFullyAuthenticated() ? 'text-accent-lime' : 'text-foreground'}`}
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isFullyAuthenticated() ? 'Member ✓' : 'Member'}
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
        onSuccess={membershipGate.handleAuthSuccess}
      />
    </>
  );
};