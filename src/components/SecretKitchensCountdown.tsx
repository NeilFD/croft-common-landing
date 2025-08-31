import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecretKitchensCountdownProps {
  expiresAt: string | null;
  onExpired: () => void;
  className?: string;
}

const SecretKitchensCountdown: React.FC<SecretKitchensCountdownProps> = ({
  expiresAt,
  onExpired,
  className
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  const [isExpired, setIsExpired] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft(null);
        clearInterval(interval);
        onExpired();
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
      
      // Show warning when less than 30 minutes remaining
      setShowWarning(difference <= 30 * 60 * 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  if (isExpired) {
    return (
      <div className={cn(
        "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm",
        "border-2 border-red-500 hover:text-red-500 transition-colors duration-300",
        className
      )}>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">Access Expired</span>
        </div>
      </div>
    );
  }

  if (!timeLeft) return null;

  return (
    <div className={cn(
      "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm",
      "border-2 border-red-500 text-white transition-all duration-300 hover:text-red-500",
      showWarning && "animate-pulse",
      className
    )}>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" />
        <div className="text-sm font-medium">
          {timeLeft.hours > 0 && (
            <span>{timeLeft.hours}h </span>
          )}
          <span>{timeLeft.minutes}m </span>
          <span>{timeLeft.seconds}s</span>
        </div>
      </div>
      {showWarning && (
        <div className="text-xs mt-1 opacity-90">
          Access expires soon
        </div>
      )}
    </div>
  );
};

export default SecretKitchensCountdown;