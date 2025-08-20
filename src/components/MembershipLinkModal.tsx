import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface MembershipLinkModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

const MembershipLinkModal: React.FC<MembershipLinkModalProps> = ({ open, onClose, onSuccess }) => {
  console.log('🔴 MembershipLinkModal RENDER - open:', open);
  console.log('🔴 MembershipLinkModal props:', { open, onClose, onSuccess });
  
  if (open) {
    console.log('🟢 Modal should be VISIBLE now!');
  } else {
    console.log('🔴 Modal should be HIDDEN');
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { 
      if (!v) { 
        console.log('🔴 Dialog onOpenChange called with false - closing modal');
        onClose(); 
      } 
    }}>
      <DialogContent 
        className="sm:max-w-[425px] bg-red-500 border-8 border-yellow-400 shadow-2xl" 
        style={{ zIndex: 9999 }}
      >
        <DialogHeader>
          <DialogTitle className="text-white text-2xl font-bold">
            🚨 DEBUG MODAL WORKS! 🚨
          </DialogTitle>
          <DialogDescription className="text-yellow-200 text-lg">
            If you can see this, the modal is rendering correctly!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-4 bg-blue-600 rounded">
          <p className="text-white text-xl font-bold">
            MEMBER LOGIN MODAL IS WORKING!
          </p>
          <p className="text-yellow-200">
            Open state: {open ? 'TRUE' : 'FALSE'}
          </p>
          <Button 
            onClick={() => {
              console.log('🟢 Close button clicked');
              onClose();
            }}
            className="w-full bg-green-500 hover:bg-green-600 text-white text-lg font-bold p-4"
          >
            CLOSE MODAL
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MembershipLinkModal;