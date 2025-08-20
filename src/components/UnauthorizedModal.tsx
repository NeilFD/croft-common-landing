import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import CroftLogo from '@/components/CroftLogo';
import { useMembershipAuth } from '@/hooks/useMembershipAuth';

interface UnauthorizedModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const UnauthorizedModal = ({ 
  open, 
  onClose, 
  title = "Member Access Required",
  description = "This feature is exclusive to Croft Common members."
}: UnauthorizedModalProps) => {
  const { showMemberLogin } = useMembershipAuth();

  const handleMemberLogin = () => {
    onClose();
    showMemberLogin();
  };

  const handleSubscribe = () => {
    onClose();
    // Navigate to subscription section or open subscription modal
    const subscriptionSection = document.querySelector('[data-subscription-form]');
    if (subscriptionSection) {
      subscriptionSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CroftLogo size="md" />
          </div>
          <DialogTitle className="font-brutalist text-xl">{title}</DialogTitle>
          <DialogDescription className="font-industrial text-foreground/70">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="text-center">
            <p className="text-sm font-industrial text-foreground/80 mb-4">
              Already a member?
            </p>
            <Button 
              onClick={handleMemberLogin}
              className="w-full font-industrial"
              variant="default"
            >
              Member Login
            </Button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-foreground/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-foreground/60 font-industrial">
                or
              </span>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm font-industrial text-foreground/80 mb-4">
              New to Croft Common?
            </p>
            <Button 
              onClick={handleSubscribe}
              variant="outline"
              className="w-full font-industrial"
            >
              Join the Common Room
            </Button>
          </div>
        </div>
        
        <p className="text-xs font-industrial text-center text-foreground/50 mt-4">
          Members receive exclusive access to secret features, events, and The Common Room community.
        </p>
      </DialogContent>
    </Dialog>
  );
};