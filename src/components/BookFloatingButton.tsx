import React from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CMSText } from "./cms/CMSText";
import { useCMSMode } from "@/contexts/CMSModeContext";

interface BookFloatingButtonProps {
  className?: string;
}

const BookFloatingButton: React.FC<BookFloatingButtonProps> = ({ className = "" }) => {
  const accentColor = 'hsl(var(--accent-pink))';
  const navigate = useNavigate();
  const { isCMSMode } = useCMSMode();

  // Don't render in CMS mode
  if (isCMSMode) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="Book"
      onClick={() => navigate('/book')}
      className={cn(
        "fixed bottom-36 right-8 z-40 w-14 h-14 rounded-full transition-all duration-300 hover:scale-105 flex items-center justify-center group overflow-hidden button-breathing-delayed border-2 border-background/30 backdrop-blur-sm bg-background/10 hover:border-background before:content-[''] before:absolute before:inset-0 before:rounded-full before:animate-breathing before:z-0",
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
        className="relative z-10 font-brutalist tracking-wider text-xs text-background select-none"
      />
    </button>
  );
};

export default BookFloatingButton;
