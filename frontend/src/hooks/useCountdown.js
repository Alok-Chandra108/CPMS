import { useState, useEffect, useCallback } from 'react';

/**
 * Countdown timer hook for OTP resend
 * @param {number} initialSeconds - Starting countdown value in seconds
 * @returns {{ seconds, isActive, start, reset, formattedTime }}
 */
const useCountdown = (initialSeconds = 60) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval = null;

    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
    }

    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const start = useCallback(() => {
    setSeconds(initialSeconds);
    setIsActive(true);
  }, [initialSeconds]);

  const reset = useCallback(() => {
    setSeconds(0);
    setIsActive(false);
  }, []);

  // Format as MM:SS
  const formattedTime = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
    seconds % 60
  ).padStart(2, '0')}`;

  return { seconds, isActive, start, reset, formattedTime };
};

export default useCountdown;
