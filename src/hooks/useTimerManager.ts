import { useEffect, useRef } from 'react';

interface TimerManager {
  addTimer: (id: string, callback: () => void, interval: number) => void;
  removeTimer: (id: string) => void;
  pauseAllTimers: () => void;
  resumeAllTimers: () => void;
}

export const useTimerManager = (): TimerManager => {
  const timers = useRef<Map<string, { id: NodeJS.Timeout; callback: () => void; interval: number; paused: boolean }>>(new Map());
  const isPaused = useRef(false);

  const addTimer = (id: string, callback: () => void, interval: number) => {
    if (timers.current.has(id)) {
      removeTimer(id);
    }

    const timerId = setInterval(() => {
      if (!isPaused.current) {
        callback();
      }
    }, interval);

    timers.current.set(id, {
      id: timerId,
      callback,
      interval,
      paused: false
    });
  };

  const removeTimer = (id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearInterval(timer.id);
      timers.current.delete(id);
    }
  };

  const pauseAllTimers = () => {
    isPaused.current = true;
  };

  const resumeAllTimers = () => {
    isPaused.current = false;
  };

  // Pause timers when page is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseAllTimers();
      } else {
        resumeAllTimers();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Cleanup all timers
      timers.current.forEach((timer) => {
        clearInterval(timer.id);
      });
      timers.current.clear();
    };
  }, []);

  return {
    addTimer,
    removeTimer,
    pauseAllTimers,
    resumeAllTimers
  };
};