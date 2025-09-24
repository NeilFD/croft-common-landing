import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FeedbackModal } from './FeedbackModal';

export const FeedbackButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button 
        variant="frameNeutral"
        onClick={() => setIsModalOpen(true)}
        className="inline-flex"
      >
        Tell us more
      </Button>
      
      <FeedbackModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};