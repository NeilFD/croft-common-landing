import React from "react";

interface BookFloatingButtonProps {
  className?: string;
}

const BookFloatingButton: React.FC<BookFloatingButtonProps> = ({ className = "" }) => {
  const accentColor = 'hsl(var(--accent-pink))';

  return (
    <button
      type="button"
      aria-label="Book"
      className={`absolute top-6 right-6 z-30 w-16 h-16 rounded-full transition-all duration-300 hover:scale-105 
        flex items-center justify-center overflow-hidden button-breathing border-2 border-background/30 
        backdrop-blur-sm bg-background/10 hover:border-background ${className}`}
      style={{
        // Reuse the same breathing glow system as MenuButton
        // @ts-ignore - CSS var typing
        '--breathing-color': accentColor,
      }}
    >
      <span className="relative z-10 font-brutalist tracking-wider text-sm text-background select-none">
        BOOK
      </span>
      {/* Breathing layer */}
      <span className="pointer-events-none absolute inset-0 rounded-full animate-breathing" style={{ backgroundColor: accentColor, opacity: 0.0 }} />
    </button>
  );
};

export default BookFloatingButton;
