import { useTransition } from '@/contexts/TransitionContext';
import { useEditMode } from '@/contexts/EditModeContext';
import { useCMSMode } from '@/contexts/CMSModeContext';
import { CMSText } from '@/components/cms/CMSText';
import { cn } from '@/lib/utils';

interface EnquiryFloatingButtonProps {
  className?: string;
}

export const EnquiryFloatingButton = ({ className = '' }: EnquiryFloatingButtonProps) => {
  const accentColor = 'hsl(var(--accent-pink))';
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
      aria-label="Event enquiry"
      className={cn(
        `fixed bottom-48 right-8 ${zIndexClass} w-14 h-14 rounded-full transition-all duration-300 hover:scale-105 flex items-center justify-center group overflow-hidden button-breathing border-2 border-background/30 backdrop-blur-sm bg-background/10 hover:border-background before:content-[''] before:absolute before:inset-0 before:rounded-full before:animate-breathing before:z-0`,
        className
      )}
      style={{
        // @ts-ignore - CSS var typing
        '--breathing-color': accentColor,
      } as any}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = accentColor;
        e.currentTarget.style.borderColor = accentColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'hsla(0, 0%, 100%, 0.1)';
        e.currentTarget.style.borderColor = 'hsla(0, 0%, 100%, 0.3)';
      }}
    >
      <CMSText 
        page="global" 
        section="buttons" 
        contentKey="enquiry" 
        fallback="ENQUIRY"
        className="relative z-10 font-brutalist tracking-wider text-xs text-foreground select-none"
      />
    </button>
  );
};
