import React from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useNudgeNotification } from "@/contexts/NudgeNotificationContext";
import { openExternal } from "@/utils/openExternal";

interface NudgeFloatingButtonProps {
  className?: string;
}

const NudgeFloatingButton: React.FC<NudgeFloatingButtonProps> = ({ className = "" }) => {
  const accentColor = 'hsl(var(--accent-sage-green))';
  const navigate = useNavigate();
  const { nudgeUrl, showNudgeButton, markNudgeClicked } = useNudgeNotification();

  console.log('🎯 NUDGE BUTTON: Render check -', { 
    showNudgeButton, 
    nudgeUrl, 
    nudgeUrlType: typeof nudgeUrl,
    nudgeUrlValue: JSON.stringify(nudgeUrl) 
  });

  if (!showNudgeButton || !nudgeUrl) {
    console.log('🎯 NUDGE BUTTON: NOT SHOWING - showNudgeButton:', showNudgeButton, 'nudgeUrl:', nudgeUrl);
    return null;
  }

  const handleClick = () => {
    console.log('🎯 NUDGE BUTTON: Clicked! URL:', nudgeUrl);
    if (!nudgeUrl) return;

    markNudgeClicked(); // Mark as clicked immediately
    
    // Handle both full URLs and internal paths
    if (nudgeUrl.startsWith('http')) {
      console.log('🎯 NUDGE BUTTON: Opening external URL');
      openExternal(nudgeUrl);
    } else if (nudgeUrl.startsWith('/')) {
      console.log('🎯 NUDGE BUTTON: Navigating to internal path');
      navigate(nudgeUrl);
    } else {
      console.log('🎯 NUDGE BUTTON: Treating as internal path, adding slash');
      navigate('/' + nudgeUrl);
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
        CLICK ME
      </span>
    </button>
  );
};

export default NudgeFloatingButton;