import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Camera, User, ChartBar, Home } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const UserMenu = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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

  if (!user) return null;

  const memberMenuItems = [
    { icon: Home, label: "Dashboard", path: "/common-room/member/dashboard" },
    { icon: User, label: "Profile", path: "/common-room/member/profile" },
    { icon: ChartBar, label: "Ledger", path: "/common-room/member/ledger" },
    { icon: Camera, label: "Moments", path: "/common-room/member/moments" },
  ];

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {memberMenuItems.map((item) => (
          <Button
            key={item.path}
            variant="ghost"
            size="sm"
            onClick={() => navigate(item.path)}
            className="gap-2 text-xs"
          >
            <item.icon className="h-3 w-3" />
            <span className="hidden sm:inline">{item.label}</span>
          </Button>
        ))}
      </div>
      
      <span className="text-sm text-muted-foreground hidden sm:block">
        {user.email}
      </span>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="gap-2"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Sign out</span>
      </Button>
    </div>
  );
};