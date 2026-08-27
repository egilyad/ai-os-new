import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';

/**
 * Schedules automatic error dismissal after `delay` ms.
 * Returns a `clearError` callback — call it after `setError(msg)` to start the timer.
 * Timer is cancelled on unmount.
 */
export function useAutoClearError(
  setError: Dispatch<SetStateAction<string | null>>,
  delay = 8000
): () => void {
  const isMountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (isMountedRef.current) setError(null);
    }, delay);
  }, [setError, delay]);
}
