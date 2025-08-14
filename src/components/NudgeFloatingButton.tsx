import React from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useNudgeNotification } from "@/contexts/NudgeNotificationContext";

interface NudgeFloatingButtonProps {
  className?: string;
}

const NudgeFloatingButton: React.FC<NudgeFloatingButtonProps> = ({ className = "" }) => {
  const accentColor = 'hsl(var(--accent-sage-green))';
  const navigate = useNavigate();
  const { nudgeUrl, showNudgeButton, markNudgeClicked } = useNudgeNotification();

  console.log('🎯 NUDGE BUTTON: Render check -', { showNudgeButton, nudgeUrl });

  if (!showNudgeButton || !nudgeUrl) {
    return null;
  }

  const handleClick = () => {
    console.log('🎯 NUDGE BUTTON: Clicked! URL:', nudgeUrl);
    if (nudgeUrl) {
      markNudgeClicked(); // Mark as clicked immediately
      
      // Navigate to the URL (could be internal or external)
      if (nudgeUrl.startsWith('http')) {
        console.log('🎯 NUDGE BUTTON: Opening external URL');
        window.open(nudgeUrl, '_blank');
      } else {
        console.log('🎯 NUDGE BUTTON: Navigating to internal URL');
        navigate(nudgeUrl);
      }
    }
  };

  return (
    <button
      type="button"
      aria-label="Nudge"
      onClick={handleClick}
      className={cn(
        "fixed bottom-52 right-8 z-40 w-14 h-14 rounded-full transition-all duration-300 hover:scale-105 flex items-center justify-center group overflow-hidden button-breathing-delayed border-2 border-background/30 backdrop-blur-sm bg-background/10 hover:border-background before:content-[''] before:absolute before:inset-0 before:rounded-full before:animate-breathing before:z-0",
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
      <span className="relative z-10 font-brutalist tracking-wider text-xs text-background select-none">
        NUDGE
      </span>
    </button>
  );
};

export default NudgeFloatingButton;