import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { DAILY_SOFT_LIMIT_SECONDS } from '../../content/v0';
import { loadDailyPlaySeconds, saveDailyPlaySeconds, todayKey } from '../lib/storage';

/**
 * Tracks cumulative seconds played today (local-time bucketed by date).
 *
 * - On mount: reads today's value into `seconds`.
 * - While the app is foregrounded and `enabled`: ticks once per second.
 * - On unmount, on AppState background, and every 15s: flushes to AsyncStorage.
 * - When seconds crosses DAILY_SOFT_LIMIT_SECONDS, `softLimitJustReached`
 *   flips to true once (cleared via `acknowledgeSoftLimit`).
 *
 * If the local date rolls over while the app is open, the next tick
 * resets to a fresh date bucket (today's accumulated time starts at 0).
 */
export function useDailyPlayTime(enabled: boolean) {
  const [seconds, setSeconds] = useState(0);
  const [ready, setReady] = useState(false);
  const [softLimitJustReached, setSoftLimitJustReached] = useState(false);
  const limitFiredRef = useRef(false);
  const dateRef = useRef(todayKey());
  const lastFlushRef = useRef(0);

  // Initial load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await loadDailyPlaySeconds(dateRef.current);
      if (cancelled) return;
      setSeconds(s);
      lastFlushRef.current = s;
      if (s >= DAILY_SOFT_LIMIT_SECONDS) limitFiredRef.current = true;
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Tick.
  useEffect(() => {
    if (!enabled || !ready) return;
    const id = setInterval(() => {
      const today = todayKey();
      if (today !== dateRef.current) {
        // Local date rolled over. Reset the bucket.
        dateRef.current = today;
        limitFiredRef.current = false;
        lastFlushRef.current = 0;
        setSeconds(0);
        return;
      }
      setSeconds(prev => {
        const next = prev + 1;
        if (!limitFiredRef.current && next >= DAILY_SOFT_LIMIT_SECONDS) {
          limitFiredRef.current = true;
          setSoftLimitJustReached(true);
        }
        if (next - lastFlushRef.current >= 15) {
          lastFlushRef.current = next;
          saveDailyPlaySeconds(next, dateRef.current).catch(() => {});
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [enabled, ready]);

  // Flush on background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state !== 'active') {
        saveDailyPlaySeconds(seconds, dateRef.current).catch(() => {});
      }
    });
    return () => sub.remove();
  }, [seconds]);

  // Flush on unmount.
  useEffect(() => {
    return () => {
      saveDailyPlaySeconds(seconds, dateRef.current).catch(() => {});
    };
  }, [seconds]);

  function acknowledgeSoftLimit() {
    setSoftLimitJustReached(false);
  }

  return { seconds, ready, softLimitJustReached, acknowledgeSoftLimit };
}
