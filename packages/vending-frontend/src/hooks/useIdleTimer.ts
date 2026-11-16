/**
 * Kiosk Idle Activity Timer Hook
 * Monitors user interaction, provides grace countdown warning, and resets abandoned sessions.
 * Satisfies Rule 3 (Zero Event Listener Leaks) and Rule 11 (Kiosk Session Hygiene).
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseIdleTimerOptions {
  timeoutSeconds?: number;
  warningSeconds?: number;
  onIdle: () => void;
  enabled?: boolean;
}

export function useIdleTimer({
  timeoutSeconds = 60,
  warningSeconds = 10,
  onIdle,
  enabled = true,
}: UseIdleTimerOptions) {
  const [isWarningActive, setIsWarningActive] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(warningSeconds);

  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = useCallback(() => {
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    clearAllTimers();
    setIsWarningActive(false);
    setSecondsRemaining(warningSeconds);

    const timeUntilWarning = Math.max(1, timeoutSeconds - warningSeconds) * 1000;

    timeoutTimerRef.current = setTimeout(() => {
      setIsWarningActive(true);
      let countdown = warningSeconds;

      countdownIntervalRef.current = setInterval(() => {
        countdown -= 1;
        setSecondsRemaining(countdown);
        if (countdown <= 0) {
          clearAllTimers();
          setIsWarningActive(false);
          onIdle();
        }
      }, 1000);
    }, timeUntilWarning);
  }, [clearAllTimers, enabled, onIdle, timeoutSeconds, warningSeconds]);

  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
      return;
    }

    const activityEvents = ['touchstart', 'touchend', 'mousedown', 'keydown', 'scroll'];
    const handleUserActivity = () => {
      if (isWarningActive) {
        // User interacted while warning was active: cancel warning and reset
        resetTimer();
      } else {
        resetTimer();
      }
    };

    activityEvents.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));
    resetTimer();

    return () => {
      // Rule 3: Explicitly unbind all event listeners and timers on unmount
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      clearAllTimers();
    };
  }, [clearAllTimers, enabled, isWarningActive, resetTimer]);

  return { isWarningActive, secondsRemaining, resetTimer };
}

