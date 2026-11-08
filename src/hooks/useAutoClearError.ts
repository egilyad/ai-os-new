import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { rootLogger } from '../kernel/instances';

const LOGGER = rootLogger.child('useAutoClearError');

/**
 * Schedules automatic error dismissal after `autoClearMs` ms.
 * Returns a `clearError` callback — call it after `setError(msg)` to start the timer.
 * Timer is cancelled on unmount.
 * Pass `autoClearMs: null` for sticky errors (e.g. data/money/status-loss operations)
 * that must NOT be dismissed automatically.
 */
export function useAutoClearError(
  setError: Dispatch<SetStateAction<string | null>>,
  autoClearMs: number | null = 8000
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
    if (autoClearMs === null) {
      LOGGER.debug('useAutoClearError', 'auto-clear skipped (sticky error)');
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (isMountedRef.current) {
        LOGGER.debug('useAutoClearError', `auto-clearing error after ${autoClearMs}ms`);
        setError(null);
      }
    }, autoClearMs);
  }, [setError, autoClearMs]);
}
