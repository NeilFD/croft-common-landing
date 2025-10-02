import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CMSText } from "./cms/CMSText";
import { useEditMode } from "@/contexts/EditModeContext";
import { useCMSMode } from "@/contexts/CMSModeContext";

interface BookFloatingButtonProps {
  className?: string;
}

const BookFloatingButton: React.FC<BookFloatingButtonProps> = ({ className = "" }) => {
  const accentColor = 'hsl(var(--accent-pink))';
  const navigate = useNavigate();
  const location = useLocation();
  const { isEditMode } = useEditMode();
  const { isCMSMode } = useCMSMode();
  
  // Special z-index boost for Hall page in CMS mode only
  const isHallPageInCMS = location.pathname === '/hall' && isCMSMode;
  const zIndexClass = isHallPageInCMS ? 'z-[9999]' : 'z-40';

  return (
    <button
      type="button"
      aria-label="Book"
      onClick={(e) => {
        // Don't navigate if in edit mode - let CMSText handle the click
        if (isEditMode) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        const startingPath = location.pathname;
        navigate('/book');
        
        // Aggressive fallback for iOS PWA
        setTimeout(() => {
          if (location.pathname === startingPath) {
            console.warn('[BookButton] Fallback forcing navigation to /book');
            window.location.replace('/book?bypass-cache=' + Date.now());
          }
        }, 400);
      }}
      className={cn(
        `fixed bottom-36 right-8 ${zIndexClass} w-14 h-14 rounded-full transition-all duration-300 hover:scale-105 flex items-center justify-center group overflow-hidden button-breathing border-2 border-background/30 backdrop-blur-sm bg-background/10 hover:border-background before:content-[''] before:absolute before:inset-0 before:rounded-full before:animate-breathing before:z-0`,
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
        contentKey="book"
        fallback="BOOK"
        className="relative z-10 font-brutalist tracking-wider text-xs text-foreground select-none"
      />
    </button>
  );
};

export default BookFloatingButton;
