import { useCallback, useEffect, useState } from 'react';
import { LEVELS, MASTERY_SESSIONS_REQUIRED, type Level } from '../../content/v0';
import { bumpLevelMastery, loadLevelMastery } from '../lib/storage';

export interface LevelState {
  level: Level;
  mastery: number;       // count of mastered sessions for this level
  unlocked: boolean;     // can the user select this level?
  mastered: boolean;     // has it hit MASTERY_SESSIONS_REQUIRED yet?
}

/**
 * Resolve the unlocked/mastered state for every level. A level is unlocked
 * iff it has no `unlockAfter` prereq, OR its prereq has been mastered.
 */
export function useLevels() {
  const [states, setStates] = useState<LevelState[]>(() =>
    LEVELS.map(level => ({ level, mastery: 0, unlocked: level.unlockAfter === null, mastered: false })),
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const masteries = await Promise.all(LEVELS.map(l => loadLevelMastery(l.id)));
      if (cancelled) return;
      setStates(computeStates(masteries));
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  /**
   * Record a completed-and-mastered session against a level. Returns the
   * id of any newly-unlocked level (i.e. a level whose prereq just hit
   * the mastery threshold for the first time), or null.
   */
  const recordMastery = useCallback(async (levelId: string): Promise<string | null> => {
    const newCount = await bumpLevelMastery(levelId);
    const masteries = await Promise.all(LEVELS.map(l =>
      l.id === levelId ? Promise.resolve(newCount) : loadLevelMastery(l.id),
    ));
    const next = computeStates(masteries);
    const prev = states;
    setStates(next);
    // Find any level that was locked and is now unlocked.
    for (const s of next) {
      const wasLocked = prev.find(p => p.level.id === s.level.id)?.unlocked === false;
      if (wasLocked && s.unlocked) return s.level.id;
    }
    return null;
  }, [states]);

  return { states, ready, recordMastery };
}

function computeStates(masteries: number[]): LevelState[] {
  const masteryById: Record<string, number> = {};
  LEVELS.forEach((l, i) => { masteryById[l.id] = masteries[i]; });
  return LEVELS.map(level => {
    const mastery = masteryById[level.id];
    const mastered = mastery >= MASTERY_SESSIONS_REQUIRED;
    const prereqMet =
      level.unlockAfter === null ||
      (masteryById[level.unlockAfter] ?? 0) >= MASTERY_SESSIONS_REQUIRED;
    return { level, mastery, unlocked: prereqMet, mastered };
  });
}
