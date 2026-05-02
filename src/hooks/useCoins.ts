import { useCallback, useEffect, useRef, useState } from 'react';
import { DAILY_COIN_TARGET } from '../../content/v0';
import {
  hasHitDailyTargetToday,
  loadCoinsTotal,
  markDailyTargetHit,
  saveCoinsTotal,
} from '../lib/storage';

export interface CoinsState {
  /** lifetime coin balance (persisted). */
  total: number;
  /** coins earned in the current session (resets per session). */
  session: number;
  /** has the user earned >= DAILY_COIN_TARGET today (persisted, fires once). */
  dailyTargetJustHit: boolean;
  ready: boolean;
}

export function useCoins() {
  const [total, setTotal] = useState(0);
  const [session, setSession] = useState(0);
  const [dailyTargetJustHit, setDailyTargetJustHit] = useState(false);
  const [ready, setReady] = useState(false);
  const dailyEarnedToday = useRef(0); // coins earned today across sessions; only tracked in-memory for the firing edge.
  const dailyAlreadyMarked = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [t, hit] = await Promise.all([loadCoinsTotal(), hasHitDailyTargetToday()]);
      if (cancelled) return;
      setTotal(t);
      dailyAlreadyMarked.current = hit;
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const award = useCallback((n: number) => {
    setSession(s => s + n);
    setTotal(t => {
      const next = t + n;
      saveCoinsTotal(next).catch(() => {});
      return next;
    });
    dailyEarnedToday.current += n;
    if (!dailyAlreadyMarked.current && dailyEarnedToday.current >= DAILY_COIN_TARGET) {
      dailyAlreadyMarked.current = true;
      setDailyTargetJustHit(true);
      markDailyTargetHit().catch(() => {});
    }
  }, []);

  const resetSession = useCallback(() => {
    setSession(0);
    setDailyTargetJustHit(false);
  }, []);

  return { total, session, dailyTargetJustHit, ready, award, resetSession };
}
