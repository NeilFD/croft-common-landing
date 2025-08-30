import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecretKitchensCountdownProps {
  expiresAt: string;
  onExpired: () => void;
  className?: string;
}

export const SecretKitchensCountdown: React.FC<SecretKitchensCountdownProps> = ({
  expiresAt,
  onExpired,
  className
}) => {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  }>({ hours: 0, minutes: 0, seconds: 0, total: 0 });

  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, total: 0 });
        if (!isExpired) {
          setIsExpired(true);
          onExpired();
        }
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds, total: difference });
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired, isExpired]);

  // Don't render if expired
  if (isExpired) {
    return null;
  }

  const formatTime = (value: number): string => {
    return value.toString().padStart(2, '0');
  };

  const isLowTime = timeRemaining.total <= 3600000; // Less than 1 hour
  const isCriticalTime = timeRemaining.total <= 900000; // Less than 15 minutes

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-300",
      isCriticalTime 
        ? "bg-destructive/10 border-destructive text-destructive animate-pulse" 
        : isLowTime 
        ? "bg-amber-500/10 border-amber-500 text-amber-600" 
        : "bg-muted border-border text-muted-foreground",
      className
    )}>
      <div className="flex items-center gap-2">
        {isCriticalTime ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <Clock className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">
          {isCriticalTime ? "Access expires in:" : isLowTime ? "Time remaining:" : "Access expires in:"}
        </span>
      </div>
      
      <div className="flex items-center gap-1 font-mono text-lg font-bold">
        <span>{formatTime(timeRemaining.hours)}</span>
        <span className="text-muted-foreground">:</span>
        <span>{formatTime(timeRemaining.minutes)}</span>
        <span className="text-muted-foreground">:</span>
        <span>{formatTime(timeRemaining.seconds)}</span>
      </div>

      {isLowTime && (
        <span className="text-xs">
          {isCriticalTime ? "Critical!" : "Warning"}
        </span>
      )}
    </div>
  );
};