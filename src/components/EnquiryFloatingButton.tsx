import { useTransition } from '@/contexts/TransitionContext';
import { useEditMode } from '@/contexts/EditModeContext';
import { useCMSMode } from '@/contexts/CMSModeContext';
import { CMSText } from '@/components/cms/CMSText';

interface EnquiryFloatingButtonProps {
  className?: string;
}

export const EnquiryFloatingButton = ({ className = '' }: EnquiryFloatingButtonProps) => {
  const { triggerTransition } = useTransition();
  const { isEditMode } = useEditMode();
  const { isCMSMode } = useCMSMode();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isEditMode) {
      e.preventDefault();
      return;
    }
    triggerTransition('/event-enquiry');
  };

  const zIndexClass = isCMSMode && window.location.pathname === '/hall' 
    ? 'z-[100]' 
    : 'z-50';

  return (
    <button
      onClick={handleClick}
      className={`
        fixed bottom-48 right-4 md:right-8
        px-8 py-4
        bg-accent text-accent-foreground
        font-industrial font-bold text-sm md:text-base
        border-2 border-foreground
        transition-all duration-300
        hover:scale-105 hover:shadow-lg
        animate-breathing
        ${zIndexClass}
        ${className}
      `}
      aria-label="Event enquiry"
    >
      <CMSText 
        page="global" 
        section="buttons" 
        contentKey="enquiry" 
        fallback="ENQUIRY"
      />
    </button>
  );
};
